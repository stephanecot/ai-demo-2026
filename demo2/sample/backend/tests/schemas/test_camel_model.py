"""`CamelModel` is the camelCase decision of ADR-0002 — snake_case in Python, camelCase
on the wire. No skeleton schema has a two-word field yet, so the rule is pinned here on a
probe schema: remove `alias_generator` or `populate_by_name` from `CamelModel` and these
tests fail.
"""

from datetime import date

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas.common import CamelModel


class MissionProbe(CamelModel):
    """A two-word field is what actually exercises the alias generator."""

    client: str
    start_date: date


def test_model_dump_json_spells_a_two_word_field_in_camel_case() -> None:
    probe = MissionProbe(client="ACME", start_date=date(2026, 1, 5))

    payload = probe.model_dump_json()

    assert '"startDate":"2026-01-05"' in payload
    assert "start_date" not in payload


def test_model_dump_uses_the_alias_in_python_mode_too() -> None:
    """Documented invariant: `model_dump()` yields camelCase, never the field name."""
    dumped = MissionProbe(client="ACME", start_date=date(2026, 1, 5)).model_dump()

    assert set(dumped) == {"client", "startDate"}
    assert dumped["startDate"] == date(2026, 1, 5)
    assert MissionProbe(client="ACME", start_date=date(2026, 1, 5)).model_dump(by_alias=False)[
        "start_date"
    ] == date(2026, 1, 5)


def test_openapi_schema_exposes_the_camel_case_property_name() -> None:
    app = FastAPI()

    @app.post("/probe", response_model=MissionProbe)
    def create(payload: MissionProbe) -> MissionProbe:
        return payload

    properties = app.openapi()["components"]["schemas"]["MissionProbe"]["properties"]

    assert set(properties) == {"client", "startDate"}


def test_the_wire_accepts_the_camel_case_spelling() -> None:
    app = FastAPI()

    @app.post("/probe", response_model=MissionProbe)
    def create(payload: MissionProbe) -> MissionProbe:
        return payload

    with TestClient(app) as client:
        response = client.post("/probe", json={"client": "ACME", "startDate": "2026-01-05"})

    assert response.status_code == 200
    assert response.json() == {"client": "ACME", "startDate": "2026-01-05"}


def test_populate_by_name_still_accepts_the_snake_case_input() -> None:
    """Python code may build a schema with its field names, not only with the aliases."""
    probe = MissionProbe.model_validate({"client": "ACME", "start_date": "2026-01-05"})

    assert probe.start_date == date(2026, 1, 5)
    assert MissionProbe(client="ACME", start_date=date(2026, 1, 5)).start_date == date(2026, 1, 5)


def test_an_unknown_spelling_is_still_rejected() -> None:
    """`populate_by_name` widens the accepted names; it does not disable validation."""
    with pytest.raises(ValidationError):
        MissionProbe.model_validate({"client": "ACME", "startdate": "2026-01-05"})
