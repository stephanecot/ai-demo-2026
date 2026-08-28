"""Mission schemas — one per direction (`python-do.md`).

`status` and `assignees` never appear on an input schema: a status changes only through
the closure route, assignees only through the assignment routes. Accepting them here would
let a client set them directly.
"""

from datetime import date
from typing import Any

from pydantic import Field, field_validator

from app.models.enums import MissionStatus
from app.schemas.common import CamelModel
from app.schemas.user import UserRead


class _MissionWrite(CamelModel):
    """Fields common to creation and update. Never used as a route body on its own."""

    label: str = Field(min_length=1, max_length=120)
    client: str = Field(min_length=1, max_length=120)
    start_date: date
    end_date: date | None = None
    description: str = Field(default="", max_length=2000)

    @field_validator("label", "client", "description", mode="before")
    @classmethod
    def _strip(cls, value: Any) -> Any:
        """Trim before the length checks, so "   " fails as empty rather than passing."""
        return value.strip() if isinstance(value, str) else value


class MissionCreate(_MissionWrite):
    """Body of `POST /api/missions`."""


class MissionUpdate(_MissionWrite):
    """Body of `PUT /api/missions/{mission_id}` — a full replacement of the mission."""


class AssignmentCreate(CamelModel):
    """Body of `POST /api/missions/{mission_id}/affectations`."""

    user_ids: list[int] = Field(min_length=1)


class MissionRead(CamelModel):
    """The single response shape of the missions API."""

    id: int
    label: str
    client: str
    start_date: date
    end_date: date | None
    description: str
    status: MissionStatus
    assignees: list[UserRead]
