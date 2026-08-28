# Contract — Missions API

Frozen before either side codes (ADR-0002). `react-dev` codes against this note; the
running `/docs` must end up matching it exactly.

**Conventions inherited from the socle** — `camelCase` on the wire; every non-2xx body is
`{"detail": <french string>}`, displayable verbatim; `X-Demo-User` carries `User.id` on
every request; dates are ISO calendar days (`"2026-08-24"`).

## Routes

| # | Verb | Path | Role | Success |
|---|---|---|---|---|
| 1 | `GET` | `/api/missions` | any | 200 `Mission[]` |
| 2 | `GET` | `/api/missions/disponibles?date=` | any | 200 `Mission[]` |
| 3 | `GET` | `/api/missions/{missionId}` | manager, or a consultant assigned to it | 200 `Mission` |
| 4 | `POST` | `/api/missions` | MANAGER | 201 `Mission` |
| 5 | `PUT` | `/api/missions/{missionId}` | MANAGER | 200 `Mission` |
| 6 | `POST` | `/api/missions/{missionId}/affectations` | MANAGER | 200 `Mission` |
| 7 | `DELETE` | `/api/missions/{missionId}/affectations/{userId}` | MANAGER | 204 |
| 8 | `POST` | `/api/missions/{missionId}/cloture` | MANAGER | 200 `Mission` |

### Added during implementation — `GET /api/users`

| # | Verb | Path | Role | Success |
|---|---|---|---|---|
| 0 | `GET` | `/api/users?role=CONSULTANT` | **public** | 200 `UserSummary[]` |

Not in the original contract. It was added because the screen cannot be built without it,
twice over: the header profile picker must list the demo profiles **before** anyone is
identified, and the assignee picker must list the consultants a manager may attach
(User Story 2, scenario 1). It is public for the same reason `GET /api/health` is — it is
what the picker reads before an identity exists. It exposes `id`, `name` and `role`, and
nothing else.

It belongs to US-001; it lives here only because US-002 needs it first. See the plan's
*Prerequisite: identity*.

> **Declaration order matters**: route 2 must be registered before route 3, or
> `disponibles` is parsed as a `missionId` (D-07).

> **Corrected 2026-08-28.** Route 3 was first specified as role "any". That contradicted
> FR-025 ("a consultant MUST NOT be able to browse missions they are not assigned to"), and
> the implementation followed the contract, so a consultant could read any mission by id —
> its label, client, description and the names of the other consultants on it. The spec
> wins: route 3 is now scoped like route 1. It answers **404**, not 403, so the response
> does not confirm that the mission exists.

Every route returns 401 when `X-Demo-User` is missing or unknown. Manager routes return 403
for a consultant. Routes taking a `missionId` return 404 when it does not exist.

## Payloads

```jsonc
// Mission — the single response shape of routes 1-6 and 8
{
  "id": 1,
  "label": "Refonte SI",
  "client": "ACME",
  "startDate": "2026-01-01",
  "endDate": null,                // null = runs indefinitely
  "description": "Refonte du SI de gestion.",
  "status": "ACTIVE",             // "ACTIVE" | "CLOSED"
  "assignees": [
    { "id": 2, "name": "Jean Dupont", "role": "CONSULTANT" }
  ]
}
```

```jsonc
// MissionCreate (route 4) / MissionUpdate (route 5)
{
  "label": "Refonte SI",          // required, trimmed, non-empty
  "client": "ACME",               // required, trimmed, non-empty
  "startDate": "2026-01-01",      // required
  "endDate": null,                // optional, >= startDate
  "description": ""               // optional, defaults to ""
}
```

`status` and `assignees` are **not accepted on input** — status changes only through route
8, assignees only through routes 6 and 7 (`python-dont.md`: never accept a client-supplied
`id` or `status`).

```jsonc
// AssignmentCreate (route 6)
{ "userIds": [2, 3] }             // one or several, consultants only
```

## Query parameters

| Route | Parameter | Type | Behaviour |
|---|---|---|---|
| 1 | `client` | string | Case-insensitive exact match |
| 1 | `status` | `ACTIVE \| CLOSED` | |
| 1 | `userId` | int | Missions that user is assigned to |
| 2 | `date` | ISO date, **required** | The day the missions must be declarable on |

Route 1 combines filters with AND (FR-020). For a consultant, the result is additionally
restricted to their own missions whatever they pass (D-08, FR-025).

Route 2 answers for the **calling** consultant and returns missions that are assigned to
them, `ACTIVE`, and whose period covers `date` (FR-013). This is the route US-003 consumes.

## Errors

| Status | When | `detail` |
|---|---|---|
| 401 | No or unknown `X-Demo-User` | `Profil de démonstration inconnu.` |
| 403 | Consultant on a manager route | `Action réservée aux managers.` |
| 404 | Unknown `missionId` | `Mission introuvable.` |
| 404 | Unknown `userId` on route 6 | `Utilisateur introuvable.` |
| 409 | `(client, label)` already used | `Une mission « … » existe déjà pour ce client.` |
| 409 | `endDate` before `startDate` | `La date de fin ne peut pas précéder la date de début.` |
| 409 | Assignee is not a consultant | `Seul un consultant peut être affecté à une mission.` |
| 422 | Empty or missing `label` / `client` / `startDate` | `Le champ « libellé » est obligatoire.` etc. |

Routes 6 and 8 are **idempotent**: re-assigning an already-assigned consultant, or closing
an already-closed mission, returns 200 and changes nothing (D-10). Route 7 returns 204 even
if the assignment was already absent.

## TypeScript mirror

Hand-written in `frontend/src/types/dto.ts` (ADR-0002 — no codegen):

```ts
export type MissionStatus = 'ACTIVE' | 'CLOSED'

export type UserSummary = {
  id: number
  name: string
  role: UserRole
}

export type Mission = {
  id: number
  label: string
  client: string
  startDate: IsoDate
  endDate: IsoDate | null
  description: string
  status: MissionStatus
  assignees: UserSummary[]
}

export type MissionCreate = {
  label: string
  client: string
  startDate: IsoDate
  endDate: IsoDate | null
  description: string
}

export type MissionFilters = {
  client?: string
  status?: MissionStatus
  userId?: number
}
```

French labels go in `src/labels.ts`, never inline:
`MISSION_STATUS_LABELS = { ACTIVE: 'Active', CLOSED: 'Clôturée' }`.
