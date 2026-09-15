# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`demo4` — petites annonces web app (functional and visual clone of leboncoin.fr), built as an
**agentic / spec-driven demo** with [OpenSpec](https://github.com/Fission-AI/OpenSpec).
Monorepo with two independent apps:

- **`backend/`** — Java 25, Spring Boot 4.0.6, Spring Data JPA, H2 (file DB in dev under
  `backend/data/`, in-memory in tests). REST API under `/api/**` on port 8080.
- **`frontend/`** — React 19 + TypeScript, Vite 8, react-router 7, Vitest + Testing Library,
  oxlint. Dev server on 5173, proxies `/api` → `http://localhost:8080` (no CORS config needed).

Specs/proposals/tasks are written in **French**; code, identifiers and commit messages in English.

## Spec-driven workflow (OpenSpec) — mandatory

Every feature goes through an OpenSpec **change** before any code is written. Never implement a
feature inline without a change whose `tasks.md` exists.

- `/opsx:propose "<idea>"` — create a change and its 4 artifacts (proposal → specs + design → tasks).
- `/opsx:apply` — implement the tasks of a change, ticking `- [x]` as you go.
- `/opsx:archive` — once shipped, merge delta specs into `openspec/specs/` (the source of truth).
- `/opsx:explore` — investigate before proposing.
- CLI equivalents: `openspec status --change <name>`, `openspec validate <name>`,
  `openspec instructions <artifact> --change <name> --json`, `openspec list`.

Project context and per-artifact rules that the CLI injects live in `openspec/config.yaml` —
update it when conventions change. Spec files must use `### Requirement:` / `#### Scenario:`
(exactly 4 hashes) with WHEN/THEN, or validation fails silently.

Current change: **`create-annonce`** (`openspec/changes/create-annonce/`) — all artifacts
written, tasks not started. Read its `design.md` before touching code: it fixes the domain
model, error contract and frontend structure that later changes reuse.

## Commands

Backend (from `backend/`) — the machine's default JDK is 26, Spring Boot 4.0.6 is validated up
to 25, so export `JAVA_HOME` first:

```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk/25.0.2/libexec/openjdk.jdk/Contents/Home
./mvnw test                          # full suite (*Test.java and *IT.java)
./mvnw test -Dtest=AnnonceControllerTest
./mvnw spring-boot:run               # http://localhost:8080, H2 console at /h2-console
```

Frontend (from `frontend/`):

```bash
npm ci
npm run dev                          # http://localhost:5173
npm test                             # vitest run (jsdom, globals, setup in src/test/setup.ts)
npx vitest run src/features/annonces # single file/dir
npm run typecheck && npm run lint    # tsc -b, oxlint
npm run build
```

## Architecture and conventions

**Backend** — package per domain (`com.demo.annonces.annonce`, `com.demo.annonces.common`),
layered controller → service → repository. Constructor injection only. DTOs are records
(`XxxRequest` with Jakarta validation and French messages, `XxxResponse`); entities are never
serialized. One `@RestControllerAdvice` (`common/GlobalExceptionHandler`) turns every error into
a `ProblemDetail` (RFC 9457); validation errors carry an `errors: [{field, message}]` property
that the frontend maps onto form fields. Time comes from an injected `Clock`. JSpecify
annotations for null-safety. Tests: `@DataJpaTest` for repositories, `@WebMvcTest` for
controllers, one `@SpringBootTest` end-to-end.

**Frontend** — `src/api/` (fetch wrapper throwing `ApiError` with the parsed `ProblemDetail`,
plus one module per resource), `src/features/<domain>/` (pages, forms, pure `validation.ts`
mirroring backend rules), `src/shared/ui/` (Button, TextField, TextArea, Select, Card — the only
place with control styling), `src/shared/layout/` (Header), `src/styles/tokens.css` (design
tokens) + `global.css`. CSS Modules everywhere, no UI framework, no form library, no `any`.
Client validation rules must stay identical to the backend's; the API remains the source of truth.

**Design** — reproduce leboncoin.fr: orange `#FF6E14` primary with pill buttons, white surfaces
(`radius 8px`) on `#F5F5F5` background, white header with textual "leboncoin" logo, system-ui
typography. All values are tokens in `tokens.css` (see spec `leboncoin-design-system`); never
hard-code colors in components. Responsive 375–1440px.

## Rules

- A feature without tests is not done; run the real commands and report the actual output.
- Keep `backend/data/` (H2 file) and `frontend/node_modules` out of git (already ignored).
- Don't commit or push unless asked.
