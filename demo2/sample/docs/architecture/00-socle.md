# 00 — Project skeleton (socle)

> Phase 1, step 1 of [PLAN.MD](../../../PLAN.MD). Design note for the **skeleton only**:
> structure, configuration, one health endpoint, one shell page. No business feature.
> Related ADRs: [ADR-0001](../adr/0001-monorepo-layout.md), [ADR-0002](../adr/0002-frontend-backend-contract.md).

## 1. Problem

We must lay down a two-sided skeleton — `backend/` (FastAPI + SQLAlchemy + SQLite) and
`frontend/` (Vite + React + TypeScript) — that boots on both sides today and can absorb
US-001 to US-010 without a single folder being moved later.
The only functional surface at this step is `GET /api/health` and a shell page that
displays its result; everything else is empty packages placed where the code will land.
The real deliverable is therefore the **contract and the conventions**, not the code:
they are what lets `fastapi-dev` and `react-dev` start in parallel this minute.

## 2. Backend tree — `backend/`

```
backend/
├── pyproject.toml            deps + ruff + pytest config (uv-managed)
├── uv.lock                   committed, so the demo is reproducible
├── .python-version           "3.12"
├── .gitignore                cra.db, .venv, __pycache__, .pytest_cache
├── cra.db                    generated at first run — never committed
├── app/
│   ├── __init__.py
│   ├── main.py               app factory: lifespan, CORS, exception handlers, router registration
│   ├── core/                 cross-cutting plumbing, no domain rule
│   │   ├── __init__.py
│   │   ├── config.py         Settings (pydantic-settings): database_url, cors_origins, app_version
│   │   ├── errors.py         DomainError hierarchy (NotFound/Forbidden/Conflict) + HTTP handlers
│   │   └── deps.py           get_db, and later get_current_user / require_manager (US-001)
│   ├── db/                   engine and lifecycle, no business code
│   │   ├── __init__.py
│   │   ├── base.py           DeclarativeBase + FK/index naming convention
│   │   ├── session.py        engine, SessionLocal, init_db() (create_all)
│   │   └── seed.py           seed_demo_data() — filled at phase 1 step 2, called from lifespan
│   ├── models/               SQLAlchemy mappings, one module per aggregate
│   │   ├── __init__.py       re-exports every model so Base.metadata is complete
│   │   └── enums.py          UserRole, CraStatus, EntryType (StrEnum)
│   ├── schemas/              Pydantic v2, one module per resource
│   │   ├── __init__.py
│   │   └── common.py         CamelModel base, ErrorResponse, HealthRead
│   ├── services/             ALL business rules live here — unit-testable without HTTP
│   │   └── __init__.py
│   └── routers/              HTTP only: path, params, response_model, status, dependencies
│       ├── __init__.py
│       └── health.py         GET /api/health
└── tests/
    ├── __init__.py
    ├── conftest.py           in-memory SQLite engine, TestClient, per-role client fixtures
    ├── api/
    │   ├── __init__.py
    │   └── test_health.py    one file per router
    └── services/
        └── __init__.py       one file per service with real rules
```

### What lands where, US by US

| Future file | Created by | Purpose |
|---|---|---|
| `models/user.py`, `mission.py`, `assignment.py`, `cra.py`, `cra_entry.py`, `notification.py` | US-001 / 002 / 003 / 010 | one module per aggregate, per `fastapi-data-model` |
| `db/seed.py` (filled) | phase 1 step 2 | Paul (MANAGER), Jean + Marie (CONSULTANT), 3 missions |
| `core/deps.py` (`get_current_user`, `require_manager`) | US-001 | resolves `X-Demo-User`, enforces role server-side |
| `routers/auth.py`, `missions.py`, `cra.py`, `validation.py`, `dashboard.py`, `exports.py`, `notifications.py` | US-001 → 010 | one router per resource |
| `services/holidays.py` | US-003 | French public holidays, computed (no extra dependency) |
| `services/cra.py`, `mission.py`, `validation.py`, `dashboard.py`, `export.py`, `notification.py` | US-003 → 010 | business rules |
| `core/scheduler.py` | US-010 | APScheduler daily reminders, started in the lifespan |

Nothing above requires moving a folder created today. That is the point of the tree.

### Rules already fixed by the skeleton

- Routers never touch the DB and hold no `if` on a business rule.
- Services never import a router. Dependencies point one way: `routers → services → models`.
- `core/` and `db/` may be imported by anyone; they import no domain module.
- Every endpoint declares `response_model`; no SQLAlchemy model crosses the HTTP boundary.

## 3. Frontend tree — `frontend/src/`

```
frontend/
├── package.json              scripts: dev, build, test, lint, preview
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json   strict: true, noUncheckedIndexedAccess
├── vite.config.ts            react plugin + /api dev proxy + vitest config
├── index.html                <html lang="fr">
├── .env.example              VITE_API_BASE_URL=
├── .gitignore                node_modules, dist, coverage
└── src/
    ├── main.tsx              createRoot, imports styles, mounts <App/>
    ├── App.tsx               <BrowserRouter> + <AppShell> + <Routes>
    ├── labels.ts             code value → French label (single mapping module)
    ├── api/                  the ONLY place that calls fetch
    │   ├── client.ts         apiFetch<T>, ApiError, base URL, X-Demo-User header
    │   └── health.ts         getHealth()
    ├── types/
    │   └── dto.ts            hand-written mirrors of the backend schemas (see ADR-0002)
    ├── hooks/
    │   └── useHealth.ts      data + loading + error, one hook per resource
    ├── components/
    │   ├── ui/               design system — no fetch, no router
    │   │   ├── Button.tsx  Card.tsx  StatusBadge.tsx
    │   │   └── Spinner.tsx  EmptyState.tsx  ErrorBanner.tsx
    │   └── layout/
    │       ├── AppShell.tsx  header + main, max-width 1200px
    │       └── Header.tsx    app name; user block and bell slots left empty (US-001, US-010)
    ├── pages/                routing + data + the three states
    │   ├── HomePage.tsx      shell page: calls useHealth(), renders the API status
    │   └── NotFoundPage.tsx  catch-all route
    ├── styles/
    │   ├── tokens.css        the tokens from the react-design-system skill
    │   └── global.css        reset, body font, layout primitives
    └── test/
        └── setup.ts          jest-dom matchers + cleanup
```

### What lands where, US by US

| Future file | Created by | Purpose |
|---|---|---|
| `pages/LoginPage.tsx`, `hooks/useCurrentUser.ts`, `components/layout/UserMenu.tsx` | US-001 | profile picker, current-user context, header identity |
| `pages/MissionsPage.tsx`, `api/missions.ts`, `hooks/useMissions.ts` | US-002 | missions CRUD |
| `components/calendar/MonthCalendar.tsx` | US-003 | reused read-only by US-004 and US-008 |
| `pages/CraPage.tsx`, `pages/ValidationPage.tsx`, `pages/DashboardPage.tsx`, `pages/HistoryPage.tsx` | US-003/005 → 009 | one page per screen |
| `components/ui/Modal.tsx`, `DataTable.tsx`, `Toast.tsx` | when first needed | rest of the design system |
| `components/NotificationBell.tsx`, `hooks/useNotifications.ts` | US-010 | bell + 60 s polling |

The `components/ui/` vs `components/<domain>/` split is deliberate: `ui/` is generic and
reusable, everything else is CRA-specific. Pages hold data and routing; components stay pure.

## 4. Shared conventions (the contract both sides code against)

### Base URL

- Every backend route is prefixed `/api`. `/docs`, `/redoc`, `/openapi.json` stay at the root.
- Frontend: `const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''` and every path is
  written `/api/...`.
- In dev, `vite.config.ts` proxies `/api → http://localhost:8000`, so `BASE_URL` is empty
  and **there is no CORS in the normal demo path** (same origin, `http://localhost:5173`).
- The backend still enables `CORSMiddleware` for `http://localhost:5173` so that hitting
  `:8000` directly also works — a cheap safety net if the proxy is bypassed on stage.

### Identity header

- Header name: `X-Demo-User`, value: the numeric `User.id` as a string. Sent by
  `apiFetch` on **every** request, from one place in `src/api/client.ts`, read from the
  current-user context; omitted while nobody is logged in.
- The skeleton's `GET /api/health` is the one public endpoint: it must answer with or
  without the header, so the shell page works before US-001 exists.
- From US-001 on, `get_current_user` resolves the header server-side and every role check
  derives from it. The client's claimed role is never trusted.

### Error payload — always `{ "detail": string }`

| Case | Status | Body |
|---|---|---|
| Business rule broken | 409 | `{"detail": "Ce jour est déjà complet."}` |
| Wrong role | 403 | `{"detail": "Action réservée aux managers."}` |
| Unknown or not visible | 404 | `{"detail": "Mission introuvable."}` |
| Missing / invalid identity | 401 | `{"detail": "Profil de démonstration inconnu."}` |
| Payload validation | 422 | `{"detail": "Le champ « client » est obligatoire."}` |

Two consequences the backend must implement in `core/errors.py` **at skeleton time**:

1. A `DomainError` handler that maps domain exceptions to `{"detail": ...}`.
2. A `RequestValidationError` handler that **flattens** FastAPI's default
   `{"detail": [ {...}, {...} ]}` into a single French string. Without it, 422 is the one
   status whose `detail` is not a string, and the frontend's `body.detail` breaks.

`detail` is always French and always safe to display to the user as is — the frontend
shows it verbatim rather than a generic "une erreur est survenue".

### JSON casing

`camelCase` on the wire, `snake_case` in Python, `camelCase` in TypeScript. Obtained with
one `CamelModel` base in `schemas/common.py` (`alias_generator=to_camel`,
`populate_by_name=True`, `serialize_by_alias`); every schema inherits it. See ADR-0002.

### Dates and numbers

| Concept | Wire format | TypeScript | Displayed |
|---|---|---|---|
| Calendar day | ISO date `"2026-08-24"` | `type IsoDate = string` | `Intl.DateTimeFormat('fr-FR')` |
| Timestamp | ISO-8601 UTC `"2026-08-24T09:30:00Z"` | `type IsoDateTime = string` | `fr-FR`, date + time |
| Year / month | two path integers, month `1..12`, not zero-padded (`/api/cra/2026/8`) | `number` | — |
| Day fraction | `1.0` or `0.5`, JSON number | `0.5 \| 1` | `1 j` / `0,5 j` |
| Enums | the code value (`"SUBMITTED"`) | union type | French label via `src/labels.ts` |

An ISO string, an English label or a raw enum value must never reach the screen.

## 5. API contract — skeleton endpoints

### `GET /api/health`

| Field | Value |
|---|---|
| Auth | none — works with or without `X-Demo-User` |
| Role | none |
| Request | no body, no params |
| 200 | `HealthRead` |
| Errors | none (a failure is a 500 with `{"detail": ...}`) |

```jsonc
// 200 OK
{
  "status": "ok",        // "ok" | "degraded"
  "version": "0.1.0",    // settings.app_version
  "database": "ok",      // result of a SELECT 1 through the session
  "time": "2026-08-24T09:30:00Z"
}
```

```ts
// frontend/src/types/dto.ts
export type Health = {
  status: 'ok' | 'degraded'
  version: string
  database: 'ok' | 'ko'
  time: IsoDateTime
}
```

`status` is `"degraded"` when `database` is `"ko"`; the endpoint still returns 200 so the
shell page can render the degraded state instead of an error banner.

### How routers get registered

One module per resource under `app/routers/`, each exposing a module-level `router`:

```python
# app/routers/health.py
router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("", response_model=HealthRead)
def read_health(db: Session = Depends(get_db)) -> HealthRead: ...
```

```python
# app/main.py
from app.routers import health

app.include_router(health.router)
# US-001: app.include_router(auth.router)
# US-002: app.include_router(missions.router)
# ...
```

Explicit `include_router` lines, no auto-discovery: one grep shows the whole API surface,
and adding a router stays a one-line change. `tags` drive the grouping in `/docs`.

## 6. Dependencies

### Backend — `uv add`

| Package | Why |
|---|---|
| `fastapi` | the framework; also the source of the OpenAPI schema that is our contract |
| `uvicorn[standard]` | ASGI server used by the documented run command |
| `sqlalchemy>=2.0` | ORM with typed `Mapped[...]` declarative models |
| `pydantic>=2` | request/response schemas, `alias_generator` for camelCase |
| `pydantic-settings` | one typed `Settings` object instead of scattered `os.getenv` |

Dev group (`uv add --dev`):

| Package | Why |
|---|---|
| `pytest` | test runner named in AGENT.md |
| `httpx` | required by Starlette's `TestClient`; also the async client in the testing skill |
| `ruff` | format + lint in one tool, as required by `python-do.md` |

**Deliberately deferred** — added by the US that needs them, not now:
`apscheduler` (US-010), `reportlab` + `openpyxl` (US-009).
No holidays library: French public holidays are computed in `services/holidays.py`
(fixed dates + Easter algorithm), which keeps the rule testable and dependency-free.
No Alembic: SQLite is recreated from `Base.metadata.create_all` at startup; a demo has no
migration history to preserve.

### Frontend — `npm install`

| Package | Why |
|---|---|
| `react`, `react-dom` (19) | the framework |
| `react-router-dom` | client routing; the shell page already needs `/` and `*` |
| `typescript`, `vite`, `@vitejs/plugin-react` | build, dev server, HMR, type-checking |
| `vitest`, `jsdom` | test runner named in AGENT.md, sharing Vite's config |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | accessible-query testing, as required by `react-do.md` |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` | ships with the Vite template; catches hook-rule mistakes for free |

**Deliberately deferred**: `recharts` (US-007).
**Deliberately excluded**: no axios (native `fetch` is enough behind `apiFetch`), no
Redux/Zustand (`react-dont.md` forbids it), no CSS framework and no component library —
`styles/tokens.css` plus plain CSS is the design system.

## 7. Commands

Setup, once:

```bash
cd backend && uv sync
cd frontend && npm install
```

Run and test — identical to AGENT.md, and must stay so:

```bash
# backend
cd backend && uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
cd backend && uv run pytest

# frontend
cd frontend && npm run dev                            # http://localhost:5173
cd frontend && npm test
cd frontend && npm run build                          # type-checks the project
```

Quality:

```bash
cd backend && uv run ruff format . && uv run ruff check .
cd frontend && npm run lint
```

Required `package.json` scripts, so the AGENT.md commands actually work:

```jsonc
{
  "dev": "vite",
  "build": "tsc -b && vite build",   // build type-checks, as AGENT.md claims
  "test": "vitest run",              // run, not watch — it must terminate
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## 8. Work split

Both agents start **now, in parallel**. Nothing in `react-dev`'s list waits on the backend:
the `GET /api/health` payload is frozen in section 5.

### `fastapi-dev` — `backend/**` only

1. `uv init` + the dependencies of section 6; `.python-version` = 3.12; ruff and pytest
   config in `pyproject.toml`; `.gitignore` with `cra.db`.
2. `core/config.py` — `Settings` (`database_url="sqlite:///./cra.db"`, `cors_origins`,
   `app_version`). `core/errors.py` — `DomainError` + the two handlers of section 4
   (including the 422 flattener). `core/deps.py` — `get_db` only.
3. `db/base.py`, `db/session.py` (`engine`, `SessionLocal`, `init_db()`), `db/seed.py`
   with an empty idempotent `seed_demo_data(db)`.
4. Empty-but-present packages: `models/__init__.py` + `models/enums.py`
   (`UserRole`, `CraStatus`, `EntryType`), `services/__init__.py`.
5. `schemas/common.py` — `CamelModel`, `ErrorResponse`, `HealthRead`.
6. `routers/health.py` — `GET /api/health` per section 5, `SELECT 1` through the session.
7. `main.py` — lifespan (`init_db()` then `seed_demo_data()`), `CORSMiddleware`,
   exception handlers, `include_router(health.router)`, `title="CRA API"`.
8. `tests/conftest.py` (in-memory SQLite + `TestClient` + `dependency_overrides`) and
   `tests/api/test_health.py`: `test_health_returns_ok`,
   `test_health_without_demo_user_header_returns_200`.
9. Green when `uv run pytest` passes, `uvicorn` boots, and `/docs` shows the health route.

**Can start immediately.** Blocks nobody.

### `react-dev` — `frontend/**` only

1. Scaffold Vite `react-ts`; add the dependencies of section 6; set the scripts of
   section 7; `strict: true` in tsconfig; `<html lang="fr">`.
2. `vite.config.ts` — react plugin, `server.proxy['/api'] → http://localhost:8000`,
   vitest block (`environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`, `globals: true`).
3. `styles/tokens.css` + `global.css` from the `react-design-system` skill; imported once
   in `main.tsx`.
4. `api/client.ts` — `ApiError`, `apiFetch<T>`, base URL, `X-Demo-User` (section 4),
   204 handling, `{detail}` mapping. `api/health.ts` — `getHealth(): Promise<Health>`.
5. `types/dto.ts` — `IsoDate`, `IsoDateTime`, `Health`, plus the union types
   `UserRole`, `CraStatus`, `EntryType` (they are already fixed by the domain model).
   `labels.ts` — the code→French mappings for those unions.
6. `components/ui/` — `Button`, `Card`, `StatusBadge`, `Spinner`, `EmptyState`, `ErrorBanner`.
7. `components/layout/AppShell.tsx` + `Header.tsx` (app title; empty slots for the user
   block and the bell).
8. `hooks/useHealth.ts`, `pages/HomePage.tsx` (the three states are mandatory, all text
   French: « Chargement… », « API indisponible », « API disponible — version X »),
   `pages/NotFoundPage.tsx`, `App.tsx` with routes `/` and `*`.
9. `test/setup.ts` + `pages/HomePage.test.tsx`, mocking `src/api/health` (never `fetch`).
10. Green when `npm run build`, `npm test` and `npm run dev` all pass.

**Can start immediately.** The `Health` type and `/api/health` shape come from section 5,
not from a running server.

### Sync point

When both are green: start uvicorn, start Vite, open `http://localhost:5173` and confirm
the shell page shows the live version returned by the backend. That single screen proves
the tree, the proxy, the header plumbing, the error shape and both toolchains at once —
and it is the entry condition for phase 1 step 2 (seed) and US-001.

## 9. Open questions

1. **`X-Demo-User` value** — assumed to be the numeric `User.id`. A slug (`"jean.dupont"`)
   would read better on stage. Decided at US-001; the skeleton only needs the header name,
   so either answer is free today.
2. **`POST /api/auth/login`** — US-001 mentions it alongside the header. If the header
   carries the identity, login can be a pure client-side selection. To be arbitrated in
   the US-001 design note, not here.
