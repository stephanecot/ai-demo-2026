# ai-demo-2026 — Stock management (agentic demo)

Demo application for managing a **store's stock**, built as a showcase of an
**agentic** approach (an LLM agent able to act on the business domain via tool
calling). Backend + frontend monorepo.

## Stack

| Side | Technologies |
|------|--------------|
| **Backend** (`backend/`) | Java 25, Spring Boot 4 / Spring Framework 7, Spring Data JPA, REST + ProblemDetail |
| **Frontend** (`frontend/`) | Angular 21 (standalone, signals, zoneless), Tailwind CSS v4, Vitest |
| **Docs** | Markdown + Mermaid → PDF (`@mermaid-js/mermaid-cli` + `md-to-pdf`) |

> ⚠️ The application code is not generated yet: for now this repository holds the
> **development tooling** (`.claude/`) that frames quality before the app is
> built.

## Repository layout (target)

```
ai-demo-2026/
├── backend/         # Spring Boot 4 API (Maven, ./mvnw)
├── frontend/        # Angular 21 SPA (npm)
├── docs/            # backend.md / frontend.md (+ generated PDFs)
├── .claude/         # development agents, skills and rules
├── AGENTS.md        # agent instructions (single source of truth)
├── CLAUDE.md        # imports AGENTS.md (Claude Code config)
└── README.md
```

## Getting started

### Backend

```bash
cd backend
./mvnw spring-boot:run            # start the API
./mvnw test                       # tests
```

### Frontend

```bash
cd frontend
npm ci                            # install dependencies
npm start                         # dev server
npm test                          # tests (Vitest)
```

## Technical documentation

Generated from the code as Markdown + Mermaid diagrams, exportable to PDF:

```bash
npm run docs:backend              # docs/backend.pdf
npm run docs:frontend             # docs/frontend.pdf
```

## Development tooling (`.claude/`)

The repository ships **agents**, **skills** and **rules** that encode the
project's best practices and forbidden patterns (single source of truth:
[`AGENTS.md`](./AGENTS.md)). The model: one agent per domain, skills that
describe *what to do*, rules that list *what must never be done*.

### Agents (`.claude/agents/`)

Specialized developers to delegate domain work to. Each is kept intentionally
light and loads the relevant skill on demand — it does not preload them.

| Agent | Domain | Responsibility |
|-------|--------|----------------|
| **`spring-boot-dev`** | Backend | Java 25 + Spring Boot 4: controllers, services, repositories, DTOs, validation, error handling, backend tests. |
| **`angular-dev`** | Frontend | Angular 21: components, services, routing, state (signals), forms, HTTP calls, design system, i18n, accessibility, Vitest tests. |

> The same two agents are mirrored for GitHub Copilot under `.github/agents/`.

### Skills (`.claude/skills/`)

The repo's canonical patterns. They surface automatically based on their
description, or on explicit invocation. Read the matching one **before** writing
code.

**Backend — language & framework**

| Skill | Purpose |
|-------|---------|
| `java-best-practices` | Modern **Java language** practices (records, sealed types, pattern matching, switch expressions, text blocks, `Optional`, Stream API, immutability, virtual threads). |
| `spring-boot-best-practices` | **Spring Boot 4** conventions: layering, constructor injection, record DTOs, validation, `ProblemDetail`, `RestClient`, null-safety, versioning, **YAML config**. |

**Backend — "new resource" flow (persistence → service → REST)**

| Skill | Layer |
|-------|-------|
| `spring-boot-persistence` | Layer 1 — JPA entities + Spring Data repositories, derived/`@Query` queries, schema (Flyway). |
| `spring-boot-mongodb` | Document variant of layer 1 — Spring Data **MongoDB**: `@Document`, `MongoRepository`, indexes, aggregation, `MongoTemplate`, Testcontainers. |
| `spring-boot-service-layer` | Layer 2 — `@Service`, business rules, `@Transactional`, typed exceptions, entity⇄DTO mapping, resilience (`@Retryable`). |
| `spring-boot-rest-api` | Layer 3 — thin `@RestController`s, record DTOs + validation, HTTP statuses, `@RestControllerAdvice`, native versioning. |
| `spring-boot-testing` | Testing pyramid: unit, `@WebMvcTest`/MockMvc, `@DataJpaTest`, `RestTestClient`, `@SpringBootTest` + Testcontainers. |
| `mvn-wrapper` | Backend command reference, always via `./mvnw`. |

**Frontend (Angular 21)**

| Skill | Purpose |
|-------|---------|
| `angular-best-practices` | Angular 21 conventions: standalone, signals, zoneless, `inject()`, native control flow, modern HTTP/state. |
| `angular-design-system` | Design tokens (CSS custom properties), light/dark theming, typed shared component library, accessibility. |
| `tailwindcss` | Tailwind CSS v4 with CSS-first config (`@theme`, no `tailwind.config.js`), utility conventions. |
| `angular-a11y-responsive` | **Accessibility** (WCAG 2.2 AA) + **responsive**: semantic HTML/ARIA, keyboard, focus management, contrast, mobile-first layout, container queries. |
| `angular-i18n-transloco` | Runtime **multilingual** (i18n) with **Transloco**: setup, JSON files, `*transloco` pipe/directive, lazy scopes, signal-driven language switching, testing. |
| `angular-testing` | Vitest tests: TestBed with signals/zoneless, async via `whenStable()`, `HttpTestingController`, `data-test` selectors. |
| `npm-wrapper` | Frontend command reference (install, serve, build, test, lint, docs). |

**Documentation**

| Skill | Purpose |
|-------|---------|
| `backend-documentation` | Backend technical docs (Markdown + Mermaid diagrams) exported to PDF. |
| `frontend-documentation` | Frontend technical docs (Markdown + Mermaid diagrams) exported to PDF. |

> The repo also includes the **Spec Kit** suite (`speckit-*`) for the
> specification → plan → tasks → implementation flow.

### Rules (`.claude/rules/`) — non-negotiable forbidden patterns

Lists of patterns that must **never** be written; if one shows up in a diff, it
is a bug to fix.

| File | Scope |
|------|-------|
| [`.claude/rules/java.md`](./.claude/rules/java.md) | Backend forbidden patterns (field injection, exposed entity, `RestTemplate`, `.properties` config, `EAGER` by default…). |
| [`.claude/rules/angular.md`](./.claude/rules/angular.md) | Frontend forbidden patterns (`NgModule`, `*ngIf`/`*ngFor`, `any`, Karma, hard-coded colors…). |

## Conventions

- Backend: always through the Maven wrapper `./mvnw`.
- Frontend: Angular 21 **standalone / signals / zoneless**; Tailwind v4 with
  CSS-first config; no Karma (Vitest).
- A feature without a test is not done; always report the real output of the
  tests/build.
