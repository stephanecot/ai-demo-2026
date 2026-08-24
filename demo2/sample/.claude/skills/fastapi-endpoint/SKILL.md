---
name: fastapi-endpoint
description: Use when adding or changing a REST endpoint in the CRA FastAPI backend — router, Pydantic schemas, service call, status codes, error handling, role checks, pagination and filters.
---

# FastAPI endpoint

Follow `.claude/rules/python-do.md` and `python-dont.md`. This skill shows the shape of
one endpoint end to end, on the `Mission` resource (US-004).

## Layers

```
routers/missions.py   HTTP only: path, params, response_model, status code, dependencies
schemas/mission.py    MissionCreate / MissionUpdate / MissionRead
services/mission.py   business rules, raises domain errors
models/mission.py     SQLAlchemy mapping
```

## Route naming

| Action | Route | Status |
|---|---|---|
| list | `GET /api/missions` | 200 |
| read | `GET /api/missions/{mission_id}` | 200 |
| create | `POST /api/missions` | 201 |
| update | `PUT /api/missions/{mission_id}` | 200 |
| sub-resource | `POST /api/missions/{mission_id}/affectations` | 201 |
| action | `POST /api/cra/{cra_id}/valider` | 200 |

Plural nouns for collections; French verbs for domain actions, matching `specs/`.

## Schemas

```python
class MissionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    client: str = Field(min_length=1, max_length=120)
    start_date: date
    end_date: date | None = None
    description: str | None = None

class MissionRead(BaseModel):
    id: int
    name: str
    client: str
    start_date: date
    end_date: date | None
    is_closed: bool
    model_config = ConfigDict(from_attributes=True)
```

Never accept `id`, `is_closed` or `user_id` from the client.

## Router

```python
router = APIRouter(prefix="/api/missions", tags=["missions"])

@router.get("", response_model=list[MissionRead])
def list_missions(
    client: str | None = None,
    is_closed: bool | None = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Mission]:
    return mission_service.list_visible(db, user, client, is_closed, limit, offset)

@router.post("", response_model=MissionRead, status_code=201)
def create_mission(
    payload: MissionCreate,
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
) -> Mission:
    return mission_service.create(db, manager, payload)
```

The router has no `if` on business rules: filtering by role happens in the service,
authorisation happens in the dependency.

## Dependencies

```python
def get_current_user(x_demo_user: int = Header(...), db: Session = Depends(get_db)) -> User: ...

def require_manager(user: User = Depends(get_current_user)) -> User:
    if user.role is not UserRole.MANAGER:
        raise HTTPException(403, "Action réservée aux managers.")
    return user
```

## Errors

Services raise domain errors; one handler maps them to HTTP:

| Situation | Status | Example `detail` (French) |
|---|---|---|
| unknown / not visible | 404 | `"Mission introuvable."` |
| wrong role | 403 | `"Action réservée aux managers."` |
| invalid payload | 422 | handled by Pydantic |
| business rule broken | 409 | `"Ce jour est déjà complet."` |
| forbidden transition | 409 | `"Ce CRA a déjà été validé."` |

```python
@app.exception_handler(DomainError)
def handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})
```

## Checklist

- [ ] Route, verb and status code match the user story's technical notes.
- [ ] `response_model` set; no SQLAlchemy model returned.
- [ ] Separate input and output schemas; no client-controlled `id`/`status`.
- [ ] Role and ownership enforced server-side.
- [ ] Business rules in the service, not the router.
- [ ] `detail` messages written in French.
- [ ] Tests: happy path, business rule, wrong role.
- [ ] `/docs` renders the endpoint correctly.
