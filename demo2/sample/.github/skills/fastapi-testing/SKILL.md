---
name: fastapi-testing
description: Use when writing or fixing pytest tests for the CRA backend — fixtures, in-memory SQLite, API tests per endpoint, business-rule unit tests, role-authorisation tests.
---

# FastAPI testing

Follow `.github/instructions/python-do.instructions.md`. Every endpoint gets three tests: happy path,
business rule, wrong role.

## Layout

```
backend/tests/
  conftest.py              fixtures
  api/test_missions.py     one file per router
  api/test_cra.py
  services/test_cra_rules.py   one file per service with real rules
```

## Fixtures

```python
@pytest.fixture
def db() -> Iterator[Session]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False},
                           poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture
def users(db: Session) -> dict[str, User]:
    return seed_demo_users(db)   # jean, marie (CONSULTANT), paul (MANAGER)

@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def as_jean(client: TestClient, users) -> TestClient:
    client.headers["X-Demo-User"] = str(users["jean"].id)
    return client
```

Each test builds its own in-memory database — no shared state, no `cra.db` file.

## Naming

`test_<action>_<condition>_<expected>`:

```python
def test_submit_cra_when_empty_returns_409(...)
def test_add_entry_when_day_already_full_returns_409(...)
def test_create_mission_as_consultant_returns_403(...)
def test_list_missions_returns_only_assigned_missions(...)
```

## API test

```python
def test_create_mission_as_manager_returns_201(as_paul: TestClient) -> None:
    response = as_paul.post("/api/missions", json={
        "name": "Refonte portail", "client": "ACME", "start_date": "2026-01-05",
    })

    assert response.status_code == 201
    assert response.json()["name"] == "Refonte portail"
    assert response.json()["is_closed"] is False


def test_create_mission_as_consultant_returns_403(as_jean: TestClient) -> None:
    response = as_jean.post("/api/missions", json={
        "name": "Refonte portail", "client": "ACME", "start_date": "2026-01-05",
    })

    assert response.status_code == 403
```

## Business-rule test

Test the service directly — no HTTP, faster and clearer:

```python
def test_add_entry_when_day_already_full_raises(db: Session, users) -> None:
    cra = cra_service.get_or_create(db, users["jean"], 2026, 3)
    cra_service.add_entry(db, cra, day=date(2026, 3, 2), entry_type=EntryType.MISSION,
                          mission_id=1, fraction=1.0)

    with pytest.raises(DayAlreadyFullError):
        cra_service.add_entry(db, cra, day=date(2026, 3, 2), entry_type=EntryType.RTT,
                              fraction=0.5)
```

Rules that must have a dedicated test:

- sum of fractions on one day ≤ 1
- no entry on a weekend or a French public holiday (test 1 May, Easter Monday, 14 July)
- lifecycle transitions, including forbidden ones (modify an `APPROVED` CRA)
- a consultant cannot read or submit another consultant's CRA
- a manager only sees CRAs of their own team

## Assertions

- Assert the status code first, then the payload.
- Assert on business meaning, not on the whole JSON body.
- For errors, assert the status code and that `detail` is non-empty — not its exact wording.

## Checklist

- [ ] Every new endpoint has happy path + business rule + wrong role.
- [ ] Every business rule has a test that fails if the rule is removed.
- [ ] Tests use the in-memory database and no global state.
- [ ] No `time.sleep`, no real HTTP call, no dependency on execution order.
- [ ] `uv run pytest` is green before finishing.
