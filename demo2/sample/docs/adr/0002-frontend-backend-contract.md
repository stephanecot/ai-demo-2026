# ADR-0002 — Contract-first on the OpenAPI schema, with hand-written TypeScript DTOs

Status: Accepted — 2026-08-24

## Context

`fastapi-dev` and `react-dev` work in parallel on the same user story. For that to produce
two halves that fit, the boundary between them has to be named, frozen before either one
codes, and cheap to check afterwards. FastAPI already derives an OpenAPI 3.1 schema from
the Pydantic response models, so the machine-readable contract exists for free — the
question is what the frontend does with it, and how a mismatch gets caught.

A second, smaller question rides along: Python is `snake_case`, TypeScript is `camelCase`.
The existing `fastapi-endpoint` skill shows `start_date` in `MissionRead` while the
`react-screen` skill shows `startDate` in the `Mission` DTO. One of the two has to give,
and today they silently disagree.

## Decision

**1. The OpenAPI schema is the boundary.** Both sides code against it, in this order:

- The `architect` design note freezes the contract for a story — route, verb, payloads,
  status codes, errors, required role — *before* either dev starts. That note is what
  unblocks `react-dev` on day one, when no endpoint exists yet.
- `fastapi-dev` makes the schema true: `response_model` on every endpoint, separate
  `…Create` / `…Update` / `…Read` schemas, explicit status codes. `/docs` renders the
  result and is the live reference.
- `react-dev` codes against the design note first, then verifies against `/docs` once the
  backend is up. The frontend never invents a route or a field.
- Errors are part of the contract, not an afterthought: **every** non-2xx response carries
  `{"detail": string}`, in French, safe to display verbatim. The 422 handler flattens
  FastAPI's default list-shaped `detail` into a string so the rule holds without exception.

**2. The frontend's DTOs are hand-written mirrors**, not generated. One module,
`frontend/src/types/dto.ts`, declares a `type` per backend schema and a union type per
backend enum. No codegen step, no generated file in the repo, no build-order dependency
between the two folders.

**3. The wire is `camelCase`.** The backend adapts, not the frontend: one base class in
`app/schemas/common.py`, inherited by every schema.

```python
class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
    )
```

Python stays `snake_case`, TypeScript stays `camelCase`, and the JSON in between is
`camelCase` — which is also what the OpenAPI schema and `/docs` show. This resolves the
`fastapi-endpoint` / `react-screen` disagreement in favour of the frontend's spelling.

**4. Mismatches are caught by tests, not by a compiler.** The backend tests assert the
response body of each endpoint; the frontend tests mock `src/api/*` against the DTO types.
A drift shows up as a red test or as a visibly empty field on screen during the demo —
acceptable at this scale, and dramatically cheaper than the machinery that would prevent it.

## Consequences

**Positive.** `react-dev` starts the moment the design note exists, with zero backend
running. No generation step, so no "did you re-run the generator?" failure mode, no
generated artefact in review diffs, and `npm run build` stays the only type gate. The DTO
file is short, readable, and doubles as documentation of what the frontend actually
consumes — which is a subset of what the API returns. Union types (`'DRAFT' | 'SUBMITTED' |
…`) are hand-written anyway; generated ones from OpenAPI enums are no better.

**Negative.** The DTOs are duplicated knowledge: a backend field rename that nobody mirrors
compiles fine on both sides and fails at runtime. Mitigated by three things — the design
note is written first, the DTO module is a single file that is easy to diff against
`/docs`, and `cra-reviewer` checks DTO/schema agreement as part of its pass.

**Neutral.** The camelCase decision touches every schema, so it must be in place at
skeleton time (`schemas/common.py`) — retrofitting it after five stories would be a
tedious, error-prone sweep. That is precisely why it is decided here and not later.

## Alternatives considered

**A. Generate the TypeScript types from `/openapi.json`** (`openapi-typescript`, or a full
client with `openapi-fetch` / `orval`). Types can never drift; enums and error shapes come
for free.
Rejected for this demo: it makes the frontend build depend on a *running* backend or on a
committed schema snapshot, so `react-dev` can no longer start first — which breaks the
parallel-agents story the demo exists to show. It adds a dependency, an npm script, a
generated file to commit or to gitignore, and a "regenerate" ritual that will be forgotten
on stage. The payoff — safety across a dozen small DTOs — is not worth it here.
**Revisit if** the DTO count passes ~30, or if a real team with separate release cycles
takes the project over.

**B. Share the contract through a `shared/` folder** holding a hand-maintained JSON Schema
or `.d.ts` consumed by both sides. Rejected: neither language reads it natively, so it
needs generation *and* discipline — the drawbacks of A plus the drawbacks of the current
choice. It also contradicts ADR-0001's rule that nothing crosses the folder boundary.

**C. No contract step: code the backend first, then read `/docs` and follow.** Simplest of
all, and it is what happens without an `architect`.
Rejected: it serialises the two agents, halving the demo's throughput and its point.

**D. `snake_case` on the wire** (no alias generator), TypeScript DTOs written
`start_date`. Rejected: it pushes Python's convention into every React component and every
JSX prop, fights the `react-do.md` style, and would require rewriting the `react-screen`
skill's examples. Adapting once, in one Pydantic base class, is the cheaper side to bend.

**E. `camelCase` conversion in the frontend HTTP client** (a recursive key-mapper in
`apiFetch`). Rejected: it makes the wire format differ from what `/docs` displays, so the
reference the frontend checks against no longer matches the code — and it needs `any`-ish
generic gymnastics that `react-dont.md` forbids.

## Reversibility

High on all three parts. Adopting generation (A) later is one dev dependency plus a script
and a `types/dto.ts` deleted — the `src/api/` modules that import the types do not change.
Switching the wire back to `snake_case` is removing one `ConfigDict` line. Nothing else in
the codebase is coupled to these choices.
