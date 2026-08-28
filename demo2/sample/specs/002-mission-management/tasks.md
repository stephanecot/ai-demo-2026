---
description: "Task list for Mission Management (US-002)"
---

# Tasks: Mission Management

**Input**: Design documents from `specs/002-mission-management/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/missions-api.md](contracts/missions-api.md)

**Tests**: Test tasks are **included and mandatory**. This is not the template's optional
case: `PLAN.MD` requires *"les tests d'API sont écrits avant le code"*, and
`.claude/rules/python-do.md` requires the API tests for a story to be written from its
acceptance criteria before the code. Within every story phase, the test tasks come first
and must fail before the implementation tasks begin.

**Organization**: One phase per user story, in the priority order of `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different files, no dependency on an unfinished task
- **[Story]**: `US1`…`US5`, mapping to the user stories of `spec.md`
- Every task names its exact file path

## Path Conventions

Web application, two-folder monorepo (ADR-0001): `backend/app/`, `backend/tests/`,
`frontend/src/`. All paths below are relative to the repository root.

## Serialization notes (why some obvious tasks are not `[P]`)

- `backend/app/services/mission.py`, `backend/app/routers/missions.py`,
  `backend/app/schemas/mission.py`, `backend/tests/api/test_missions.py`,
  `backend/tests/services/test_mission.py`, `frontend/src/hooks/useMissions.ts` and
  `frontend/src/pages/MissionsPage.tsx` are each **touched by several stories**.
  `python-do.md` fixes one test file per router and per service, so the story phases
  genuinely serialise on those seven files. Tasks touching them are never marked `[P]`
  across stories, even where the work is conceptually independent.
- Everything under `frontend/src/components/missions/` is one component per file, so those
  are freely parallel.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green baseline and add the shared vocabulary every story uses

- [X] T001 Confirm the baseline is green before any change: `cd backend && uv run pytest && uv run ruff check .` and `cd frontend && npm test && npm run build`
- [X] T002 [P] Add the `MissionStatus` StrEnum (`ACTIVE`, `CLOSED`) with a docstring in `backend/app/models/enums.py`
- [X] T003 [P] Add `"description": "description"` to `_FIELD_LABELS` in `backend/app/core/errors.py` so 422 messages name the field instead of falling back to "La requête est invalide." (research D-03)
- [X] T004 [P] Add `MissionStatus`, `UserSummary`, `Mission`, `MissionCreate` and `MissionFilters` types to `frontend/src/types/dto.ts`, mirroring `contracts/missions-api.md` by hand (ADR-0002, no codegen)
- [X] T005 [P] Add `MISSION_STATUS_LABELS = { ACTIVE: 'Active', CLOSED: 'Clôturée' }` to `frontend/src/labels.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The identity slice and the two aggregates. Nothing in any story can be written
or tested before this phase is done.

**⚠️ CRITICAL**: T006, T010, T011, T012, T016 and T017 are the **US-001 prerequisite slice**
described in `plan.md` § *Prerequisite: identity*. If US-001 is implemented first — the
recommended order — **skip them**; the rest of this plan is unchanged.

### Backend — domain and identity

- [X] T006 [P] Create the `User` model (`id`, `name`, `email` unique, `role`) in `backend/app/models/user.py` *(US-001 slice)*
- [X] T007 [P] Create the `Mission` model in `backend/app/models/mission.py` — `label` and `client` both `COLLATE NOCASE`, `UniqueConstraint("client", "label")`, `status` defaulting to `ACTIVE`, `end_date` nullable (depends on T002)
- [X] T008 [P] Create the `Assignment` model in `backend/app/models/assignment.py` with `UniqueConstraint("user_id", "mission_id")` and `back_populates` on both sides
- [X] T009 Re-export `User`, `Mission` and `Assignment` from `backend/app/models/__init__.py` so `Base.metadata` is complete before `create_all` (depends on T006, T007, T008)
- [X] T010 Implement `get_current_user` (parse `X-Demo-User`, load the user, raise `UnauthorizedError` when absent/unparsable/unknown) and `require_manager` (raise `ForbiddenError` with "Action réservée aux managers.") in `backend/app/core/deps.py` *(US-001 slice)*
- [X] T011 Fill `seed_demo_data()` in `backend/app/db/seed.py` with the three users, three missions and their assignments from `data-model.md` § *Seed data*, keeping it idempotent and free of `datetime.now()` (depends on T009)
- [X] T012 Add `manager_client`, `consultant_client` and seeded-user fixtures to `backend/tests/conftest.py`, each seeding its own in-memory database so no test shares state (depends on T010, T011)
- [X] T013 [P] Write the identity tests — missing header, unknown id, unparsable id, consultant hitting a manager dependency — in `backend/tests/core/test_deps.py` (depends on T012)
- [X] T014 [P] Create the `UserRead` schema (`id`, `name`, `role`) inheriting `CamelModel` in `backend/app/schemas/user.py`
- [X] T015 Create `backend/app/routers/missions.py` with `APIRouter(prefix="/api/missions", tags=["missions"])` and uncomment `app.include_router(missions.router)` in `backend/app/main.py`

### Frontend — identity and plumbing

- [X] T016 [P] Create the current-user context and provider in `frontend/src/hooks/useCurrentUser.tsx`, calling `setCurrentUserId` in the same effect that sets the context value and passing `null` when cleared, per the invariant documented in `frontend/src/api/client.ts` *(US-001 slice)*
- [X] T017 Add the profile picker to the empty user slot of `frontend/src/components/layout/Header.tsx`, listing the seeded users with their French role label (depends on T016) *(US-001 slice)*
- [X] T018 [P] Create `frontend/src/api/missions.ts` with one typed function per route of `contracts/missions-api.md`, using `apiFetch` only — no `fetch` anywhere else (depends on T004)
- [X] T019 Add the `/missions` route in `frontend/src/App.tsx` and a placeholder `frontend/src/pages/MissionsPage.tsx` rendering the three states, so the route is reachable before the screen exists

**Checkpoint**: `uv run pytest` green, `X-Demo-User` reaches the backend from a real browser, tables created. Story work can begin.

---

## Phase 3: User Story 1 - Create and maintain the mission catalogue (Priority: P1) 🎯 MVP

**Goal**: A manager records a client engagement — name, client, start date, optional end date, description — and corrects it later.

**Independent Test**: As a manager, create a mission with no end date, reopen it, change its description and end date, and confirm both the creation and the correction survive a reload.

### Tests for User Story 1 ⚠️ Write first, confirm they fail

- [X] T020 [US1] Write the API tests for US1 scenarios 1-7 in `backend/tests/api/test_missions.py` — create, absent end date, edit, duplicate label for the same client, same label for another client, end date before start date, blank label or client — named `test_<action>_<condition>_<expected>` (depends on T012)
- [X] T021 [P] [US1] Write the service-level rule tests in `backend/tests/services/test_mission.py` — trimming, case-insensitive uniqueness, date ordering — exercised without HTTP (depends on T012)

### Implementation for User Story 1

- [X] T022 [US1] Create `MissionCreate`, `MissionUpdate` and `MissionRead` in `backend/app/schemas/mission.py`, all inheriting `CamelModel`, with `label` and `client` stripped and non-empty, and neither `status` nor `assignees` accepted on input
- [X] T023 [US1] Implement `create_mission`, `update_mission` and `get_mission` in `backend/app/services/mission.py` — case-insensitive `(client, label)` pre-check raising `ConflictError`, `end_date >= start_date` raising `ConflictError` with the French sentence of research D-06, `NotFoundError` for an unknown id (depends on T022)
- [X] T024 [US1] Add `POST /api/missions` (201), `PUT /api/missions/{mission_id}` and `GET /api/missions/{mission_id}` to `backend/app/routers/missions.py`, each with `response_model=MissionRead` and `Depends(require_manager)` on the two writes (depends on T023)
- [X] T025 [P] [US1] Build the presentational `MissionForm` in `frontend/src/components/missions/MissionForm.tsx` — French labels, accessible names, no fetch, no router
- [X] T026 [P] [US1] Build the presentational `MissionTable` in `frontend/src/components/missions/MissionTable.tsx`, showing label, client, period and status with a stable business key, status conveyed by a label and not by colour alone
- [X] T027 [US1] Implement `useMissions()` in `frontend/src/hooks/useMissions.ts` exposing data, loading, error and the create/update actions, calling only `src/api/missions.ts` (depends on T018)
- [X] T028 [US1] Wire `frontend/src/pages/MissionsPage.tsx` — loading, error and empty states, form panel toggled in a `Card`, backend `detail` shown verbatim on refusal (depends on T025, T026, T027)
- [X] T029 [P] [US1] Write the Vitest tests for the form, the table and the page in `frontend/src/components/missions/MissionForm.test.tsx`, `MissionTable.test.tsx` and `frontend/src/pages/MissionsPage.test.tsx`, mocking `src/api/missions` and querying by role and label

**Checkpoint**: a manager can create and edit missions end to end; US1 is demonstrable alone.

---

## Phase 4: User Story 2 - Assign consultants to a mission (Priority: P2)

**Goal**: A manager attaches and detaches consultants, which is what makes a mission chargeable.

**Independent Test**: Assign two consultants, confirm both appear, detach one, confirm only the other remains.

### Tests for User Story 2 ⚠️ Write first, confirm they fail

- [X] T030 [US2] Write the API tests for US2 scenarios 1-6 in `backend/tests/api/test_missions.py` — single and multiple assignment, repeat assignment returning 200 without a duplicate, detachment, unknown user, non-consultant user (depends on T024)
- [X] T031 [P] [US2] Write the assignment rule tests in `backend/tests/services/test_mission.py` — idempotence and the consultant-only rule (depends on T024)

### Implementation for User Story 2

- [X] T032 [US2] Add `AssignmentCreate` (`userIds`) and the `assignees: list[UserRead]` field on `MissionRead` in `backend/app/schemas/mission.py` (depends on T014)
- [X] T033 [US2] Implement `assign_consultants` and `detach_consultant` in `backend/app/services/mission.py` — idempotent, `NotFoundError` for an unknown user, `ConflictError` when the user is not a `CONSULTANT`, eager loading via `selectinload` (research D-09, D-10)
- [X] T034 [US2] Add `POST /api/missions/{mission_id}/affectations` (200) and `DELETE /api/missions/{mission_id}/affectations/{user_id}` (204) to `backend/app/routers/missions.py`, both behind `Depends(require_manager)` (depends on T033)
- [X] T035 [P] [US2] Build `AssigneePicker` in `frontend/src/components/missions/AssigneePicker.tsx` — attach and detach, French labels, accessible controls
- [X] T036 [US2] Extend `frontend/src/hooks/useMissions.ts` and `frontend/src/pages/MissionsPage.tsx` with the assign and detach actions (depends on T035)
- [X] T037 [P] [US2] Write the Vitest tests for `AssigneePicker` in `frontend/src/components/missions/AssigneePicker.test.tsx`

**Checkpoint**: missions can be staffed; the data US3 reads now exists.

---

## Phase 5: User Story 3 - A consultant only sees the missions they may charge (Priority: P2)

**Goal**: The set of missions offered to a consultant on a date — assigned, active, in period. This is the contract US-003 consumes.

**Independent Test**: For a consultant assigned to one running, one not-yet-started and one closed mission, request the declarable set for a date inside the running mission's window and get exactly one mission back.

**⚠️ Depends on User Story 2**: there is nothing to scope until assignments exist. This is the one story pair in this feature that is not independently orderable.

### Tests for User Story 3 ⚠️ Write first, confirm they fail

- [X] T038 [US3] Write the API tests for US3 scenarios 1-6 in `backend/tests/api/test_missions.py` — the four exclusions (not started, ended, closed, not assigned), the open-ended mission, the empty result, and a consultant's `GET /api/missions` showing only their own missions (depends on T034)
- [X] T039 [P] [US3] Write the declarability-predicate tests in `backend/tests/services/test_mission.py`, covering the period boundaries on both ends (depends on T034)

### Implementation for User Story 3

- [X] T040 [US3] Implement `list_available_missions(user, date)` and make `list_missions` role-scoped — every mission for a manager, only their own for a consultant — in `backend/app/services/mission.py` (research D-08)
- [X] T041 [US3] Add `GET /api/missions/disponibles` to `backend/app/routers/missions.py`, **declared before** `GET /api/missions/{mission_id}` or FastAPI parses the literal as an id (research D-07), with a required `date` query parameter (depends on T040)
- [X] T042 [US3] Hide the manager-only controls for a consultant in `frontend/src/pages/MissionsPage.tsx` and add `listAvailableMissions(date)` to `frontend/src/api/missions.ts` — hiding is additive, the server-side rule stays the access control
- [X] T043 [P] [US3] Write the Vitest test asserting a consultant sees no create, edit, assign or close control, in `frontend/src/pages/MissionsPage.test.tsx`

**Checkpoint**: `GET /api/missions/disponibles` is correct — US-003 can be started against it.

---

## Phase 6: User Story 4 - Close a mission without losing its history (Priority: P3)

**Goal**: Closing withdraws a mission from new declarations while leaving everything already recorded untouched.

**Independent Test**: Close a mission, confirm it is no longer offered to a consultant, still appears under the closed filter, and that closing it twice changes nothing.

### Tests for User Story 4 ⚠️ Write first, confirm they fail

- [X] T044 [US4] Write the API tests for US4 scenarios 1-5 in `backend/tests/api/test_missions.py`, including the idempotent second close returning 200 (depends on T041)
- [X] T045 [P] [US4] Write the closure rule tests in `backend/tests/services/test_mission.py`, asserting that closure touches only `status` and leaves `end_date` and the assignments intact (research D-13) (depends on T041)

### Implementation for User Story 4

- [X] T046 [US4] Implement `close_mission` in `backend/app/services/mission.py` — sets `status` only, never `end_date`, and is a no-op on an already closed mission (research D-04, D-10)
- [X] T047 [US4] Add `POST /api/missions/{mission_id}/cloture` (200) to `backend/app/routers/missions.py` behind `Depends(require_manager)` (depends on T046)
- [X] T048 [US4] Add the close action to `frontend/src/pages/MissionsPage.tsx` and render the status with `StatusBadge` plus its French label (depends on T005)
- [X] T049 [P] [US4] Write the Vitest test for the close action and the closed rendering in `frontend/src/components/missions/MissionTable.test.tsx`

**Checkpoint**: the full mission lifecycle works; no deletion path exists anywhere (FR-007).

---

## Phase 7: User Story 5 - Find a mission in the catalogue (Priority: P3)

**Goal**: Narrow the catalogue by client, status and assigned consultant, individually or combined.

**Independent Test**: With missions across two clients, some closed, filter by client, then by status, then by consultant, then by all three, and confirm each result is exact.

### Tests for User Story 5 ⚠️ Write first, confirm they fail

- [X] T050 [US5] Write the API tests for US5 scenarios 1-6 in `backend/tests/api/test_missions.py` — each filter alone, all combined with AND, and the empty result (depends on T047)
- [X] T051 [P] [US5] Write the filter-composition tests in `backend/tests/services/test_mission.py`, including the case-insensitive client match (depends on T047)

### Implementation for User Story 5

- [X] T052 [US5] Add the `client`, `status` and `user_id` filters to `list_missions` in `backend/app/services/mission.py`, combined with AND and applied on top of the role scoping of T040
- [X] T053 [US5] Add the three optional query parameters to `GET /api/missions` in `backend/app/routers/missions.py` (depends on T052)
- [X] T054 [P] [US5] Build `MissionFilters` in `frontend/src/components/missions/MissionFilters.tsx` with accessible French labels
- [X] T055 [US5] Wire the filters through `frontend/src/hooks/useMissions.ts` and `frontend/src/pages/MissionsPage.tsx`, deriving the filtered view during render rather than storing it in state (depends on T054)
- [X] T056 [P] [US5] Write the Vitest tests for the filters and the French empty state in `frontend/src/components/missions/MissionFilters.test.tsx`

**Checkpoint**: every acceptance scenario of `spec.md` is covered by a test.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T057 Verify no N+1: assert that listing missions with assignees issues a bounded number of queries, and that every mission query uses `selectinload(Mission.assignments).selectinload(Assignment.user)` in `backend/app/services/mission.py` (research D-09, SC-008)
- [X] T058 [P] Top up `backend/tests/` until `uv run pytest` passes its `--cov-fail-under=70` gate, covering rules rather than getters
- [X] T059 [P] Top up `frontend/src/**/*.test.tsx` until `npm run test:coverage` passes its 70% thresholds
- [X] T060 [P] Run `cd backend && uv run ruff format . && uv run ruff check .` and `cd frontend && npm run lint && npm run build`, and fix what they report
- [X] T061 Check `http://localhost:8000/docs` against `contracts/missions-api.md` route by route, and check `frontend/src/types/dto.ts` against the schemas it mirrors — this is the only guard ADR-0002 leaves against DTO drift
- [ ] T062 Walk scenarios S1 to S7 of `quickstart.md` in a real browser, including the `curl` in S3 that proves the 403 is server-side and not just a hidden button
- [ ] T063 Run the `cra-reviewer` agent against the acceptance criteria of `spec.md` and the `.claude/rules/` Do/Don't files, and fix what it reports
- [ ] T064 Tick the **US-002** checkbox in `demo2/PLAN.MD` (the file sits one level above this repository, at `../PLAN.MD`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — **blocks every story**
- **US1 (Phase 3)**: depends on Foundational. The MVP.
- **US2 (Phase 4)**: depends on Foundational; shares `schemas/mission.py`, `services/mission.py`, `routers/missions.py` and both test files with US1, so it follows US1 in practice
- **US3 (Phase 5)**: **depends on US2** — there are no assignments to scope before it
- **US4 (Phase 6)**: depends on Foundational; independent of US2 and US3 in logic, serialised on the shared files
- **US5 (Phase 7)**: depends on US1 for the list endpoint, and reads better after US4 so the status filter has a closed mission to find
- **Polish (Phase 8)**: depends on every story that is being shipped

### Within Each User Story

Tests are written and failing → schemas → service → router → frontend components → hook and page → frontend tests.

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005 are four different files — fully parallel after T001
- Phase 2: T006, T007, T008 (three model files) run together; T013, T014, T016, T018 run together once their dependencies land; the backend and frontend halves of this phase are independent
- Within a story: the presentational components (`MissionForm`, `MissionTable`, `AssigneePicker`, `MissionFilters`) and the service-level test file are parallel with the backend work
- Across stories: **little real parallelism**, by design — see *Serialization notes* above. Claiming otherwise would be false: five of the seven backend files are shared.

---

## Parallel Example: Phase 2 Foundational

```bash
# The three aggregates, three separate files:
Task: "Create the User model in backend/app/models/user.py"
Task: "Create the Mission model in backend/app/models/mission.py"
Task: "Create the Assignment model in backend/app/models/assignment.py"

# Then, in parallel across the two folders:
Task: "Create UserRead in backend/app/schemas/user.py"
Task: "Create the current-user context in frontend/src/hooks/useCurrentUser.tsx"
Task: "Create the typed API client in frontend/src/api/missions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 — Setup
2. Phase 2 — Foundational, **skipping T006, T010, T011, T012, T016, T017 if US-001 has already been implemented**
3. Phase 3 — User Story 1
4. **Stop and validate**: a manager creates and edits a mission; scenarios S1 and S2 of `quickstart.md` pass
5. Demonstrable at that point — a mission catalogue with server-enforced manager-only writes

### Incremental Delivery

| Increment | Adds | Demo value |
|---|---|---|
| MVP (US1) | Catalogue | Missions exist and are manager-only |
| + US2 | Assignment | Missions become chargeable |
| + US3 | Declarable set | **Unblocks US-003** — the consumer contract is live |
| + US4 | Closure | The lifecycle closes without losing history |
| + US5 | Filters | The catalogue scales past a demo handful |

US-003 (saisie du CRA mensuel) needs increments 1 to 3 only. US4 and US5 can follow it.
