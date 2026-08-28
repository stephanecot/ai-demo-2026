# Quickstart — Validating Mission Management

How to run the feature and prove it works. Implementation details belong to `tasks.md`;
this file is the validation guide, and its scenarios are the entry condition for calling
US-002 done.

## Prerequisites

```bash
cd backend && uv sync
cd frontend && npm install
```

The schema is created by `create_all` at startup and the demo rows by `seed_demo_data()`.
There is no Alembic, so **after the models change, delete the database**:

```bash
rm -f backend/cra.db
```

## Run

Two terminals, exactly the commands in `AGENT.md`:

```bash
cd backend  && uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
cd frontend && npm run dev                            # http://localhost:5173
```

## Automated gates

```bash
cd backend  && uv run pytest          # includes the 70% floor
cd backend  && uv run ruff check .
cd frontend && npm test
cd frontend && npm run test:coverage  # enforces the 70% thresholds
cd frontend && npm run build          # type-checks
```

All five must pass. `uv run pytest --no-cov` skips the floor while iterating on one test.

## Contract check

Open `http://localhost:8000/docs` and confirm the eight routes of
[`contracts/missions-api.md`](contracts/missions-api.md) are present, that each declares a
`response_model`, and that `Mission` shows `assignees`. A field that appears here but not
in `frontend/src/types/dto.ts` is the drift ADR-0002 warns about.

## Manual scenarios

Seeded identities: **Paul Durand** (manager, id 1), **Jean Dupont** (consultant, id 2),
**Marie Martin** (consultant, id 3). Pick the profile in the header; it sets `X-Demo-User`.

### S1 — A manager creates and staffs a mission (FR-001, FR-008)

As Paul, open `/missions`, create *"Migration Cloud"* for client *"Initech"* starting today
with no end date, then assign Jean and Marie.
**Expect**: the mission appears in the list, `Active`, with both consultants listed.
Everything on screen is French; no ISO date and no raw `ACTIVE` is visible.

### S2 — The uniqueness rule is per client (FR-004, FR-005)

Create *"Migration Cloud"* for *"Initech"* again → refused, with the French duplicate
message shown as is. Create *"Migration Cloud"* for *"ACME"* → accepted.
Retry the duplicate with different casing and spacing (`"  migration cloud "`) → still
refused (D-05).

### S3 — A consultant sees only their own missions (FR-025, SC-004)

Switch to Jean. `/missions` shows only the missions Jean is assigned to; *"Audit sécurité"*
(Marie's) is absent. No create, edit, assign or close control is offered.

Then prove the guard is server-side, not cosmetic:

```bash
curl -i -X POST http://localhost:8000/api/missions \
  -H "X-Demo-User: 2" -H "Content-Type: application/json" \
  -d '{"label":"Pirate","client":"ACME","startDate":"2026-01-01"}'
```

**Expect** `403` and `{"detail":"Action réservée aux managers."}`. A 201 here means
FR-023 is not met, whatever the UI shows.

### S4 — Closing preserves history (FR-016 → FR-019)

As Paul, close *"Portail client"*.
**Expect**: status becomes `Clôturée`; it still appears in the list and under the closed
filter; it disappears from what a consultant may charge. Close it a second time → still
200, nothing changes (D-10).

### S5 — What a consultant may charge (FR-013, FR-014)

```bash
curl -s "http://localhost:8000/api/missions/disponibles?date=2026-08-28" \
  -H "X-Demo-User: 2" | jq '.[].label'
```

**Expect**: only missions that are assigned to Jean, `ACTIVE`, and whose period covers that
date. Re-run with `date=2020-01-01` → empty. This is the route US-003 consumes; if it is
wrong, US-003 is wrong.

### S6 — Filters (FR-020, SC-007)

As Paul, filter by client, then by status, then by consultant, then by all three.
**Expect**: each result contains exactly the matching missions; a combination that matches
nothing shows a French empty state, not an error and not a blank panel.

### S7 — The three states (FR-027)

Stop the backend and reload `/missions` → a French error message, not a blank screen and
not "une erreur est survenue". Restart it → the list renders. A consultant with no
assignment sees an explained empty state.

## Done when

Every scenario above behaves as described, the five automated gates pass, and `/docs`
matches the contract. Then run the `cra-reviewer` agent for the read-only quality pass
against the acceptance criteria and the Do/Don't rules.

Not provable here: FR-012 and FR-018 ("declarations are preserved") have no declarations to
preserve until US-003 exists — see D-13 in [`research.md`](research.md).
