"""User schemas. Only what the missions feature needs to name a person on screen."""

from app.models.enums import UserRole
from app.schemas.common import CamelModel


class UserRead(CamelModel):
    """A user as the client sees them: who they are, never how they authenticate."""

    id: int
    name: str
    role: UserRole
