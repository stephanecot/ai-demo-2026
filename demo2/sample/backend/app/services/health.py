"""Liveness report of the API and its database.

The router must not query the database itself (`python-dont.md`), so the probe lives here.
"""

import logging
from datetime import UTC, datetime

from sqlalchemy import literal, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.common import HealthRead

logger = logging.getLogger(__name__)


def is_database_reachable(db: Session) -> bool:
    """Run the cheapest possible query through the session."""
    try:
        return db.scalar(select(literal(1))) == 1
    except SQLAlchemyError:
        # Degraded is the contract, not a crash — but a silent degradation is untraceable.
        logger.warning("Health probe: the database is unreachable", exc_info=True)
        return False


def read_health(db: Session) -> HealthRead:
    """Build the health report; a database failure degrades it instead of raising."""
    is_reachable = is_database_reachable(db)
    return HealthRead(
        status="ok" if is_reachable else "degraded",
        version=settings.app_version,
        database="ok" if is_reachable else "ko",
        time=datetime.now(UTC),
    )
