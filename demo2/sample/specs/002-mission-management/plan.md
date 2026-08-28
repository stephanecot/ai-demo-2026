# Implementation Plan: Mission Management

**Branch**: `main` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-mission-management/spec.md`

## Summary

Managers create, edit, staff and close client missions; consultants see only the missions
they are assigned to, and only those running on a given date. The feature adds two
aggregates (`Mission`, `Assignment`), one router, one service holding every rule, and one
manager screen — landing exactly where `docs/architecture/00-socle.md` reserved space for
them, so no existing folder moves.

The single design decision that shapes the work is **where the role check comes from**.
The spec's FR-022 to FR-025 require server-side `MANAGER` enforcement, but
`get_current_user` / `require_manager` and the `User` model belong to US-001, which is not
implemented. This plan therefore opens with a **prerequisite slice** (Phase A) that builds
the minimal identity US-002 needs. See [Prerequisite: identity](#prerequisite-identity) —
it disappears entirely if US-001 is implemented first, which is the recommended order.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x with `strict` (frontend)

**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Pydantic v2, pydantic-settings ·
React 19, React Router 7, Vite. **No new dependency is added by this feature.**

**Storage**: SQLite (`backend/cra.db`), schema created by `Base.metadata.create_all` at
startup, demo rows loaded by an idempotent `seed_demo_data()`. No Alembic — the demo has no
migration history to preserve, so a model change means deleting `cra.db`.

**Testing**: pytest + httpx `TestClient` against a per-test in-memory SQLite database
(`tests/conftest.py`); Vitest + Testing Library with the `src/api/` module mocked, never
`fetch`. Both sides enforce a 70% coverage floor in their runner config.

**Target Platform**: two local dev servers — uvicorn on `:8000`, Vite on `:5173` with
`/api` proxied, so the demo path is same-origin and CORS never fires.

**Project Type**: web application, two-folder monorepo (ADR-0001).

**Performance Goals**: SC-008 — the mission list usable in under 2 s for 50 missions. At
this scale the only real risk is N+1 on `Mission.assignments`, addressed by eager loading.

**Constraints**: code and identifiers in English, every user-visible string in French
(AGENT.md); business rules in `app/services/`, never in a router or a component; every
non-2xx body is `{"detail": <french string>}` (ADR-0002); wire format camelCase via
`CamelModel`; role resolved server-side, never trusted from the client.

**Scale/Scope**: demo dataset — 3 seeded users, a handful of missions. Roughly 2 models,
1 service, 1 router, 7 endpoints, 1 page, 4 components, 2 hooks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**`.specify/memory/constitution.md` is an unfilled Spec Kit template** — every principle is
still a `[PRINCIPLE_N_NAME]` placeholder, so it states no rule to check against. Rather
than treat the gate as vacuously passed, it is evaluated against the documents that
actually govern this repository: `AGENT.md`, `.claude/rules/python-{do,dont}.md`,
`.claude/rules/react-{do,dont}.md`, ADR-0001 and ADR-0002.

| Gate | Source | Verdict |
|---|---|---|
| Business rules live in `app/services/`, routers stay thin | python-do | ✅ every rule in `services/mission.py`; the router only validates, delegates, returns |
| No DB access from a router | python-dont | ✅ router takes `Depends(get_db)` and hands the session to the service |
| `response_model` on every endpoint, no ORM object crosses HTTP | python-do/dont | ✅ `MissionRead` / `list[MissionRead]` on all seven routes |
| Separate schemas per direction | python-do | ✅ `MissionCreate` / `MissionUpdate` / `MissionRead` |
| Role checks server-side, UI hiding is not access control | AGENT.md, react-dont | ✅ `Depends(require_manager)`; frontend hiding is additive only |
| Every `detail` French, `{"detail": string}` shape | ADR-0002 | ✅ all messages French; existing handlers already enforce the shape |
| camelCase on the wire via `CamelModel` | ADR-0002 | ✅ all new schemas inherit `CamelModel` |
| Tests before code, one test per business rule, 70% floor | PLAN.MD, python-do | ✅ Phase C writes API tests from the acceptance scenarios before Phase D implements |
| No new dependency unless the story needs one | AGENT.md | ✅ none added |
| Hand-written DTOs, no codegen | ADR-0002 | ✅ new types added to `src/types/dto.ts` by hand |
| No global state library, no `any`, no `fetch` in components | react-dont | ✅ local state + one hook per resource; API calls only in `src/api/` |

**Violation to record**: this plan implements part of US-001 (see Complexity Tracking).
Every other gate passes. Re-checked after Phase 1 design: unchanged.

## Prerequisite: identity

US-002 needs three things that `docs/architecture/00-socle.md` assigns to US-001 and to
"phase 1 step 2" of `PLAN.MD`, and that do not exist today:

| Missing | Where it belongs | Evidence |
|---|---|---|
| `User` model | US-001 | `app/models/__init__.py:9` — still a comment |
| Seeded users (Paul MANAGER, Jean + Marie CONSULTANT) | PLAN.MD phase 1 step 2 | `app/db/seed.py` seeds nothing |
| `get_current_user`, `require_manager` | US-001 | `app/core/deps.py:3` — named in the docstring, not written |
| Frontend current-user context + profile picker | US-001 | `src/api/client.ts` — `currentUserId` is never set |

Without them there is no `MANAGER` to enforce against, `X-Demo-User` is never sent, and
FR-022 to FR-025 and SC-004 cannot be tested at all — a stub that always grants manager
would make every role test vacuous.

**Decision**: build the minimum of US-001 needed, and no more (Phase A). Login screens,
role-aware navigation and the rest of US-001 stay with US-001.

> **Recommended alternative**: implement US-001 first. `PLAN.MD` line 7 says stories are
> done in numeric order, and line 261 puts US-001 — *"garde par rôle côté backend"* —
> before US-002. If US-001 lands first, **Phase A drops out of this plan entirely** and
> Phases B to F are unchanged. Nothing else in this plan depends on that choice.

## Project Structure

### Documentation (this feature)

```text
specs/002-mission-management/
├── plan.md              # This file
├── research.md          # Phase 0 output — decisions and rejected alternatives
├── data-model.md        # Phase 1 output — entities, constraints, transitions
├── quickstart.md        # Phase 1 output — how to run and validate the feature
├── contracts/
│   └── missions-api.md  # Phase 1 output — the frozen HTTP contract
├── checklists/
│   └── requirements.md  # /speckit-specify output
└── tasks.md             # /speckit-tasks output — NOT created here
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── core/
│   │   └── deps.py                 # MODIFIED — get_current_user, require_manager (Phase A)
│   ├── db/
│   │   └── seed.py                 # MODIFIED — users, missions, assignments (Phase A/B)
│   ├── models/
│   │   ├── __init__.py             # MODIFIED — re-export User, Mission, Assignment
│   │   ├── enums.py                # MODIFIED — add MissionStatus
│   │   ├── user.py                 # NEW (Phase A)
│   │   ├── mission.py              # NEW
│   │   └── assignment.py           # NEW
│   ├── schemas/
│   │   ├── user.py                 # NEW (Phase A) — UserRead
│   │   └── mission.py              # NEW — MissionCreate/Update/Read, AssignmentCreate
│   ├── services/
│   │   └── mission.py              # NEW — every business rule of this feature
│   ├── routers/
│   │   └── missions.py             # NEW — seven routes
│   └── main.py                     # MODIFIED — include_router(missions.router)
└── tests/
    ├── conftest.py                 # MODIFIED — per-role client fixtures
    ├── api/test_missions.py        # NEW — one file per router
    └── services/test_mission.py    # NEW — rules without HTTP

frontend/
└── src/
    ├── api/missions.ts             # NEW — the only place these routes are called
    ├── types/dto.ts                # MODIFIED — Mission, MissionStatus, UserSummary
    ├── labels.ts                   # MODIFIED — MISSION_STATUS_LABELS
    ├── hooks/
    │   ├── useCurrentUser.tsx      # NEW (Phase A) — context + provider
    │   └── useMissions.ts          # NEW — list + filters + mutations
    ├── components/
    │   ├── layout/Header.tsx       # MODIFIED (Phase A) — profile picker in the empty slot
    │   └── missions/
    │       ├── MissionTable.tsx    # NEW — presentational
    │       ├── MissionForm.tsx     # NEW — create and edit
    │       ├── MissionFilters.tsx  # NEW — client / status / consultant
    │       └── AssigneePicker.tsx  # NEW — attach and detach consultants
    ├── pages/MissionsPage.tsx      # NEW — routing + data + the three states
    └── App.tsx                     # MODIFIED — route /missions
```

**Structure Decision**: the two-folder monorepo of ADR-0001, unchanged. Every path above
is a slot `docs/architecture/00-socle.md` already reserved — `routers/missions.py`,
`services/mission.py`, `models/mission.py`, `pages/MissionsPage.tsx`, `api/missions.ts`,
`hooks/useMissions.ts` are all named there under "what lands where, US by US". The one
addition is `components/missions/`, which follows the documented
`components/ui/` (generic) vs `components/<domain>/` (CRA-specific) split.

## Implementation Phases

| Phase | Content | Gate to the next |
|---|---|---|
| **A. Identity prerequisite** | `User` model, seeded users, `get_current_user`, `require_manager`, per-role test fixtures, frontend current-user context + header profile picker | A seeded manager and consultant can be selected, and `X-Demo-User` reaches the backend |
| **B. Domain** | `MissionStatus` enum, `Mission` and `Assignment` models, re-exports, demo missions in the seed | `uv run pytest` still green; tables created |
| **C. Tests first** | `tests/api/test_missions.py` and `tests/services/test_mission.py` written from the 26 acceptance scenarios — red | Every scenario has a failing test |
| **D. Backend** | `schemas/mission.py`, `services/mission.py`, `routers/missions.py`, registration in `main.py` | Phase C green, coverage ≥ 70%, `/docs` shows the seven routes |
| **E. Frontend** | DTOs, labels, `api/missions.ts`, `useMissions`, components, `MissionsPage`, route | `npm run build`, `npm test` green, coverage ≥ 70% |
| **F. Verification** | Both servers up, demo path walked in a real browser per `quickstart.md`; `cra-reviewer` pass | Every acceptance scenario observable on screen |

Phase C before Phase D is not a preference: `PLAN.MD` states *"les tests d'API sont écrits
avant le code"* and `python-do.md` requires the API tests for a story to be written from
its acceptance criteria first.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Phase A implements part of US-001 (User model, seed, `get_current_user`, `require_manager`, frontend current-user context) inside the US-002 plan | FR-022 to FR-025 and SC-004 require a real server-side `MANAGER` check. Nothing in the repository can distinguish a manager from a consultant today, so without this slice the feature's central security requirement is untestable. | **Stub `require_manager` to always allow** — rejected: every role test becomes vacuous, SC-004 ("100% of consultant write attempts refused") cannot be verified, and the stub would have to be removed and all tests rewritten at US-001. **Wait for US-001** — not rejected, actively recommended above; the slice exists only so this plan is executable today, and it is written to be exactly what US-001 would have written. |
| `components/missions/` — a fourth component folder | The page needs four presentational pieces; `react-do.md` requires extracting a component past ~120 lines, and `components/ui/` is reserved for generic, CRA-agnostic primitives. | Putting mission-specific markup in `components/ui/` would break the documented generic/domain split; keeping it all in `MissionsPage.tsx` would produce a single component well past the size limit. |
