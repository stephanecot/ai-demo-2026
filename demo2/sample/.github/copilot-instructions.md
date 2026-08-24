# CRA — GitHub Copilot entry point

The project memory lives in **[AGENT.md](../AGENT.md)** — a single, tool-agnostic file.

**Read `AGENT.md` first.** It holds the context, the stack, the repository layout, the
domain model, the conventions (code in English, UI in French) and the commands.

GitHub Copilot specifics:

- Instructions: `.github/instructions/{python,react}-{do,dont}.instructions.md`
  (scoped with `applyTo`: `backend/**` for python, `frontend/**` for react)
- Skills: `.github/skills/<name>/SKILL.md`
- Agents: `.github/agents/{architect,fastapi-dev,react-dev,cra-reviewer}.agent.md`

Do not duplicate project knowledge here — add it to `AGENT.md` so every assistant sees it.
