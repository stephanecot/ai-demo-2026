"""`get_db` — the session dependency every future endpoint hangs off.

The API tests never exercise it: `conftest` overrides it with the per-test in-memory
session. So its own contract — yield a usable session, and close it whatever happens —
is pinned here. Remove the `finally: db.close()` and both tests fail.
"""

import pytest
from sqlalchemy import literal, select

from app.core.deps import get_db


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
