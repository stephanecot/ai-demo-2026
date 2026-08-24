"""`GET /api/health` — the contract frozen in docs/architecture/00-socle.md, section 5."""

from datetime import datetime

from fastapi.testclient import TestClient

from app.core.config import settings


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert body["version"] == settings.app_version


def test_health_without_demo_user_header_returns_200(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert "X-Demo-User" not in client.headers


def test_health_with_demo_user_header_returns_200(client: TestClient) -> None:
    response = client.get("/api/health", headers={"X-Demo-User": "1"})

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_returns_exactly_the_documented_fields(client: TestClient) -> None:
    body = client.get("/api/health").json()

    assert set(body) == {"status", "version", "database", "time"}


def test_health_time_is_iso_utc_with_a_trailing_z(client: TestClient) -> None:
    time = client.get("/api/health").json()["time"]

    assert time.endswith("Z")
    parsed = datetime.fromisoformat(time)
    assert parsed.tzinfo is not None
    assert parsed.microsecond == 0
