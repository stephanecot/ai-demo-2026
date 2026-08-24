# Python / FastAPI — Don't

## Layering

- Don't put business logic in a router — no `if`/`for` over domain rules in the endpoint function.
- Don't query the database from a router; go through a service.
- Don't import a router from a service (dependencies point one way only).
- Don't return SQLAlchemy models directly from an endpoint; return a Pydantic schema.
- Don't create an endpoint without `response_model` or without a status code for creations.

## Data access

- Don't write raw SQL strings; use the SQLAlchemy query API.
- Don't use lazy loading inside a loop (N+1); load relations explicitly.
- Don't commit inside a service that another service may call — commit once per request.
- Don't store computed values that can be derived (monthly totals are computed, not persisted).

## Typing and schemas

- Don't use bare `dict`, `list` or `Any` as a request or response type.
- Don't reuse the same Pydantic schema for input and output.
- Don't accept a client-supplied `id`, `status` or `user_id` in a create/update payload.
- Don't compare enum values against raw strings.

## Security

- Don't trust the role sent by the client; resolve it from the current user server-side.
- Don't rely on the frontend hiding a button as an access control.
- Don't let a consultant read or modify another user's CRA.
- Don't allow any mutation on a CRA whose status is `APPROVED`.

## Errors and tests

- Don't swallow exceptions with a bare `except:` or return `None` on failure.
- Don't return `200` with an error message in the body.
- Don't write English messages in `detail` — the user reads them in French.
- Don't ship a business rule without a test that fails when the rule is removed.
- Don't let tests share state: each test creates its own in-memory database.
