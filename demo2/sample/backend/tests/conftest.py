"""Shared fixtures: one in-memory database per test, no `cra.db` file, no shared state."""

import os

# The application engine is built at import time, and the lifespan calls `init_db()`.
# Pointing the URL at an in-memory database *before* `app.main` is imported keeps the
# test run from ever creating a `cra.db` file.
os.environ.setdefault("DATABASE_URL", "sqlite://")

from collections.abc import Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.deps import get_db  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.seed import seed_demo_data  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402


@pytest.fixture
def db() -> Iterator[Session]:
    """An isolated in-memory SQLite database, created and dropped per test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    """A TestClient whose requests all run against the test session."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def demo_users(db: Session) -> dict[str, User]:
    """Seed the demo dataset and return its users keyed by lowercase first name.

    Keyed by name rather than by id: the ids happen to be 1, 2, 3 in a fresh database,
    and a test that hard-codes them would pass for the wrong reason.
    """
    seed_demo_data(db)
    return {user.name.split()[0].lower(): user for user in db.scalars(select(User))}


@pytest.fixture
def manager(demo_users: dict[str, User]) -> User:
    """Paul Durand — the seeded MANAGER."""
    return demo_users["paul"]


@pytest.fixture
def consultant(demo_users: dict[str, User]) -> User:
    """Jean Dupont — a seeded CONSULTANT, assigned to two missions."""
    return demo_users["jean"]


@pytest.fixture
def other_consultant(demo_users: dict[str, User]) -> User:
    """Marie Martin — the other seeded CONSULTANT, used to prove isolation."""
    return demo_users["marie"]


@pytest.fixture
def manager_client(db: Session, manager: User) -> Iterator[TestClient]:
    """A TestClient identified as the manager on every request."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app, headers={"X-Demo-User": str(manager.id)}) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def consultant_client(db: Session, consultant: User) -> Iterator[TestClient]:
    """A TestClient identified as a consultant — used for every 403 test."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app, headers={"X-Demo-User": str(consultant.id)}) as test_client:
        yield test_client
    app.dependency_overrides.clear()
