# Phase 0 — Research: Mission Management

Every unknown in the Technical Context is resolved below. No `NEEDS CLARIFICATION` remains.
The spec carries none either; its open judgement calls were settled in its *Assumptions*
section and are not re-litigated here.

---

## D-01 — Where the manager role check comes from

**Decision**: build a minimal identity slice (Phase A) — `User` model, seeded users,
`get_current_user`, `require_manager`, and a frontend current-user context feeding
`setCurrentUserId` — explicitly borrowed from US-001, and nothing beyond it.

**Rationale**: FR-022 to FR-025 and SC-004 are about server-side role enforcement, and the
repository has no `User` at all (`app/models/__init__.py:9`). Without a real role there is
nothing to enforce and nothing to test. The socle already specifies precisely what these
pieces look like, so writing them now costs little and duplicates no design work.

**Alternatives considered**:

- *Stub `require_manager` to always allow.* Rejected: every role test would pass without
  testing anything, SC-004 would be unverifiable, and the stub plus its tests would be
  thrown away at US-001.
- *Implement US-001 fully first.* Not rejected — recommended. `PLAN.MD` orders stories
  numerically and places US-001's backend role guard before US-002. This slice exists only
  so the plan is executable today; if US-001 lands first, Phase A is simply skipped.
- *Trust an `X-Demo-Role` header from the client.* Rejected outright — `AGENT.md` and
  `python-dont.md` both forbid trusting a client-supplied role.

## D-02 — `X-Demo-User` carries the numeric `User.id`

**Decision**: the header value is `str(User.id)`. `get_current_user` parses it, loads the
user, and raises `UnauthorizedError` (401, *"Profil de démonstration inconnu."*) when it is
absent, unparsable or unknown.

**Rationale**: `docs/architecture/00-socle.md` §4 already assumes the numeric id, and
`src/api/client.ts` is written around a `currentUserId: string | null`. Closing the socle's
open question 1 this way changes no existing line.

**Alternatives considered**: a slug (`"jean.dupont"`) reads better on stage, which is why
the socle left it open. Rejected here because it would mean touching the client contract
for a cosmetic gain; US-001 may still revisit it, and the change would be one line in
`get_current_user` plus the seed.

## D-03 — The mission's name field is `label`, not `name`

**Decision**: `Mission.label` in Python, `label` on the wire, *libellé* on screen. The
spec's prose says "name"; the code calls it `label`.

**Rationale**: `app/core/errors.py` already reserves the French labels of the future
schemas, and it maps `"label" → "libellé"` under its *Mission* block while `"name" → "nom"`
sits under *User*. Following it keeps the 422 messages correct with no edit; contradicting
it would silently degrade them to *"La requête est invalide."*

**Follow-through**: `_FIELD_LABELS` has no entry for `description`, so Phase D adds
`"description": "description"`. That map is documented as needing an entry per new request
field.

## D-04 — Closure is a status, not a date

**Decision**: add `MissionStatus` (`ACTIVE`, `CLOSED`) to `app/models/enums.py`. Closing
sets the status; it never touches `end_date`.

**Rationale**: the spec fixes this reading (*"n'apparaît plus pour les saisies futures"* =
no longer offered for any new declaration). Keeping status and period independent is what
makes FR-014's four exclusion cases — not started, ended, closed, not assigned —
expressible separately and testable separately.

**Alternatives considered**: *closure = setting `end_date` to today*. Rejected: it makes
the status filter of FR-020 redundant with a date comparison, and it silently rewrites the
mission's period, which is business data a manager entered.

## D-05 — Case-insensitive, trimmed uniqueness of `label` per `client`

**Decision**: three layers. Pydantic strips whitespace on input; the service pre-checks
with a case-insensitive query and raises `ConflictError` with a French message; the table
carries `UniqueConstraint(client, label)` with both columns declared `COLLATE NOCASE`.

**Rationale**: the constraint alone would surface as an `IntegrityError`, i.e. a 500 with
an English cause — unusable. The service check alone would leave the invariant
unenforced at rest. SQLite's `NOCASE` collation gives the database half for free, with no
expression index and no normalised shadow column.

**Alternatives considered**: a stored `label_normalized` column kept in sync — rejected as
a second source of truth for a demo-scale table. Catching `IntegrityError` and translating
it — rejected: it couples a French user message to a driver error string.

## D-06 — End date before start date returns 409, not 422

**Decision**: the rule lives in `services/mission.py` and raises
`ConflictError("La date de fin ne peut pas précéder la date de début.")`.

**Rationale**: it is a relation between two fields, so a Pydantic `model_validator` would
report `loc = ("body",)`. `_field_name` strips the `body` prefix, finds no field, and
`flatten_validation_errors` falls back to *"La requête est invalide."* — a message that
tells the manager nothing. Raising from the service produces the exact sentence, and
`python-do.md` already designates 409 for business-rule violations.

**Alternatives considered**: extending the 422 flattener to understand model-level errors.
Rejected: it would complicate a piece of cross-cutting plumbing to serve one rule, and the
resulting status would still be arguable.

## D-07 — Route shapes and their ordering

**Decision**: follow the story's *Notes techniques* literally, including its French
sub-resource segments, and add the three routes it omits:

| Route | Source |
|---|---|
| `GET/POST /api/missions` | story |
| `PUT /api/missions/{missionId}` | story |
| `POST /api/missions/{missionId}/affectations` | story |
| `GET /api/missions/{missionId}` | added — the edit screen needs a single read |
| `DELETE /api/missions/{missionId}/affectations/{userId}` | added — FR-009 detachment |
| `POST /api/missions/{missionId}/cloture` | added — FR-016 closure |
| `GET /api/missions/disponibles?date=` | added — FR-013, consumed by US-003 |

**Rationale**: the story names `affectations` in French, so `cloture` and `disponibles`
follow the same spelling rather than mixing languages inside one resource. Path segments
are a wire contract, not code identifiers, so the English-code rule does not apply.

**Trap to avoid**: `/disponibles` must be declared **before** `/{mission_id}` in
`routers/missions.py`. FastAPI matches in declaration order, so the reverse order makes the
path parameter swallow the literal and return a 422 on the integer parse.

## D-08 — One list endpoint, scoped by role

**Decision**: `GET /api/missions` serves both roles. A manager receives every mission and
may use all three filters; a consultant receives only the missions they are assigned to,
whatever filters they pass.

**Rationale**: FR-020 gives managers the filterable catalogue, FR-025 lets a consultant see
their own missions but not browse others'. One endpoint with a role-dependent base query
satisfies both and keeps the frontend calling one function.

**Alternatives considered**: a separate `/api/missions/mes-missions`. Rejected as a second
route returning the same shape; the scoping belongs in the query, not in the URL.

## D-09 — Eager loading, because SC-008 is a list of 50 with assignees

**Decision**: every query returning missions uses
`selectinload(Mission.assignments).selectinload(Assignment.user)`.

**Rationale**: `MissionRead` embeds its assignees, so a lazy relation would issue one query
per mission and another per assignment — the N+1 that `python-dont.md` names explicitly.
`selectinload` keeps it at three queries regardless of list size.

## D-10 — Closing an already-closed mission succeeds

**Decision**: `POST /api/missions/{id}/cloture` on a closed mission returns 200 with the
unchanged mission. Assigning an already-assigned consultant likewise returns 200 and
creates no duplicate.

**Rationale**: the spec asks for it twice (User Story 4 scenario 5, User Story 2 scenario
3), and both are stated as "no error reported to the user as a failure of their action".
Idempotence also protects the demo from a double click on stage.

## D-11 — Frontend: no `Modal`, an inline form panel

**Decision**: `MissionsPage` toggles a `MissionForm` rendered inside a `Card`, above the
table. No `Modal` primitive is added to `components/ui/`.

**Rationale**: the socle lists `Modal` as "added when first needed". A create/edit form is
not a case that needs one — a panel is easier to test with accessible queries, needs no
focus trap, and adds no generic component that later stories would have to live with.

**Alternatives considered**: a dedicated `/missions/nouvelle` route. Rejected: it costs a
route and a navigation for a five-field form, and the manager loses sight of the list.

## D-12 — Deletion is not offered anywhere

**Decision**: no `DELETE /api/missions/{id}`, and no delete control in the UI.

**Rationale**: FR-007. A mission is withdrawn by closing it, so no declaration ever points
at a row that vanished. This is what makes FR-018's "closure leaves history untouched"
meaningful rather than a promise the data model can break.

## D-13 — What "declarations are preserved" can be tested against today

**Decision**: FR-012 and FR-018 (detachment and closure leave declarations untouched) are
tested at Phase C as far as the data model allows, and their full assertion is deferred to
US-003, which introduces `CraEntry`.

**Rationale**: there is no declaration entity yet. What *is* testable now, and is tested,
is the structural guarantee behind them: neither detachment nor closure deletes or mutates
anything but the assignment row and the status column, and no cascade is declared on the
`Mission` → `Assignment` relation that could reach a future `CraEntry`. Recorded here so
US-003 adds the end-to-end assertion rather than assuming it exists.
