"""The people of the demo: consultants who declare, managers who validate.

Borrowed from US-001 by US-002 — see `specs/002-mission-management/plan.md`, section
"Prerequisite: identity": a manager-only rule needs a role to enforce it against. Only
what US-002 needs is here; US-001 owns any further column.
"""

from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.assignment import Assignment


class User(Base):
    """A demo profile. `id` is what the `X-Demo-User` header carries."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, native_enum=False, length=20), nullable=False
    )

    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name!r} role={self.role}>"
