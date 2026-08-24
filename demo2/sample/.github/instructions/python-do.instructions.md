---
applyTo: "backend/**"
---

# Python / FastAPI — Do

## Layering

- Keep routers thin: validate input, call one service function, return a response schema.
- Put every business rule in `app/services/`, so it can be unit-tested without HTTP.
- Access the database only through SQLAlchemy models and `Session`, from services or repositories.
- Declare `response_model` on every endpoint so the OpenAPI contract stays accurate.
- Group endpoints in a router per resource: `routers/missions.py`, `routers/cra.py`.

## Typing and schemas

- Type-hint every function signature, including `-> None`.
- Use separate Pydantic schemas per direction: `MissionCreate`, `MissionUpdate`, `MissionRead`.
- Use `Enum` classes for closed value sets (`CraStatus`, `EntryType`, `UserRole`).
- Use `Decimal` or `float` consistently for day fractions; the domain only allows `1.0` and `0.5`.

## Dependencies and security

- Inject the DB session and the current user with `Depends(get_db)` / `Depends(get_current_user)`.
- Enforce role checks server-side with a dependency such as `Depends(require_manager)`.
- Return `403` when the role is wrong, `404` when the resource does not belong to the caller.

## Errors

- Raise `HTTPException` with an explicit status code and a French `detail` message.
- Map domain exceptions to HTTP status codes in one place (a global exception handler).
- Use `409 Conflict` for business-rule violations (day already full, CRA already submitted).

## Tests

- Write one pytest file per router and per service.
- Name tests `test_<action>_<condition>_<expected>` (e.g. `test_submit_cra_when_empty_returns_409`).
- Cover the happy path, the business rule, and the unauthorised role for every endpoint.

## Style

- Format with `ruff format`; lint with `ruff check`.
- Keep functions under ~30 lines; extract private helpers rather than nesting.
- Name booleans as predicates: `is_locked`, `has_entries`, `can_submit`.
