"""Demo data, inserted at startup.

Filled in phase 1 step 2 with Paul (MANAGER), Jean and Marie (CONSULTANT) and their
missions. It must stay **idempotent** and **deterministic**: no random value, no
`datetime.now()` for a seeded business date, and running it twice changes nothing.
"""

from sqlalchemy.orm import Session


def seed_demo_data(db: Session) -> None:
    """Insert the demo dataset if it is missing. Currently seeds nothing."""
    # Phase 1 step 2: guard on `db.scalar(select(func.count()).select_from(User)) == 0`,
    # then insert the users, the missions and the assignments.
    return None
