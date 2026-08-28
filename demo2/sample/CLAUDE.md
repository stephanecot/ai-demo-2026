# CRA — Claude Code entry point

The project memory lives in **[AGENT.md](AGENT.md)** — a single, tool-agnostic file.

**Read `AGENT.md` first.** It holds the context, the stack, the repository layout, the
domain model, the conventions (code in English, UI in French) and the commands.

Claude Code specifics:

- Rules: `.claude/rules/{python,react}-{do,dont}.md`
- Skills: `.claude/skills/<name>/SKILL.md`
- Agents: `.claude/agents/{architect,fastapi-dev,react-dev,cra-reviewer}.md`
- Permissions: `.claude/settings.json`

Design notes and ADRs produced by `architect` live in `docs/architecture/` and `docs/adr/`.

Do not duplicate project knowledge here — add it to `AGENT.md` so every assistant sees it.

<!-- SPECKIT START -->
The current plan for the feature in progress is **[specs/002-mission-management/plan.md](specs/002-mission-management/plan.md)**.

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
