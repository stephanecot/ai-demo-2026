"""Shared FastAPI dependencies.

`get_current_user` and `require_manager` land here with US-001; they resolve the
`X-Demo-User` header server-side so the client's claimed role is never trusted.
"""

from collections.abc import Iterator

from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Iterator[Session]:
    """Yield a request-scoped session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
