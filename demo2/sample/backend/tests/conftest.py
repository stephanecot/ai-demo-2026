"""Shared fixtures: one in-memory database per test, no `cra.db` file, no shared state."""

import os

# The application engine is built at import time, and the lifespan calls `init_db()`.
# Pointing the URL at an in-memory database *before* `app.main` is imported keeps the
# test run from ever creating a `cra.db` file.
os.environ.setdefault("DATABASE_URL", "sqlite://")

from collections.abc import Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.deps import get_db  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402


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
