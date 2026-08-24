---
name: implement-us
description: Use to implement one user story of the CRA project end to end, from specs/US-XXX to reviewed code — design, backend, frontend, review, then tick the step in PLAN.MD. Give it a story id such as "US-004". Optional workflow: any equivalent method (Spec Kit, manual prompting) can replace it.
---

# Implement a user story

> **This skill is optional.** It is one opinionated way to go from a story to reviewed
> code. Spec Kit (`/speckit.specify` → `/speckit.plan` → `/speckit.tasks` →
> `/speckit.implement`) or plain manual prompting achieve the same result. What matters
> is the invariant, not the tooling: **design first, one agent per side, review before
> done**. If the team already uses another workflow, drop this skill and keep the rules,
> the skills and the agents.

Input: a story id (`US-004`) or its file path. Output: the story implemented, tested,
reviewed, and its checkbox ticked in `PLAN.MD`.

## Step 0 — Frame

1. Read `specs/US-XXX-*.md` in full, plus `AGENT.md`.
2. Extract the acceptance criteria into a working checklist — it is the definition of
   done for every step below.
3. Check the story's dependencies (US-002 needs US-004's missions). If a prerequisite is
   missing, say so and stop rather than stubbing it.
4. Announce the plan in three lines: what will be designed, built backend, built frontend.

**Never edit `specs/`.** If the story is ambiguous, list the open questions and ask.
An assumption silently baked into code is the expensive kind of mistake.

## Step 1 — Design (agent `architect`)

Delegate to `architect` with the story id. Expect back:

- the domain model delta (entities, enums, invariants and where each is enforced)
- **the API contract**: route, verb, payloads, status codes, errors, required role
- the frontend structure: screens, routes, shared components
- ADRs for any structural choice
- the work split between backend and frontend

Gate: do not start coding until the API contract is written down. It is what lets the
two sides proceed in parallel without guessing each other's payloads.

For a trivial story (one endpoint, no new entity, no structural choice), skip this step
and say so explicitly.

## Step 2 — Implement

Launch both agents on the agreed contract:

- `fastapi-dev` — backend, scoped to `backend/**`
- `react-dev` — frontend, scoped to `frontend/**`

Run them in parallel when the contract is settled; run the backend first when the story
introduces a new entity and the shape is still likely to move.

Give each agent the story id, the contract from step 1, and its own scope. Do not repeat
the rules to them — their agent file already loads them.

If an agent reports a blocker (missing endpoint, contradictory criterion), resolve it at
this level: go back to `architect` if it is a design question, ask the user if it is a
product question. Never let an agent work around a blocker with mock data.

## Step 3 — Verify

```bash
cd backend && uv run pytest && uv run ruff check
cd frontend && npm test && npm run build
```

All four must pass. A failing suite is a stop, not a footnote in the report.

Then walk the acceptance checklist from step 0 and mark each criterion covered or not.

## Step 4 — Review (agent `cra-reviewer`)

Delegate to `cra-reviewer` with the story id and the diff.

- `BLOQUANT` findings: fix them through the owning agent, then re-run step 3.
- `À CORRIGER`: fix now if cheap, otherwise list them in the report.
- `SUGGESTION`: report only.

Loop at most twice. If blockers survive two rounds, stop and escalate to the user with
what remains — do not keep patching.

## Step 5 — Close

1. Tick the story's checkbox in `PLAN.MD`.
2. Commit with a message referencing the story:
   `feat(cra): implement US-004 mission management`
3. Report, in this order:
   - acceptance criteria covered / total
   - endpoints added or changed, screens added or changed
   - tests written and their result
   - findings left open, with severity
   - what the next story needs from this one

## Guardrails

- Story scope only. A useful idea outside the story goes in the report, not in the diff.
- No agent writes outside its scope; `architect` writes only in `docs/`.
- Business rules land in backend services, never in a router or a React component.
- Role checks are verified from the API, not from the UI.
- A business rule without a test is not implemented.
- Do not tick `PLAN.MD` while a `BLOQUANT` finding is open.

## Checklist

- [ ] Story read; acceptance criteria extracted; dependencies checked.
- [ ] API contract written before any code (or step 1 explicitly skipped).
- [ ] Backend and frontend implemented by their own agent, within scope.
- [ ] `pytest`, `ruff`, `npm test`, `npm run build` all green.
- [ ] Review run; no `BLOQUANT` left open.
- [ ] `PLAN.MD` ticked, commit made, report delivered.
