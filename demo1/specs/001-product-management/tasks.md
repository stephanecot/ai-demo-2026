# Tasks: Product Management

**Input**: Design documents from `/specs/001-product-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/products.openapi.yaml

**Tests**: INCLUDED — the project Constitution (Principle I, Test-First Quality,
NON-NEGOTIABLE) requires tests for every feature. Backend: JUnit 5 (slices +
embedded Mongo + RestTestClient). Frontend: Vitest.

**Organization**: by user story (US1 view → US2 create → US3 edit), each an
independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1 / US2 / US3 (user-story phases only)
- Stack/paths from plan.md: `backend/` (Spring Boot 4, Java 25, MongoDB embedded),
  `frontend/` (Angular 21, Tailwind v4, Transloco, Vitest).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both apps and tooling.

- [X] T001 Create monorepo structure (`backend/`, `frontend/`, `docs/`) per plan.md
- [X] T002 [P] Backend: create `backend/pom.xml` (Java 25, Spring Boot 4) with deps `spring-boot-starter-web`, `spring-boot-starter-data-mongodb`, `spring-boot-starter-validation`, `de.flapdoodle.embed.mongo.spring`, test deps; add Maven wrapper (`backend/mvnw`, `backend/.mvn/`)
- [X] T003 [P] Frontend: scaffold Angular 21 standalone + **zoneless** app in `frontend/` (`package.json`, `angular.json`, `tsconfig*.json`, `src/main.ts`, `src/app/app.component.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`)
- [X] T004 Backend: create `backend/src/main/java/com/demo/stock/StockApplication.java` and `backend/src/main/resources/application.yml` (embedded MongoDB, `dev` profile, virtual threads, port 8080) — depends on T002
- [X] T005 [P] Frontend: configure Tailwind v4 — `frontend/.postcssrc.json` + `frontend/src/styles.css` (`@import "tailwindcss"` + `@theme` design tokens) — depends on T003
- [X] T006 [P] Frontend: configure Vitest test target + ESLint in `frontend/angular.json` / `eslint` config — depends on T003

**Checkpoint**: both apps build and run empty (`./mvnw spring-boot:run`, `npm start`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain, error handling, and frontend shell needed by ALL stories.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

### Backend foundation

- [X] T007 [P] Backend: `Product` document in `backend/src/main/java/com/demo/stock/product/Product.java` (`@Document("products")`, fields per data-model.md, `@Indexed(unique=true)` on `reference`, encapsulated mutators)
- [X] T008 [P] Backend: `ProductRepository` in `backend/src/main/java/com/demo/stock/product/ProductRepository.java` (`MongoRepository<Product,String>`, `findByReference`, `existsByReference`)
- [X] T009 [P] Backend: typed exceptions `ProductNotFoundException` and `DuplicateReferenceException` in `backend/src/main/java/com/demo/stock/product/exception/`
- [X] T010 Backend: `ApiExceptionHandler` (`@RestControllerAdvice` → `ProblemDetail` for 400/404/409, field errors) in `backend/src/main/java/com/demo/stock/common/ApiExceptionHandler.java` — depends on T009
- [X] T011 [P] Backend: `CorsConfig` (allow `http://localhost:4200` on `/api/**`) in `backend/src/main/java/com/demo/stock/common/CorsConfig.java`
- [X] T012 [P] Backend: JSpecify `@NullMarked` `package-info.java` for the `stock` package

### Frontend foundation

- [X] T013 [P] Frontend: `Product` TS model + `CreateProduct`/`UpdateProduct` types mirroring DTOs in `frontend/src/app/core/models/product.model.ts`
- [X] T014 [P] Frontend: `ProductApi` service shell (`httpResource` list + `getById`, method stubs) in `frontend/src/app/core/api/product-api.ts` (`provideHttpClient` in `app.config.ts`)
- [X] T015 [P] Frontend: Transloco i18n infra — config in `frontend/src/app/core/i18n/transloco.config.ts`, `LanguageStore` (signal) + switcher, dictionaries `frontend/src/assets/i18n/fr.json` and `en.json`
- [X] T016 [P] Frontend: ProblemDetail error interceptor in `frontend/src/app/core/interceptors/problem-detail.interceptor.ts` (maps RFC 9457 → localized messages)
- [X] T017 [P] Frontend: shared UI primitives (`ds-button`, `ds-card`, `ds-input`, `ds-badge`) in `frontend/src/app/shared/ui/` (standalone, OnPush, token-based, `data-test` hooks, WCAG AA)
- [X] T018 Frontend: app shell + routing — header with language switcher + routes for `/products`, `/products/:id`, `/products/new`, `/products/:id/edit` (lazy `loadComponent`) in `app.component.*` / `app.routes.ts` — depends on T015, T017

**Checkpoint**: foundation ready — user stories can proceed (in parallel if staffed).

---

## Phase 3: User Story 1 — View products (Priority: P1) 🎯 MVP

**Goal**: Browse the product list and view a product's details, with empty state.

**Independent Test**: with seeded products, the list shows name/reference/quantity/
price; opening one shows full details; empty collection shows a localized empty state.

### Tests for User Story 1 ⚠️ (write first, ensure they fail)

- [X] T019 [P] [US1] Backend `@DataMongoTest` (embedded Mongo) for `ProductRepository` (save + `findByReference`, low-stock query) in `backend/src/test/java/com/demo/stock/product/ProductRepositoryTest.java`
- [X] T020 [P] [US1] Backend `@WebMvcTest` for `GET /api/products` and `GET /api/products/{id}` (200 + JSON shape, 404) in `backend/src/test/java/com/demo/stock/product/ProductControllerReadTest.java`
- [X] T021 [P] [US1] Frontend Vitest for `ProductListComponent` (renders rows, empty state) and `ProductDetailComponent` in `frontend/src/app/features/products/**/*.spec.ts`

### Implementation for User Story 1

- [X] T022 [P] [US1] Backend `ProductResponse` record + `from(Product)` mapper in `backend/src/main/java/com/demo/stock/product/dto/ProductResponse.java`
- [X] T023 [US1] Backend read methods `getAll()` / `getById(id)` in `backend/src/main/java/com/demo/stock/product/ProductService.java` (`@Transactional(readOnly=true)`, throws `ProductNotFoundException`) — depends on T008, T022
- [X] T024 [US1] Backend `ProductController` `GET /api/products` + `GET /api/products/{id}` in `backend/src/main/java/com/demo/stock/product/ProductController.java` — depends on T023
- [X] T025 [P] [US1] Backend `ProductSeeder` (`CommandLineRunner`, sample products when empty) in `backend/src/main/java/com/demo/stock/config/ProductSeeder.java`
- [X] T026 [US1] Frontend wire `ProductApi.all` (`httpResource`) + `getById` to real `GET` endpoints in `frontend/src/app/core/api/product-api.ts` — depends on T014
- [X] T027 [P] [US1] Frontend `ProductListComponent` (`@for` rows, loading/empty/error states, link to detail) in `frontend/src/app/features/products/product-list/`
- [X] T028 [P] [US1] Frontend `ProductDetailComponent` (full fields, not-found handling) in `frontend/src/app/features/products/product-detail/`
- [X] T029 [US1] Add FR/EN translation keys for list/detail/empty/error to `frontend/src/assets/i18n/{fr,en}.json` — depends on T015

**Checkpoint**: US1 fully functional — read-only stock viewer (MVP).

---

## Phase 4: User Story 2 — Create a product (Priority: P2)

**Goal**: Add a new product via a validated form; it appears in the list.

**Independent Test**: submit valid data → product listed; invalid/blank or negative →
blocked with localized field errors; duplicate reference → 409 localized message.

### Tests for User Story 2 ⚠️

- [X] T030 [P] [US2] Backend `ProductService` unit test (Mockito) for `create` happy path + `DuplicateReferenceException` in `backend/src/test/java/com/demo/stock/product/ProductServiceCreateTest.java`
- [X] T031 [P] [US2] Backend `@WebMvcTest` for `POST /api/products` (201 + Location, 400 validation with field errors, 409 duplicate) in `backend/src/test/java/com/demo/stock/product/ProductControllerCreateTest.java`
- [X] T032 [P] [US2] Frontend Vitest for `ProductFormComponent` create mode (validation messages, submit calls API) in `frontend/src/app/features/products/product-form/product-form.component.spec.ts`

### Implementation for User Story 2

- [X] T033 [P] [US2] Backend `CreateProductRequest` record + Jakarta validation in `backend/src/main/java/com/demo/stock/product/dto/CreateProductRequest.java`
- [X] T034 [US2] Backend `ProductService.create(req)` (duplicate pre-check via `existsByReference` → `DuplicateReferenceException`, save, map) — depends on T008, T009, T033
- [X] T035 [US2] Backend `ProductController` `POST /api/products` (201 + `Location`, `@Valid`) — depends on T034
- [X] T036 [US2] Frontend `ProductApi.create(body)` (`POST`, refresh `all`) in `frontend/src/app/core/api/product-api.ts` — depends on T026
- [X] T037 [US2] Frontend `ProductFormComponent` (Signal Forms, validators required/non-negative, ProblemDetail errors) in `frontend/src/app/features/products/product-form/` + route `/products/new` — depends on T017, T018
- [X] T038 [US2] Add FR/EN translation keys for the form + validation/duplicate messages — depends on T015

**Checkpoint**: US1 + US2 work independently.

---

## Phase 5: User Story 3 — Edit a product (Priority: P3)

**Goal**: Update an existing product; changes reflected immediately.

**Independent Test**: open a product, change fields, save → list & detail updated <2s
without manual refresh; invalid edit blocked, original preserved.

### Tests for User Story 3 ⚠️

- [X] T039 [P] [US3] Backend `ProductService` unit test for `update` (success + `ProductNotFoundException`) in `backend/src/test/java/com/demo/stock/product/ProductServiceUpdateTest.java`
- [X] T040 [P] [US3] Backend `@WebMvcTest` for `PUT /api/products/{id}` (200, 400, 404) in `backend/src/test/java/com/demo/stock/product/ProductControllerUpdateTest.java`
- [X] T041 [P] [US3] Frontend Vitest for `ProductFormComponent` edit mode (prefilled, save updates) in `product-form.component.spec.ts`

### Implementation for User Story 3

- [X] T042 [P] [US3] Backend `UpdateProductRequest` record (reference immutable per data-model.md) + validation in `backend/src/main/java/com/demo/stock/product/dto/UpdateProductRequest.java`
- [X] T043 [US3] Backend `ProductService.update(id, req)` (load or 404, apply, save, map) — depends on T008, T042
- [X] T044 [US3] Backend `ProductController` `PUT /api/products/{id}` (`@Valid`) — depends on T043
- [X] T045 [US3] Frontend `ProductApi.update(id, body)` (`PUT`, refresh) in `product-api.ts` — depends on T036
- [X] T046 [US3] Frontend reuse `ProductFormComponent` in edit mode + route `/products/:id/edit` (prefill, save) — depends on T037
- [X] T047 [US3] Add FR/EN translation keys for edit-specific labels — depends on T015

**Checkpoint**: all three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: integration confidence, a11y/responsive, docs, quality gates.

- [X] T048 [P] Backend `RestTestClient` integration test (full create → read → update round-trip on embedded Mongo) in `backend/src/test/java/com/demo/stock/product/ProductApiIT.java`
- [X] T049 [P] Accessibility pass (WCAG 2.2 AA): keyboard, focus-visible, contrast, ARIA/labels across list/detail/form (per `angular-a11y-responsive`)
- [X] T050 [P] Responsive pass: all tasks usable at 320px → desktop
- [X] T051 [P] Backend docs `docs/backend.md` (Mermaid: architecture, ER, request sequence) — `npm run docs:backend`
- [X] T052 [P] Frontend docs `docs/frontend.md` (Mermaid: components, routing, data flow) — `npm run docs:frontend`
- [ ] T053 Run quickstart.md validation (acceptance walkthrough US1–US3 + i18n switch)
- [X] T054 Quality gates: `./mvnw test` and `npm test` green; `npm run lint` / build clean; verify `.claude/rules/*.md` satisfied

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — **blocks all user stories**.
- **User Stories (Phase 3–5)**: depend on Foundational; then independent (parallel
  if staffed) or sequential P1 → P2 → P3.
- **Polish (Phase 6)**: depends on the targeted stories being complete.

### User story dependencies

- **US1 (P1)**: after Foundational. No dependency on other stories. ← MVP.
- **US2 (P2)**: after Foundational. Reuses the form shell; independently testable.
- **US3 (P3)**: after Foundational. Reuses `ProductFormComponent` (T037) and
  `ProductApi` write path (T036) — sequence US2 before US3 for reuse, but US3 is
  independently testable via its own endpoint/tests.

### Within each story

Tests (write first, must fail) → DTO/model → service → controller/endpoint →
frontend wiring/UI → i18n keys.

---

## Parallel Opportunities

- **Setup**: T002, T003 in parallel (backend vs frontend); T005, T006 after T003.
- **Foundational**: T007–T009, T011, T012 (backend) and T013–T017 (frontend) all [P]
  — different files. T010 after T009; T018 after T015+T017.
- **Per story**: the three test tasks ([P]) together; DTO/model + UI components [P].
- **Team split** after Foundational: Dev A → US1, Dev B → US2, Dev C → US3.

### Parallel Example: User Story 1

```bash
# Tests together (write first):
Task: T019 ProductRepository @DataMongoTest
Task: T020 ProductController GET @WebMvcTest
Task: T021 ProductList/Detail Vitest specs
# Then UI components together:
Task: T027 ProductListComponent
Task: T028 ProductDetailComponent
```

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 →
4. **STOP & VALIDATE**: read-only stock viewer works end to end → demo.

### Incremental delivery

Foundation → US1 (MVP, demo) → US2 (create, demo) → US3 (edit, demo). Each story adds
value without breaking the previous; run quickstart after each.

---

## Notes

- Tests are required (Constitution I) — verify they fail before implementing.
- `[P]` = different files, no incomplete dependency.
- Backend always via `./mvnw`; frontend via `npm` (see wrapper skills).
- Respect `.claude/rules/java.md` and `.claude/rules/angular.md` (binding).
- Commit after each task or logical group (do not commit unless asked).

**Total tasks**: 54 — Setup 6 (T001–T006), Foundational 12 (T007–T018),
US1 11 (T019–T029), US2 9 (T030–T038), US3 9 (T039–T047), Polish 7 (T048–T054).
