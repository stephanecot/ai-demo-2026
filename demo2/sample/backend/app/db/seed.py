"""Demo data, inserted at startup.

**Idempotent** and **deterministic**: no random value, no `datetime.now()` for a business
date, and running it twice changes nothing. The dates below are fixed literals for exactly
that reason — a seed that drifts with the clock makes a demo unrepeatable.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.enums import MissionStatus, UserRole
from app.models.mission import Mission
from app.models.user import User

# name, email, role
_USERS: tuple[tuple[str, str, UserRole], ...] = (
    ("Paul Durand", "paul.durand@example.com", UserRole.MANAGER),
    ("Jean Dupont", "jean.dupont@example.com", UserRole.CONSULTANT),
    ("Marie Martin", "marie.martin@example.com", UserRole.CONSULTANT),
)

# label, client, start, end, status, description, assignee emails
_MISSIONS: tuple[tuple[str, str, date, date | None, MissionStatus, str, tuple[str, ...]], ...] = (
    (
        "Refonte SI",
        "ACME",
        date(2026, 1, 1),
        None,
        MissionStatus.ACTIVE,
        "Refonte du système d'information de gestion.",
        ("jean.dupont@example.com", "marie.martin@example.com"),
    ),
    (
        "Portail client",
        "ACME",
        date(2026, 6, 1),
        date(2026, 12, 31),
        MissionStatus.ACTIVE,
        "Portail self-service pour les clients finaux.",
        ("jean.dupont@example.com",),
    ),
    (
        "Audit sécurité",
        "Globex",
        date(2025, 1, 1),
        date(2025, 6, 30),
        MissionStatus.CLOSED,
        "Audit de sécurité applicative, mission terminée.",
        ("marie.martin@example.com",),
    ),
)


def seed_demo_data(db: Session) -> None:
    """Insert the demo dataset if it is missing. Does nothing on an already seeded base."""
    if db.scalar(select(func.count()).select_from(User)):
        return

    users = {email: User(name=name, email=email, role=role) for name, email, role in _USERS}
    db.add_all(users.values())
    db.flush()

    for label, client, start, end, status, description, assignees in _MISSIONS:
        mission = Mission(
            label=label,
            client=client,
            start_date=start,
            end_date=end,
            status=status,
            description=description,
        )
        mission.assignments = [Assignment(user=users[email]) for email in assignees]
        db.add(mission)

    db.commit()
