# Implementation Plan: Product Management

**Branch**: `001-product-management` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-product-management/spec.md`

## Summary

Bootstrap the store stock-management application (backend + frontend) and deliver
the first capability: **managing products** — list, view, create, edit. The UI is
modern, accessible (WCAG 2.2 AA), responsive (≥320px), and multilingual (FR/EN at
launch) with runtime language switching. No authentication. Persistence uses an
**embedded, server-less MongoDB** so the demo runs with a single command and no
external infrastructure.

Technical approach: a Spring Boot 4 REST API (`controller → service → repository`,
record DTOs, `ProblemDetail`, Spring Data MongoDB) consumed by an Angular 21 SPA
(standalone, signals, zoneless, Tailwind v4, Transloco). The REST contract is
explicit and typed on both sides.

## Technical Context

**Language/Version**: Backend — Java 25 (Spring Boot 4 / Spring Framework 7).
Frontend — TypeScript 5.x on Angular 21.

**Primary Dependencies**:
- Backend: `spring-boot-starter-web`, `spring-boot-starter-data-mongodb`,
  `spring-boot-starter-validation`, embedded MongoDB via
  `de.flapdoodle.embed.mongo.spring` (server-less, no Docker).
- Frontend: Angular 21, Tailwind CSS v4 (`@tailwindcss/postcss`),
  `@jsverse/transloco` (i18n), Vitest.

**Storage**: MongoDB, run **embedded** (flapdoodle) for dev and tests — no server
to provision. One `products` collection.

**Testing**: Backend — JUnit 5 + AssertJ + Mockito; `@WebMvcTest` (web slice),
`@DataMongoTest` + embedded Mongo (repository), `RestTestClient` (integration).
Frontend — Vitest (TestBed, signals/zoneless, `HttpTestingController`).

**Target Platform**: Browser SPA (evergreen) + JVM 25 server (local/demo).

**Project Type**: Web application — monorepo with `backend/` and `frontend/`.

**Performance Goals**: Demo scale. Product list renders quickly for hundreds of
items; an edit is reflected in the UI in <2s (SC-003). No high-throughput target.

**Constraints**: No authentication (open access). WCAG 2.2 AA, keyboard-operable.
Responsive from 320px. Fully localized UI with runtime language switch. Server-less
persistence (single command to run). Backend config in YAML; no secrets in repo.

**Scale/Scope**: Single store, single stock. ~3 screens (list, detail, create/edit
form), one entity (Product), 4 endpoints. Small dataset (seeded sample products).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against Constitution v1.0.0:

- **I. Test-First Quality** — PASS. Every layer is tested (service unit, web slice,
  repository slice with embedded Mongo, integration); frontend components/services
  tested with Vitest. Tests cover happy path + validation/error/empty edge cases.
- **II. Layered Architecture** — PASS. Backend `controller → service → repository`;
  frontend `core / shared / features`. One pattern per concern.
- **III. Contract-First, Type-Safe APIs** — PASS. Record DTOs (entities never
  exposed), `ProblemDetail` errors, OpenAPI contract in `contracts/`, mirrored as a
  typed TS `Product` model. No `any`.
- **IV. Modern-Stack Discipline** — PASS. Spring Boot 4 idioms (constructor
  injection, Spring Data Mongo, Jakarta validation, JSpecify) and Angular 21
  (standalone, signals, zoneless, control flow, Tailwind v4). `.claude/rules/*.md`
  are binding.
- **V. Simplicity & Consistency** — PASS. One entity, minimal endpoints, no
  speculative abstractions; embedded Mongo avoids infra complexity.
- **Tech & Security constraints** — PASS. Embedded server-less Mongo; YAML config;
  no secrets; input validated at the boundary; explicit CORS for the SPA origin.

No violations → **Complexity Tracking is empty**.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
│   └── products.openapi.yaml
└── checklists/
    └── requirements.md  # from /speckit-specify
```

### Source Code (repository root)

```text
backend/
├── pom.xml
├── mvnw, mvnw.cmd, .mvn/
└── src/
    ├── main/
    │   ├── java/com/demo/stock/
    │   │   ├── StockApplication.java
    │   │   ├── product/
    │   │   │   ├── Product.java                  # @Document
    │   │   │   ├── ProductRepository.java        # MongoRepository
    │   │   │   ├── ProductService.java           # business logic
    │   │   │   ├── ProductController.java         # /api/products
    │   │   │   ├── dto/
    │   │   │   │   ├── CreateProductRequest.java
    │   │   │   │   ├── UpdateProductRequest.java
    │   │   │   │   └── ProductResponse.java
    │   │   │   └── exception/
    │   │   │       ├── ProductNotFoundException.java
    │   │   │       └── DuplicateReferenceException.java
    │   │   ├── common/
    │   │   │   ├── ApiExceptionHandler.java       # @RestControllerAdvice → ProblemDetail
    │   │   │   └── CorsConfig.java
    │   │   └── config/
    │   │       └── ProductSeeder.java             # CommandLineRunner sample data
    │   └── resources/
    │       ├── application.yml
    │       └── application-dev.yml
    └── test/java/com/demo/stock/product/
        ├── ProductServiceTest.java
        ├── ProductControllerTest.java            # @WebMvcTest
        ├── ProductRepositoryTest.java            # @DataMongoTest + embedded
        └── ProductApiIT.java                      # RestTestClient

frontend/
├── package.json, angular.json, tsconfig*.json, .postcssrc.json
└── src/
    ├── main.ts, index.html, styles.css            # Tailwind v4 + @theme tokens
    └── app/
        ├── app.config.ts, app.routes.ts
        ├── app.component.ts/.html/.css
        ├── core/
        │   ├── models/product.model.ts            # mirrors DTOs
        │   ├── api/product-api.ts                 # httpResource + commands
        │   ├── i18n/transloco.config.ts, language.store.ts
        │   └── interceptors/problem-detail.interceptor.ts
        ├── shared/ui/                             # button, card, input, badge…
        └── features/products/
            ├── product-list/
            ├── product-detail/
            └── product-form/                      # create + edit
    └── assets/i18n/{fr,en}.json
```

**Structure Decision**: Web-application monorepo (`backend/` + `frontend/`), matching
the repo's established conventions (AGENTS.md). Backend is feature-packaged
(`product/` holds its controller/service/repository/dtos) per the layered skills;
frontend follows `core / shared / features`. This isolates the Product feature while
the bootstrapped app skeleton (config, CORS, i18n, design tokens) is reusable for
future features.

## Complexity Tracking

> No constitution violations — section intentionally empty.
