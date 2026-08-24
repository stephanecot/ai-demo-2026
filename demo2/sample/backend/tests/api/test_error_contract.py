"""Every non-2xx body is `{"detail": <french string>}` — ADR-0002.

The 422 flattener is tested at unit level: no endpoint takes a payload yet, and the rule
must already hold when the first one lands.
"""

from collections.abc import Iterator
from datetime import date

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.errors import (
    ConflictError,
    DomainError,
    NotFoundError,
    flatten_validation_errors,
    register_exception_handlers,
)
from app.main import app
from app.schemas.common import CamelModel


def test_unknown_route_returns_a_french_string_detail(client: TestClient) -> None:
    response = client.get("/api/inconnu")

    assert response.status_code == 404
    assert response.json() == {"detail": "Ressource introuvable."}


def test_flatten_validation_errors_when_field_is_missing_names_the_field() -> None:
    errors: list[dict[str, object]] = [{"loc": ("body", "client"), "type": "missing"}]

    assert flatten_validation_errors(errors) == "Le champ « client » est obligatoire."


def test_flatten_validation_errors_translates_the_camel_case_wire_name_to_french() -> None:
    """Pydantic fills `loc` with the wire alias; the user must never read `startDate`."""
    errors: list[dict[str, object]] = [{"loc": ("body", "startDate"), "type": "missing"}]

    detail = flatten_validation_errors(errors)

    assert detail == "Le champ « date de début » est obligatoire."
    assert "startDate" not in detail


def test_flatten_validation_errors_when_type_is_unknown_falls_back_to_invalid() -> None:
    errors: list[dict[str, object]] = [{"loc": ("body", "fraction"), "type": "exotic_error"}]

    assert flatten_validation_errors(errors) == "Le champ « fraction de journée » est invalide."


def test_flatten_validation_errors_when_field_is_unknown_hides_the_technical_name() -> None:
    """An unmapped field degrades to a generic French sentence rather than leaking."""
    errors: list[dict[str, object]] = [{"loc": ("body", "internalRef"), "type": "missing"}]

    detail = flatten_validation_errors(errors)

    assert detail == "La requête est invalide."
    assert "internalRef" not in detail


def test_flatten_validation_errors_joins_several_errors_into_one_string() -> None:
    errors: list[dict[str, object]] = [
        {"loc": ("body", "client"), "type": "missing"},
        {"loc": ("body", "startDate"), "type": "date_parsing"},
    ]

    detail = flatten_validation_errors(errors)

    assert isinstance(detail, str)
    assert "« client »" in detail
    assert "« date de début »" in detail


def test_flatten_validation_errors_without_a_field_returns_a_generic_message() -> None:
    assert flatten_validation_errors([{"loc": (), "type": "missing"}]) == "La requête est invalide."


def test_validation_error_detail_is_a_string_not_a_list() -> None:
    """The whole point of the flattener: `body.detail` never becomes an array."""
    probe = FastAPI()
    register_exception_handlers(probe)

    class Payload(CamelModel):
        client: str

    @probe.post("/probe", response_model=Payload)
    def create(payload: Payload) -> Payload:
        return payload

    with TestClient(probe) as probe_client:
        response = probe_client.post("/probe", json={})

    assert response.status_code == 422
    assert response.json() == {"detail": "Le champ « client » est obligatoire."}


def test_domain_error_handler_maps_status_and_french_detail() -> None:
    probe = FastAPI()
    register_exception_handlers(probe)

    @probe.get("/conflit")
    def conflict() -> None:
        raise ConflictError("Ce jour est déjà complet.")

    with TestClient(probe) as probe_client:
        response = probe_client.get("/conflit")

    assert response.status_code == 409
    assert response.json() == {"detail": "Ce jour est déjà complet."}


def test_validation_error_on_a_camel_case_field_reads_in_french_end_to_end() -> None:
    """The wire alias reaches `loc`; what the user reads must still be a French label."""
    probe = FastAPI()
    register_exception_handlers(probe)

    class Payload(CamelModel):
        start_date: date

    @probe.post("/probe", response_model=Payload)
    def create(payload: Payload) -> Payload:
        return payload

    with TestClient(probe) as probe_client:
        response = probe_client.post("/probe", json={})

    assert response.status_code == 422
    assert response.json() == {"detail": "Le champ « date de début » est obligatoire."}


def test_domain_errors_carry_a_french_default_message() -> None:
    assert NotFoundError().status_code == 404
    assert NotFoundError().message == "Ressource introuvable."
    assert isinstance(NotFoundError(), DomainError)


def test_unhandled_exception_returns_a_french_string_detail_not_plain_text() -> None:
    """A bug in an endpoint must not break the `{"detail": string}` contract (ADR-0002)."""
    probe = FastAPI()
    register_exception_handlers(probe)

    @probe.get("/boom")
    def boom() -> None:
        raise RuntimeError("unexpected failure")

    # `raise_server_exceptions=False` makes the TestClient behave like a real server:
    # it returns the handler's response instead of re-raising into the test.
    with TestClient(probe, raise_server_exceptions=False) as probe_client:
        response = probe_client.get("/boom")

    assert response.status_code == 500
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"detail": "Une erreur interne est survenue."}


def test_unhandled_exception_on_the_real_app_also_returns_the_contract() -> None:
    """The handler is registered on the application itself, not only on a probe."""

    def broken_db() -> Iterator[Session]:
        raise RuntimeError("unexpected failure")
        yield  # pragma: no cover - unreachable, keeps the dependency a generator

    app.dependency_overrides[get_db] = broken_db
    try:
        with TestClient(app, raise_server_exceptions=False) as test_client:
            response = test_client.get("/api/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.json() == {"detail": "Une erreur interne est survenue."}


def test_openapi_documents_the_error_response_schema() -> None:
    """`/docs` is the contract `react-dev` codes against, so it must show the error shape."""
    schema = app.openapi()

    assert "ErrorResponse" in schema["components"]["schemas"]
    detail = schema["components"]["schemas"]["ErrorResponse"]["properties"]["detail"]
    assert detail["type"] == "string"


def test_openapi_never_documents_the_default_list_shaped_422() -> None:
    """FastAPI's `HTTPValidationError` contradicts the flattened string `detail`."""
    schema = app.openapi()

    assert "HTTPValidationError" not in schema["components"]["schemas"]
    assert "ValidationError" not in schema["components"]["schemas"]


def test_openapi_declares_the_error_shape_on_every_documented_operation() -> None:
    schema = app.openapi()
    reference = {"$ref": "#/components/schemas/ErrorResponse"}

    for path, operations in schema["paths"].items():
        for method, operation in operations.items():
            for status in ("401", "403", "404", "409", "422", "500"):
                declared = operation["responses"][status]["content"]["application/json"]["schema"]
                assert declared == reference, f"{method.upper()} {path} → {status}"
