# Phase 0 — Research: Product Management

All Technical Context items are resolved; no remaining NEEDS CLARIFICATION.

## 1. Embedded, server-less MongoDB

**Decision**: Use **flapdoodle embedded MongoDB** (`de.flapdoodle.embed.mongo.spring`
+ `spring-boot-starter-data-mongodb`). It starts a local `mongod` process managed by
the app lifecycle — no external server, no Docker.

**Rationale**: The spec mandates "embedded MongoDB, no server". Flapdoodle runs an
ephemeral MongoDB bound to the Spring context, so `./mvnw spring-boot:run` works on a
clean machine with zero infra. Same mechanism powers `@DataMongoTest`.

**Alternatives considered**:
- *Testcontainers MongoDB* — realistic, but requires Docker, contradicting
  "no server". Kept as a documented option for CI hardening only.
- *In-memory Map repository* — no Mongo at all; rejected because the spec explicitly
  wants MongoDB and we want real Spring Data behavior (queries, indexes).

## 2. Persistence of demo data

**Decision**: Seed sample products at startup via a `CommandLineRunner`
(`ProductSeeder`) when the collection is empty. For optional cross-restart
persistence, flapdoodle can point at a fixed data dir; default demo is fresh on
each run.

**Rationale**: Gives an immediately populated, demoable catalogue (US1 empty-state
still reachable by clearing). Simple, no migrations needed for a document store.

**Alternatives considered**: Importing a JSON fixture file — heavier; deferred.

## 3. Internationalization (multilingual UI)

**Decision**: **Transloco** (`@jsverse/transloco`) with JSON dictionaries
(`assets/i18n/fr.json`, `en.json`) and a signal-driven `LanguageStore` to switch at
runtime. Aligns with the repo's `angular-i18n-transloco` skill.

**Rationale**: Angular's built-in `@angular/localize` is compile-time (one bundle per
locale, rebuild to add a language) and cannot switch language at runtime without a
reload — violating FR-007/SC-006. Transloco loads dictionaries at runtime and swaps
language instantly.

**Alternatives considered**: `@angular/localize` (compile-time, rejected — no runtime
switch); `ngx-translate` (mature but Transloco is the repo standard and signal-friendly).

## 4. Frontend data access

**Decision**: A typed `ProductApi` service: reads via **`httpResource<Product[]>()`**
(signals: `value`/`isLoading`/`error`) for the list/detail; writes (create/edit) via
`HttpClient` methods returning observables, then refresh the resource.

**Rationale**: Matches `angular-best-practices` (signals-first, zoneless). `httpResource`
gives loading/error/empty states for free (FR-011) and immediate reactivity (FR-012).

**Alternatives considered**: Manual `subscribe` + signal assignment — more boilerplate,
easy to leak subscriptions.

## 5. Forms (create & edit)

**Decision**: **Signal Forms** (`@angular/forms/signals`) for the product form, with
validators (`required`, non-negative price/quantity). Shared between create and edit.

**Rationale**: New screen, no legacy reactive-forms code to match; signal forms are the
Angular 21 recommendation and integrate with the signals architecture.

**Alternatives considered**: Reactive Forms — acceptable, but Signal Forms are preferred
for new code per `angular-best-practices`.

## 6. Product identity & uniqueness

**Decision**: Mongo document `_id` (ObjectId, exposed as string `id`) is the technical
key; **`reference` (SKU)** is a business-unique field enforced by a **unique index**
(`@Indexed(unique = true)`), with a service-level pre-check to return a friendly 409
`ProblemDetail` (`DuplicateReferenceException`) instead of a raw duplicate-key error.

**Rationale**: Separates technical id from business reference; the unique index is the
source of truth, the pre-check yields a clean, localized error (FR-005, edge case).

**Alternatives considered**: Using `reference` as `_id` — couples identity to a mutable
business field; rejected.

## 7. Error contract

**Decision**: All errors as **`ProblemDetail`** (RFC 9457) from one
`@RestControllerAdvice`: 400 (validation, with field errors), 404 (not found), 409
(duplicate reference). Frontend interceptor maps `ProblemDetail` to localized messages.

**Rationale**: Constitution III + `spring-boot-rest-api`; gives the SPA a consistent,
machine-readable error shape.

## 8. CORS

**Decision**: Explicit CORS config allowing the Angular dev origin
(`http://localhost:4200`) for `/api/**`. Dev proxy (`proxy.conf.json`) optional.

**Rationale**: SPA and API run on different ports in dev; no auth so config is minimal.
