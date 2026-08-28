"""SQLAlchemy mappings, one module per aggregate.

Every model must be re-exported here so that importing this package makes
`Base.metadata` complete before `init_db()` calls `create_all`.
"""

from app.models.assignment import Assignment
from app.models.enums import CraStatus, EntryType, MissionStatus, UserRole
from app.models.mission import Mission
from app.models.user import User

# US-003: from app.models.cra import Cra
# US-003: from app.models.cra_entry import CraEntry
# US-010: from app.models.notification import Notification

__all__ = [
    "Assignment",
    "CraStatus",
    "EntryType",
    "Mission",
    "MissionStatus",
    "User",
    "UserRole",
]
