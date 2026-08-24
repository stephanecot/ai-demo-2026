---
name: implement-us
description: Use to implement one user story of the CRA project end to end, from specs/US-XXX to reviewed code — design, API tests, backend, frontend, review, then tick the step in PLAN.MD. Give it a story id such as US-004. Optional workflow — any equivalent method (Spec Kit, manual prompting) can replace it.
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

## Step 2 — API tests, written from the story (agent `fastapi-dev`)

`fastapi-dev` writes the **API tests** before implementing: one test per acceptance
criterion that involves the API, written against the contract frozen in step 1.

These are acceptance tests at the HTTP boundary — they are what proves the story is
delivered. Each test names the criterion it covers, so the mapping criterion → test reads
without guessing. For every endpoint in the contract, at minimum:

- the happy path with the exact payload and status code from the contract
- each business rule the story states, in its failing case (`409`)
- the wrong role (`403`) and another user's resource (`404`)
- the error body: `{"detail": "<french sentence>"}`

They fail until the code exists — that is expected and needs no ceremony. What matters is
that the tests describe the story rather than the implementation.

## Step 3 — Implement

Launch both agents on the agreed contract:

- `fastapi-dev` — backend, scoped to `backend/**`. The step-2 tests are the target:
  model → schemas → service → router, until they pass. A test that turns out to be wrong
  about the contract is a design question — raise it with `architect` rather than quietly
  editing the assertion to match the code.
- `react-dev` — frontend, scoped to `frontend/**`, on the same contract.

Run them in parallel once the contract is settled; run the backend first when the story
introduces a new entity whose shape may still move.

Then each agent adds the **unit tests** needed to reach the coverage floor: business rules
tested directly on the service (faster and clearer than through HTTP), components tested
in Vitest. Coverage is the floor, not the goal — a covered line whose rule is untested
buys nothing.

If an agent reports a blocker (missing endpoint, contradictory criterion), resolve it at
this level: go back to `architect` if it is a design question, ask the user if it is a
product question. Never let an agent work around a blocker with mock data.

## Step 4 — Verify

```bash
cd backend && uv run pytest --cov=app --cov-fail-under=70 && uv run ruff check
cd frontend && npm test -- --coverage && npm run build && npm run lint
```

All must pass, **coverage included: 70% minimum on both sides**. A failing suite or a
coverage floor missed is a stop, not a footnote in the report.

If coverage is short, add tests on the rules that are not exercised — never on trivial
getters chosen to inflate the number.

Then start both servers and verify the story in a real browser with the Chrome DevTools
MCP server, following `ui-verification`: drive the story's main interaction, observe the
three states, and check that the console is clean and every `/api` call is 2xx. Automated
suites do not cover the proxy, the identity header or the styling.

Then walk the acceptance checklist from step 0 and mark each criterion covered or not.

## Step 5 — Review (agent `cra-reviewer`)

Delegate to `cra-reviewer` with the story id and the diff.

- `BLOQUANT` findings: fix them through the owning agent, then re-run step 4.
- `À CORRIGER`: fix now if cheap, otherwise list them in the report.
- `SUGGESTION`: report only.

Loop at most twice. If blockers survive two rounds, stop and escalate to the user with
what remains — do not keep patching.

## Step 6 — Close

1. Tick the story's checkbox in `PLAN.MD`.
2. Commit with a message referencing the story:
   `feat(cra): implement US-004 mission management`
3. Report, in this order:
   - acceptance criteria covered / total, each mapped to the API test that proves it
   - endpoints added or changed, screens added or changed
   - tests written and their result, plus the coverage figure on both sides
   - findings left open, with severity
   - what the next story needs from this one

## Guardrails

- Story scope only. A useful idea outside the story goes in the report, not in the diff.
- No agent writes outside its scope; `architect` writes only in `docs/`.
- Business rules land in backend services, never in a router or a React component.
- Role checks are verified from the API, not from the UI.
- A business rule without a test is not implemented.
- API tests come before the implementation: written afterwards, they describe the code
  instead of the story.
- A step-2 test is never weakened to make it pass; a wrong test means a wrong contract.
- 70% coverage is a floor to clear, not a target to game.
- Do not tick `PLAN.MD` while a `BLOQUANT` finding is open.

## Checklist

- [ ] Story read; acceptance criteria extracted; dependencies checked.
- [ ] API contract written before any code (or step 1 explicitly skipped).
- [ ] API tests written from the acceptance criteria, before the implementation.
- [ ] Backend and frontend implemented by their own agent, within scope.
- [ ] `pytest`, `ruff`, `npm test`, `npm run build`, `npm run lint` all green.
- [ ] Coverage ≥ 70% on both sides.
- [ ] Story seen working in a real browser (Chrome DevTools MCP), console clean.
- [ ] Review run; no `BLOQUANT` left open.
- [ ] `PLAN.MD` ticked, commit made, report delivered.
