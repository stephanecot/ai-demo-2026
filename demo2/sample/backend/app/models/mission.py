"""A client engagement activity can be charged to.

A mission is never deleted (US-002 FR-007): it is closed, so no declaration is ever left
pointing at a row that vanished.
"""

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MissionStatus

if TYPE_CHECKING:
    from app.models.assignment import Assignment


class Mission(Base):
    """One engagement for one client, over a period that may be open-ended."""

    __tablename__ = "missions"
    # `label` is unique per client, not globally: two clients may run a "Refonte SI".
    # Both columns are NOCASE, so the constraint is case-insensitive at rest and a
    # `== "acme"` filter matches "ACME" without a `lower()` on either side.
    __table_args__ = (UniqueConstraint("client", "label"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(120, collation="NOCASE"), nullable=False)
    client: Mapped[str] = mapped_column(String(120, collation="NOCASE"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    # None means the mission runs indefinitely from `start_date` (FR-003).
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(
        String(2000), nullable=False, default="", server_default=""
    )
    status: Mapped[MissionStatus] = mapped_column(
        SAEnum(MissionStatus, native_enum=False, length=20),
        nullable=False,
        default=MissionStatus.ACTIVE,
        server_default=MissionStatus.ACTIVE.value,
    )

    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="mission", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Mission id={self.id} client={self.client!r} label={self.label!r}>"
