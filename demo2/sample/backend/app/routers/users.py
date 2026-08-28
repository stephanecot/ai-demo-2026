"""`GET /api/users` — the demo profile list.

Public, like `GET /api/health`, and for the same reason: it is what the profile picker
reads *before* anyone is identified. It exposes a name and a role, nothing more.

Borrowed from US-001 (see the US-002 plan): the missions screen needs it twice over — to
pick who you are, and to choose the consultants to assign to a mission.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.enums import UserRole
from app.schemas.user import UserRead
from app.services import user as user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserRead], summary="Liste des profils de démonstration")
def list_users(
    role: UserRole | None = Query(default=None, description="Filtre sur le rôle."),
    db: Session = Depends(get_db),
) -> list[UserRead]:
    """Return the demo profiles, optionally narrowed to one role."""
    return user_service.list_users(db, role=role)
