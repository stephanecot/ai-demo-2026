# CRA — Claude Code entry point

The project memory lives in **[AGENT.md](AGENT.md)** — a single, tool-agnostic file.

**Read `AGENT.md` first.** It holds the context, the stack, the repository layout, the
domain model, the conventions (code in English, UI in French) and the commands.

Claude Code specifics:

- Rules: `.claude/rules/{python,react}-{do,dont}.md`
- Skills: `.claude/skills/<name>/SKILL.md`
- Agents: `.claude/agents/{architect,fastapi-dev,react-dev,cra-reviewer}.md`
- Permissions: `.claude/settings.json`

Do not duplicate project knowledge here — add it to `AGENT.md` so every assistant sees it.
