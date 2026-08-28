"""`get_db` — the session dependency every future endpoint hangs off.

The API tests never exercise it: `conftest` overrides it with the per-test in-memory
session. So its own contract — yield a usable session, and close it whatever happens —
is pinned here. Remove the `finally: db.close()` and both tests fail.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import literal, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_manager
from app.core.errors import ForbiddenError, UnauthorizedError
from app.models.enums import UserRole
from app.models.user import User


def test_get_db_yields_a_usable_session() -> None:
    generator = get_db()
    db = next(generator)

    assert db.scalar(select(literal(1))) == 1

    with pytest.raises(StopIteration):
        next(generator)


def test_get_db_closes_the_session_when_the_request_succeeds() -> None:
    generator = get_db()
    db = next(generator)
    db.execute(select(literal(1)))
    assert db.in_transaction() is True

    with pytest.raises(StopIteration):
        next(generator)

    assert db.in_transaction() is False


def test_get_db_closes_the_session_when_the_request_fails() -> None:
    """A failing endpoint must not leak its connection back into the pool open."""
    generator = get_db()
    db = next(generator)
    db.execute(select(literal(1)))

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("unexpected failure"))

    assert db.in_transaction() is False


# --- get_current_user / require_manager -----------------------------------------------
#
# The identity slice US-002 borrows from US-001. Every failure mode answers the same 401
# on purpose: an absent header, a non-numeric one and an unknown id must be
# indistinguishable, so there is nothing for a caller to probe.


def test_get_current_user_without_header_raises_unauthorized(db: Session) -> None:
    with pytest.raises(UnauthorizedError):
        get_current_user(db=db, x_demo_user=None)


def test_get_current_user_with_a_non_numeric_header_raises_unauthorized(db: Session) -> None:
    with pytest.raises(UnauthorizedError):
        get_current_user(db=db, x_demo_user="jean.dupont")


def test_get_current_user_with_an_unknown_id_raises_unauthorized(db: Session) -> None:
    with pytest.raises(UnauthorizedError):
        get_current_user(db=db, x_demo_user="4242")


def test_get_current_user_with_a_seeded_id_returns_that_user(db: Session, consultant: User) -> None:
    resolved = get_current_user(db=db, x_demo_user=str(consultant.id))

    assert resolved.id == consultant.id
    assert resolved.role is UserRole.CONSULTANT


def test_require_manager_passes_the_manager_through(manager: User) -> None:
    assert require_manager(current_user=manager) is manager


def test_require_manager_for_a_consultant_raises_forbidden(consultant: User) -> None:
    with pytest.raises(ForbiddenError) as excinfo:
        require_manager(current_user=consultant)

    assert excinfo.value.message == "Action réservée aux managers."
    assert excinfo.value.status_code == 403


def test_health_answers_without_the_demo_header(client: TestClient) -> None:
    """The public route must keep working once identity exists, or the shell page breaks."""
    assert client.get("/api/health").status_code == 200
