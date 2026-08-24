# ADR-0001 — Two-folder monorepo: `backend/` + `frontend/`

Status: Accepted — 2026-08-24

## Context

The CRA demo has two independent toolchains: Python 3.12 / FastAPI managed by `uv`, and
React 19 / TypeScript managed by `npm`. Both are developed at the same time by two agents
(`fastapi-dev`, `react-dev`) that must never edit the same files, and the whole thing has
to be clonable and runnable on a conference machine in under two minutes.
`AGENT.md` already advertises the layout `backend/app/`, `frontend/src/`, `specs/`, so the
decision is mostly about confirming it and recording why the alternatives were dropped.

## Decision

One Git repository with two sibling application folders and no root-level package manager:

```
/                      README.md, PLAN.MD, AGENT.md, CLAUDE.md, .claude/, .github/
├── specs/             the 10 user stories (customer artefact, French)
├── docs/              architecture notes and ADRs (this file)
├── backend/           self-contained Python project: pyproject.toml, uv.lock, app/, tests/
└── frontend/          self-contained Node project: package.json, src/, vite.config.ts
```

Rules that follow from it:

- Each side owns its own manifest, lockfile, `.gitignore` and test runner. There is no
  root `package.json`, no workspace, no `Makefile` orchestrating both (a `make dev` may be
  added at phase 5 for convenience, but nothing depends on it).
- Every command is run from inside its folder, exactly as documented in `AGENT.md`
  (`cd backend && uv run …`, `cd frontend && npm …`).
- Agent scopes map one-to-one onto the folders: `fastapi-dev` writes only `backend/**`,
  `react-dev` only `frontend/**`, `architect` only `docs/**`. The filesystem, not
  discipline, keeps them from colliding.
- The two sides communicate over HTTP only. No shared code, no shared build step, no
  generated file crossing the boundary (see ADR-0002).
- In development, Vite proxies `/api` to `http://localhost:8000`; the two servers stay
  separate processes and the backend never serves the frontend bundle.

## Consequences

**Positive.** Two independent toolchains that never fight over a lockfile. Either side can
be deleted, rebuilt or demoed alone. `git log --stat` shows at a glance which side a commit
touched, which is exactly the story the demo tells about parallel agents. Onboarding is two
obvious commands. Agent file-scope enforcement is trivial to express as a path prefix.

**Negative.** Two install steps and two test commands instead of one — accepted, they are
already written in `AGENT.md`. Nothing shares types between the two sides, so DTOs are
duplicated by hand; that is deliberate and covered by ADR-0002. Two terminals are needed
during the demo (or one `make dev` at phase 5).

**Neutral.** Deployment is out of scope for the demo; the choice does not prejudge it —
`vite build` output can be served by anything later, FastAPI included.

## Alternatives considered

**A. Single folder — FastAPI serves the built React app.** `backend/` holds the API and
mounts `frontend/dist` as static files; one process, one URL, no proxy, no CORS.
Rejected: it couples the frontend build into the backend run loop, so `react-dev` cannot
work without a backend build step, HMR gets awkward, and the clean `backend/**` vs
`frontend/**` agent scoping that this demo is built to showcase disappears.

**B. npm workspaces or a monorepo tool (Turborepo/Nx) at the root.** A root `package.json`
orchestrating both sides, with shared tooling and one `npm run dev`.
Rejected: workspaces manage JavaScript packages, and half of this repo is Python — the
Python side would sit outside the tool anyway. It adds a root manifest, a second lockfile
and a build orchestrator to a project with exactly two packages. Cost with no payoff at
demo scale.

**C. Two separate repositories.** Strongest isolation, independent versioning.
Rejected: the demo's whole narrative is that `specs/`, `PLAN.MD`, `AGENT.md`, the agents and
both implementations live in one place and are read together by the assistants. Two repos
would mean two AI memories, two checkouts and a cross-repo contract to keep in sync.

**D. A `shared/` folder for cross-language contract artefacts** (OpenAPI file, generated
types). Rejected for now: it needs a generation step in both toolchains for the sake of a
handful of DTOs. See ADR-0002, which keeps the boundary as a runtime schema instead.

## Reversibility

High. Serving the frontend from FastAPI (alternative A) later is one `StaticFiles` mount
plus a `vite build`; adding workspaces (B) is a root manifest that does not move a single
file; splitting into two repos (C) is `git subtree split` on two already-clean folders.
Nothing in this decision is load-bearing for the code itself.
