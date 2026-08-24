# CLAUDE.md — ai-demo-2026

Agent instructions for this repo live in **AGENTS.md** (single source of truth).
It is imported below — read it and follow it.

@AGENTS.md

## Claude Code specifics

- Domain work is best delegated to the project subagents in `.claude/agents/`:
  `spring-boot-dev` (backend) and `angular-dev` (frontend).
- Skills in `.claude/skills/` auto-surface by description — consult the matching
  skill before writing code.
- Hard constraints: `.claude/rules/angular.md` and `.claude/rules/java.md` are
  non-negotiable forbidden-pattern lists.

<!-- SPECKIT START -->
Active feature: **001-product-management**. For technologies, project structure,
and commands, read the current plan: `specs/001-product-management/plan.md`
(with `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`).
<!-- SPECKIT END -->
