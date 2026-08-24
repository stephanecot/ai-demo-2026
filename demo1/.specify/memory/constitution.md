<!--
SYNC IMPACT REPORT
==================
Version change: (template, unratified) → 1.0.0
Bump rationale: Initial ratification — first concrete constitution replacing the
  placeholder template. MAJOR baseline 1.0.0.

Principles (initial set):
  I.   Test-First Quality (NON-NEGOTIABLE)
  II.  Layered Architecture & Separation of Concerns
  III. Contract-First, Type-Safe APIs
  IV.  Modern-Stack Discipline (binding rules)
  V.   Simplicity & Consistency

Added sections:
  - Core Principles (5 principles)
  - Technology & Security Constraints
  - Development Workflow & Quality Gates
  - Governance

Removed sections: none

Templates / artifacts reviewed:
  ✅ .specify/templates/plan-template.md   — generic "Constitution Check" gate
       reads this file dynamically; no edit required, compatible.
  ✅ .specify/templates/spec-template.md    — no direct constitution coupling.
  ✅ .specify/templates/tasks-template.md   — no direct constitution coupling.
  ✅ AGENTS.md / CLAUDE.md / .claude/rules/ — already encode these principles
       at the implementation level; constitution governs them.

Deferred TODOs: none. RATIFICATION_DATE set to first adoption (2026-06-03).
-->

# Stock Manager Constitution

Governance for **ai-demo-2026** — a store stock-management application built as an
agentic demo. Backend: Java 25 + Spring Boot 4 (Spring Framework 7). Frontend:
Angular 21. This constitution sets non-negotiable rules; the detailed conventions
live in `.claude/skills/**` and the binding forbidden-pattern lists in
`.claude/rules/`.

## Core Principles

### I. Test-First Quality (NON-NEGOTIABLE)

Every feature MUST ship with automated tests, and a feature is not "done" until its
tests pass. Backend uses JUnit 5 with the narrowest effective slice (plain unit,
`@WebMvcTest`, `@DataJpaTest`, or `RestTestClient`/Testcontainers for integration);
frontend uses Vitest (Karma is forbidden). Tests MUST cover the happy path **and**
error/edge cases. Test output MUST be reported truthfully — no claiming success on a
red or skipped suite. Tests assert observable behavior (outputs, state, rendered DOM,
HTTP), not private implementation details.

**Rationale**: A demo that breaks live is worse than no demo; tests are the only
durable evidence that a change works.

### II. Layered Architecture & Separation of Concerns

Backend MUST follow `controller → service → repository → domain`: controllers are thin
HTTP edges, business logic and `@Transactional` boundaries live in services, and
persistence stays in repositories. Frontend MUST keep components presentational
(`OnPush`, signals) with logic in services, organized as `core` / `shared` /
`features`. One pattern per concern: a second way of doing something the codebase
already does one way is a defect.

**Rationale**: Clear layers keep the codebase teachable, reviewable, and demoable.

### III. Contract-First, Type-Safe APIs

The REST contract is explicit and stable. DTOs MUST be Java `record`s; JPA entities
MUST NEVER cross the REST boundary. Requests MUST be validated (Jakarta Bean
Validation) and errors returned as `ProblemDetail` (RFC 9457) from a single
`@RestControllerAdvice`. Breaking contract changes MUST use native API versioning, not
ad-hoc new paths. The frontend MUST mirror every contract as a typed TypeScript
interface — `any` is forbidden on both sides.

**Rationale**: A typed, versioned contract lets the two stacks evolve independently
without silent breakage.

### IV. Modern-Stack Discipline (binding rules)

Code MUST use the current idioms of its stack. Backend: constructor injection,
`RestClient`/`@HttpExchange` (never `RestTemplate`), JSpecify null-safety, built-in
resilience. Frontend: standalone components, `inject()`, signal `input()`/`output()`,
native control flow, zoneless (no `zone.js`), Tailwind v4 design tokens. The
forbidden-pattern lists `.claude/rules/java.md` and `.claude/rules/angular.md` are
BINDING: any pattern they prohibit is a defect that MUST be fixed, not merged.

**Rationale**: Consistent modern idioms are the whole point of a 2026 reference demo.

### V. Simplicity & Consistency

Start simple; apply YAGNI. Changes MUST be minimal and reviewable — no unrelated
refactors bundled in. Reuse existing utilities and patterns before adding new ones.
Prefer the smallest construct that solves the problem; justify any added complexity in
the change description. New shared/UI or backend abstractions are introduced only when
duplication actually demands them.

**Rationale**: Simplicity keeps the demo legible and the cost of change low.

## Technology & Security Constraints

- **Stack (fixed)**: Java 25 + Spring Boot 4 / Spring Framework 7 (Maven via `./mvnw`);
  Angular 21 + Tailwind v4 (npm). Documentation: Markdown + Mermaid exported to PDF.
- **Security baseline**: no secrets in the repo (externalized config / env vars); all
  external input validated at the boundary; no stack traces leaked to clients; no
  string-built SQL. CORS configured explicitly for the Angular origin.
- **Data**: schema versioned (Flyway) in real environments; `ddl-auto` create/update is
  allowed ONLY in a throwaway demo profile.
- **Tooling parity**: agent/skill tooling is maintained for both Claude Code
  (`.claude/`) and GitHub Copilot (`.github/`); skills are shared and kept compatible.

## Development Workflow & Quality Gates

- **Consult the skill first**: before writing code, read the matching skill in
  `.claude/skills/**`; delegate domain work to the `spring-boot-dev` / `angular-dev`
  agents where appropriate.
- **Quality gates before "done"**: tests green (`./mvnw test`, `npm test`); lint/build
  clean where applicable; the binding rules in `.claude/rules/` satisfied; the API
  contract communicated across stacks when it changes.
- **Documentation**: technical docs are generated from the actual code (not an
  idealized design) and refreshed when architecture changes.
- **Commits/branches**: commit or push only when explicitly requested; never commit on
  a red suite.

## Governance

This constitution supersedes ad-hoc practices. All changes (PRs, reviews, agent work)
MUST verify compliance with the principles above; unjustified complexity or rule
violations MUST be rejected or corrected. Amendments are made by editing this file and
bumping the version per semantic versioning: **MAJOR** for removing/redefining a
principle or governance rule, **MINOR** for adding a principle/section or materially
expanding guidance, **PATCH** for clarifications and wording. Runtime, implementation-
level guidance lives in `AGENTS.md`, `CLAUDE.md`, `.claude/skills/`, and `.claude/rules/`
and MUST stay consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
