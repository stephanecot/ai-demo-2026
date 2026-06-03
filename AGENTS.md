# AGENTS.md — ai-demo-2026

Operating instructions for AI coding agents working in this repo. This is the
**single source of truth**; `CLAUDE.md` imports it. Read it before making
changes.

## Project

Stock management app for a store, built as an **agentic demo**. Monorepo:
- **`backend/`** — Java 25 + Spring Boot 4 / Spring Framework 7 REST API.
- **`frontend/`** — Angular 21 (standalone, signals, zoneless) + Tailwind v4.

## Golden rules

1. **Read the relevant skill before coding** (skills live in `.claude/skills/`).
   They define the canonical patterns for this repo.
2. **Never violate the rules files** — they list forbidden patterns and are
   non-negotiable:
   - Angular → `.claude/rules/angular.md`
   - Java/Spring → `.claude/rules/java.md`
   If you'd write something on those lists, it's a bug.
3. **Match existing code.** One pattern per concern; read sibling files first.
   Keep changes minimal and reviewable; don't refactor unrelated code.
4. **A feature without a test is not done.** Cover happy path + error/edge cases.
5. **Report the real result.** Run the tests/build and state the actual output;
   never claim success on a red run.
6. **Don't commit or push** unless explicitly asked.

## Delegate to the specialized agents

- Backend work → **`spring-boot-dev`** agent.
- Frontend work → **`angular-dev`** agent.

Each agent already knows its skills and rules.

## Skills index

**Backend**
- `java-best-practices` — modern Java language style (records, sealed, pattern
  matching, streams, virtual threads).
- `spring-boot-best-practices` — canonical backend style.
- `spring-boot-persistence` — entities + repositories (layer 1).
- `spring-boot-mongodb` — Spring Data MongoDB (document store alternative to JPA).
- `spring-boot-service-layer` — business logic + transactions (layer 2).
- `spring-boot-rest-api` — controllers, DTOs, errors, versioning (layer 3).
- `spring-boot-testing` — JUnit 5 / slices / Testcontainers.
- `mvn-wrapper` — backend commands (always `./mvnw`).

**Frontend**
- `angular-best-practices` — canonical frontend style.
- `angular-design-system` — tokens, theming, shared UI.
- `tailwindcss` — Tailwind v4 (CSS-first) usage.
- `angular-a11y-responsive` — accessibility (WCAG AA) + responsive layout.
- `angular-i18n-transloco` — runtime multilingual (i18n) with Transloco.
- `angular-testing` — Vitest component/service tests.
- `npm-wrapper` — frontend commands.

**Docs**
- `backend-documentation`, `frontend-documentation` — Markdown + Mermaid → PDF.

## Conventions cheat-sheet

**Backend** (Spring Boot 4): constructor injection only · record DTOs (never
expose entities) · layering controller → service → repository · Jakarta
validation · `ProblemDetail` via one `@RestControllerAdvice` · `RestClient`/
`@HttpExchange` (no `RestTemplate`) · native API versioning · JSpecify
null-safety.

**Frontend** (Angular 21): standalone only · `OnPush` · `inject()` ·
`input()`/`output()`/`model()` · signals + `computed` (no in-place mutation) ·
native control flow `@if`/`@for(track)`/`@switch` · zoneless (no zone.js) ·
`httpResource`/typed services · no `any` · Tailwind v4 + design tokens.

## Commands

- Backend (from `backend/`): `./mvnw test`, `./mvnw spring-boot:run`,
  `./mvnw test -Dtest=ClassName`. See `mvn-wrapper`.
- Frontend (from `frontend/`): `npm ci`, `npm start`, `npm test` (Vitest),
  `npm run lint`. See `npm-wrapper`.
- Docs: `npm run docs:backend`, `npm run docs:frontend`.
