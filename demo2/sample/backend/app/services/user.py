"""Reads over the demo profiles. No rule of its own — US-001 will own this file."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserRead


def _to_read(user: User) -> UserRead:
    """Map the model to its response shape here, so `app.schemas` never has to import
    `app.models` (mirrors `services/mission.py`)."""
    return UserRead(id=user.id, name=user.name, role=user.role)


def list_users(db: Session, role: UserRole | None = None) -> list[UserRead]:
    """Return the users, ordered by name, optionally narrowed to one role."""
    query = select(User).order_by(User.name)
    if role is not None:
        query = query.where(User.role == role)
    return [_to_read(user) for user in db.scalars(query)]
