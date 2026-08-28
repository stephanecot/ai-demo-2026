"""The link that makes a mission chargeable by a consultant.

Carries no period of its own: the mission's own start and end dates govern (US-002,
Assumptions). Changing that would change the declarability query and nothing else.
"""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.mission import Mission
    from app.models.user import User


class Assignment(Base):
    """One consultant on one mission, at most once."""

    __tablename__ = "assignments"
    __table_args__ = (UniqueConstraint("user_id", "mission_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="assignments")
    mission: Mapped["Mission"] = relationship(back_populates="assignments")

    def __repr__(self) -> str:
        return f"<Assignment user_id={self.user_id} mission_id={self.mission_id}>"
