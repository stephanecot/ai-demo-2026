# Phase 1 — Data Model: Mission Management

Three tables. `User` comes from the Phase A prerequisite slice (US-001); `Mission` and
`Assignment` are this feature's own. Naming follows `app/db/base.py`'s convention, so every
constraint has a deterministic, readable name in SQLite errors.

```
User 1 ──< Assignment >── * Mission
             (unique per pair)
```

---

## Enum — `MissionStatus`

Added to `app/models/enums.py`, alongside the existing `UserRole`, `CraStatus`, `EntryType`.

```python
class MissionStatus(StrEnum):
    """Whether a mission may still receive new declarations."""
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
```

Independent of the period: an `ACTIVE` mission whose `end_date` has passed is not
declarable either, but for a different reason and with a different French message.

| Transition | Trigger | Rule |
|---|---|---|
| `ACTIVE → CLOSED` | `POST /api/missions/{id}/cloture` by a manager | Always allowed |
| `CLOSED → CLOSED` | Same call repeated | Allowed, changes nothing, returns 200 (D-10) |
| `CLOSED → ACTIVE` | — | **Not supported.** Reopening is out of scope (spec, *Assumptions*) |

---

## `User` — `users` *(Phase A, borrowed from US-001)*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `int` | PK | The value carried by `X-Demo-User` (D-02) |
| `name` | `str(120)` | not null | Display name, e.g. *"Jean Dupont"* |
| `email` | `str(180)` | not null, unique | Seeded, not used for authentication |
| `role` | `UserRole` | not null | `CONSULTANT` or `MANAGER` |

Relationship: `assignments: list[Assignment]`, back-populating `Assignment.user`.

Only what US-002 needs. US-001 owns any further column.

## `Mission` — `missions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `int` | PK | |
| `label` | `str(120)` `COLLATE NOCASE` | not null | The mission's name (D-03) |
| `client` | `str(120)` `COLLATE NOCASE` | not null | Free text, not a managed catalogue |
| `start_date` | `date` | not null | |
| `end_date` | `date \| None` | nullable | `None` = runs indefinitely (FR-003) |
| `description` | `str(2000)` | not null, default `""` | Optional to the user, never null in the row |
| `status` | `MissionStatus` | not null, default `ACTIVE` | |

**Table constraint**: `UniqueConstraint("client", "label")` → `uq_missions_client`.
Both columns are `NOCASE`, so *"Refonte SI"* and *"refonte si"* collide for the same
client, and neither collides across clients (FR-004, FR-005; see D-05).

Relationship: `assignments: list[Assignment]`, `cascade="all, delete-orphan"`, always
loaded with `selectinload` (D-09).

**Validation rules** (enforced in `services/mission.py`, never in the router):

| Rule | Requirement | Failure |
|---|---|---|
| `label` and `client` non-empty after stripping | FR-006 | 422, French, per-field |
| `end_date >= start_date` when `end_date` is set | FR-006 | 409 (D-06) |
| `(client, label)` unused, case-insensitively | FR-004 | 409 |
| No deletion path exists | FR-007 | — |

**Derived, never stored**: whether a mission is declarable on a date. It is
`status == ACTIVE and start_date <= d and (end_date is None or d <= end_date)`, computed at
query time. Storing it would be a value derivable from others, which `python-dont.md`
forbids.

## `Assignment` — `assignments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `int` | PK | |
| `user_id` | `int` | FK → `users.id`, not null | |
| `mission_id` | `int` | FK → `missions.id`, not null | |

**Table constraint**: `UniqueConstraint("user_id", "mission_id")` → `uq_assignments_user_id`.
Backs FR-010; the service checks first so a repeat assignment returns 200 rather than
surfacing an `IntegrityError` (D-10).

Relationships: `user: User`, `mission: Mission`, both `back_populates`.

**Carries no dates of its own** — the mission's period governs (spec, *Assumptions*). This
is the single most likely thing to want to change later; doing so would change FR-013's
query and nothing else.

**Validation rules**:

| Rule | Requirement | Failure |
|---|---|---|
| The user exists | FR-011 | 404 |
| The user's role is `CONSULTANT` | FR-011 | 409 |
| The mission exists | — | 404 |
| Detachment leaves declarations untouched | FR-012 | See D-13 |

---

## Seed data

`app/db/seed.py` stays idempotent and deterministic — it guards on an empty `users` table,
uses no random value and no `datetime.now()` for a business date, and changes nothing when
run twice. Dates are fixed literals for exactly that reason.

| Users | Role |
|---|---|
| Paul Durand | `MANAGER` |
| Jean Dupont | `CONSULTANT` |
| Marie Martin | `CONSULTANT` |

| Mission | Client | Period | Status | Assignees |
|---|---|---|---|---|
| Refonte SI | ACME | 2026-01-01 → open | `ACTIVE` | Jean, Marie |
| Portail client | ACME | 2026-06-01 → 2026-12-31 | `ACTIVE` | Jean |
| Audit sécurité | Globex | 2025-01-01 → 2025-06-30 | `CLOSED` | Marie |

Chosen so the demo can show, without typing anything: two missions for one client (the
uniqueness rule is per client, not global), one open-ended and one bounded mission, one
closed mission for the status filter, and a consultant on two missions and another on two —
which is also the fixture US-003 will need for a multi-mission day.

---

## Impact on existing files

| File | Change |
|---|---|
| `app/models/enums.py` | Add `MissionStatus` |
| `app/models/__init__.py` | Re-export `User`, `Mission`, `Assignment` — required for `create_all` |
| `app/core/errors.py` | Add `"description"` to `_FIELD_LABELS` (D-03) |
| `app/core/deps.py` | Add `get_current_user`, `require_manager` (Phase A) |
| `app/db/seed.py` | Replace the empty body with the table above |
| `app/main.py` | `include_router(missions.router)` — the line is already there, commented |
| `frontend/src/types/dto.ts` | Add `MissionStatus`, `Mission`, `MissionCreate`, `UserSummary` |
| `frontend/src/labels.ts` | Add `MISSION_STATUS_LABELS` |

No column is added to an existing table, so nothing needs migrating. Deleting `cra.db` and
restarting is the documented way to pick up the new schema.
