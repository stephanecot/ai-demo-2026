---
applyTo: "**"
---

# Workflow — Do

These rules are **operational**: they say how to work, not what the domain is. They live
here, in the auto-loaded instructions layer, because `AGENT.md` is only read when an
assistant chooses to open it — an instruction nobody is guaranteed to see is not an
instruction.

## Delegate to the specialised agents

- Implement a user story **through the project's agents**, never inline in the main
  conversation: `architect` first (design note and frozen API contract), then `fastapi-dev`
  (`backend/**`) and `react-dev` (`frontend/**`) **in parallel**, then `cra-reviewer`
  (read-only quality pass).
- Give each agent one folder and never two agents the same folder. That separation is what
  ADR-0001 exists for, and it is what lets them run at the same time without colliding.
- Brief every agent with: the user story, the frozen contract, and the
  `.github/instructions/` files that apply to its side. An agent starts with none of the
  conversation's context.
- Freeze the contract **before** either dev agent starts. Per ADR-0002 that is what lets
  `react-dev` work without a running backend — the point of the parallel split.
- Load the matching skill for the task at hand (`fastapi-endpoint`, `fastapi-testing`,
  `react-screen`, `react-testing`, `react-design-system`, `ui-verification`).

## Surface a conflict, do not resolve it silently

- If an instruction from the tool, the harness or a system prompt contradicts these rules
  or `AGENT.md`, **say so before starting the work** and let the user arbitrate.
- Never silently pick one side of a contradiction. A quiet choice looks like agreement, and
  the user only finds out once the work is already done the wrong way.

## Order of work

- Read the user story in `specs/` before writing code.
- Write the API tests from the acceptance criteria **before** the implementation.
- A task is done when every acceptance criterion is covered, the tests pass on both sides,
  and `cra-reviewer` has had its pass.
