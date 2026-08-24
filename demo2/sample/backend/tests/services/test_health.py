"""Health service: the database probe and the degraded report."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.health import is_database_reachable, read_health


def test_read_health_when_database_is_reachable_returns_ok(db: Session) -> None:
    report = read_health(db)

    assert report.status == "ok"
    assert report.database == "ok"
    assert report.version == settings.app_version


def test_read_health_when_database_is_unreachable_returns_degraded() -> None:
    unreachable = create_engine("sqlite:////nonexistent-directory/cra.db")

    with Session(unreachable) as broken_session:
        report = read_health(broken_session)

        assert report.status == "degraded"
        assert report.database == "ko"


def test_is_database_reachable_when_database_is_reachable_returns_true(db: Session) -> None:
    assert is_database_reachable(db) is True
