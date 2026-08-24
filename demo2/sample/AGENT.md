# AGENT.md — CRA project memory

Timesheet application ("Compte Rendu d'Activité"). Consultants declare their monthly
activity and absences; managers validate them. This is a demo project showing how an
application is built with AI assistants in 2026.

## Stack

| Side | Tech |
|---|---|
| Frontend | React 19, TypeScript (strict), Vite, React Router, Recharts |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x, Pydantic v2, APScheduler |
| Database | SQLite (file `backend/cra.db`), seeded at startup |
| Tests | pytest + httpx (backend), Vitest + Testing Library (frontend) |

## Repository layout

```
specs/            # 10 user stories in French — the source of truth
PLAN.MD           # demo plan, one prompt per step
backend/app/      # main.py, core/, db/, models/, schemas/, services/, routers/
backend/tests/
frontend/src/     # api/, types/, hooks/, components/, pages/
```

## Conventions

- **Code, comments, identifiers, commit messages: English.**
- **Everything the end user reads (UI labels, error messages, PDF exports): French.**
- Specs stay in French — they are the customer-facing artefact.
- Business rules live in `backend/app/services/`, never in routers or React components.
- Role checks (`CONSULTANT` / `MANAGER`) are enforced server-side, never only in the UI.
- Money-free domain: all quantities are day fractions, `1.0` or `0.5`.

## Domain model

`User` (role) · `Mission` (client, dates) · `Assignment` (user ↔ mission) ·
`Cra` (user, year, month, status) · `CraEntry` (day, type, mission, fraction) ·
`Notification`.

CRA lifecycle: `DRAFT → SUBMITTED → APPROVED`, or `SUBMITTED → REJECTED → DRAFT`.
An `APPROVED` CRA is immutable.

## Commands

```bash
# backend
cd backend && uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
cd backend && uv run pytest

# frontend
cd frontend && npm run dev                            # http://localhost:5173
cd frontend && npm test
cd frontend && npm run build                          # type-checks the project
```

## Working agreement

1. Read the relevant user story in `specs/` before writing code.
2. Load the matching rules and skills — `.claude/rules/` + `.claude/skills/` (Claude Code),
   `.github/instructions/` + `.github/skills/` (GitHub Copilot).
3. Delegate to the specialised agents: `architect` (design and API contract first),
   then `fastapi-dev` (backend) and `react-dev` (frontend), then `cra-reviewer`
   (read-only quality review).
4. A task is done when every acceptance criterion of the user story is covered and the
   tests pass.

This file is the single source of truth for every AI assistant on this project.
`CLAUDE.md` and `.github/copilot-instructions.md` are thin pointers to it.
