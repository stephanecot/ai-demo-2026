"""Shared FastAPI dependencies.

`get_current_user` and `require_manager` belong to US-001; US-002 needs them to enforce
its manager-only rules, so they land here early (see the US-002 plan, "Prerequisite:
identity"). They resolve the `X-Demo-User` header server-side, so the client's claimed
role is never trusted.
"""

from collections.abc import Iterator

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, UnauthorizedError
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.user import User


def get_db() -> Iterator[Session]:
    """Yield a request-scoped session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    x_demo_user: str | None = Header(
        default=None,
        alias="X-Demo-User",
        description="Identifiant numérique du profil de démonstration.",
    ),
) -> User:
    """Resolve the acting user from the demo header, or refuse the request.

    Every failure is the same 401: an absent header, a non-numeric one and an unknown id
    are indistinguishable to the caller on purpose — there is nothing to probe for.
    """
    if x_demo_user is None:
        raise UnauthorizedError()
    try:
        user_id = int(x_demo_user)
    except ValueError:
        raise UnauthorizedError() from None
    user = db.get(User, user_id)
    if user is None:
        raise UnauthorizedError()
    return user


def require_manager(current_user: User = Depends(get_current_user)) -> User:
    """Allow the request only for a manager. Hiding a button is not an access control."""
    if current_user.role is not UserRole.MANAGER:
        raise ForbiddenError("Action réservée aux managers.")
    return current_user
