"""SQLAlchemy mappings, one module per aggregate.

Every model must be re-exported here so that importing this package makes
`Base.metadata` complete before `init_db()` calls `create_all`.
"""

from app.models.enums import CraStatus, EntryType, UserRole

# US-001: from app.models.user import User
# US-004: from app.models.mission import Mission
# US-004: from app.models.assignment import Assignment
# US-002: from app.models.cra import Cra
# US-002: from app.models.cra_entry import CraEntry
# US-010: from app.models.notification import Notification

__all__ = ["CraStatus", "EntryType", "UserRole"]
