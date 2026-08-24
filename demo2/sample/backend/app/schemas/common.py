"""Shared schema base and the schemas of the skeleton.

Wire convention (ADR-0002): `snake_case` in Python, `camelCase` in JSON. Every schema of
the project inherits `CamelModel`, so the rule holds without a per-field alias.
"""

from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer
from pydantic.alias_generators import to_camel


def to_iso_utc(value: datetime) -> str:
    """Render a datetime as ISO-8601 UTC with a trailing `Z`, second precision."""
    aware = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
    return aware.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


# Use for every timestamp crossing the HTTP boundary: `"2026-08-24T09:30:00Z"`.
IsoDateTime = Annotated[datetime, PlainSerializer(to_iso_utc, return_type=str, when_used="json")]


class CamelModel(BaseModel):
    """Base of every request and response schema."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        # Invariant: `serialize_by_alias` applies in python mode too, so `model_dump()`
        # returns camelCase keys (`{"startDate": ...}`), not snake_case. Never feed it
        # straight to a SQLAlchemy model — `Mission(**payload.model_dump())` would raise.
        # Use `model_dump(by_alias=False)` when you need the Python field names.
        serialize_by_alias=True,
    )


class ErrorResponse(CamelModel):
    """The single shape of every non-2xx body. `detail` is French and displayable as is."""

    detail: str = Field(examples=["Mission introuvable."])


# Declared once on the app (`main.py`) so `/docs` documents the real error shape on every
# route. It also *replaces* FastAPI's default 422 `HTTPValidationError`, whose list-shaped
# body contradicts the string `detail` the flattener actually returns (ADR-0002).
ERROR_RESPONSES: dict[int | str, dict[str, object]] = {
    401: {"model": ErrorResponse, "description": "Profil de démonstration inconnu"},
    403: {"model": ErrorResponse, "description": "Action non autorisée"},
    404: {"model": ErrorResponse, "description": "Ressource introuvable"},
    409: {"model": ErrorResponse, "description": "Règle métier non respectée"},
    422: {"model": ErrorResponse, "description": "Requête invalide"},
    500: {"model": ErrorResponse, "description": "Erreur interne"},
}


class HealthRead(CamelModel):
    """Liveness of the API and of its database."""

    status: Literal["ok", "degraded"]
    version: str
    database: Literal["ok", "ko"]
    time: IsoDateTime
