# Quickstart — Product Management

How to run and validate the feature locally. No database server, no Docker — MongoDB
runs **embedded** (flapdoodle).

## Prerequisites

- Java 25 (`java -version`)
- Node 22+ / npm 11 (`node -v`)

## Run the backend (embedded MongoDB)

```bash
cd backend
./mvnw spring-boot:run            # starts API on :8080 with an embedded mongod
./mvnw test                       # unit + slice + integration tests
```

On first start, `ProductSeeder` inserts a few sample products if the collection is
empty. Quick check:

```bash
curl http://localhost:8080/api/products
curl -X POST http://localhost:8080/api/products \
  -H 'Content-Type: application/json' \
  -d '{"reference":"SKU-009","name":"New","category":"misc","unitPrice":1.5,"quantity":10}'
```

## Run the frontend

```bash
cd frontend
npm ci
npm start                         # Angular dev server on :4200 (proxy → :8080)
npm test                          # Vitest
```

Open http://localhost:4200.

## Validate against the spec (acceptance walkthrough)

1. **US1 — View** (P1): the list shows seeded products with name, reference, quantity,
   price; click one → detail view. Clear the collection → localized empty state.
2. **US2 — Create** (P2): open the create form, submit valid data → product appears in
   the list. Submit with a blank name or negative price → blocked with localized,
   field-level messages. Reuse an existing reference → 409, localized message.
3. **US3 — Edit** (P3): open a product, change price/quantity, save → list & detail
   reflect it within ~2s, no manual refresh. Invalid edit → blocked, original kept.
4. **i18n**: switch FR ⇄ EN → entire UI updates instantly, entered form data preserved.
5. **Responsive**: at 320px width all tasks remain usable.
6. **a11y**: complete view/create/edit using keyboard only; focus visible; labels read
   by screen reader; contrast AA.

## Contract

REST contract: [`contracts/products.openapi.yaml`](./contracts/products.openapi.yaml).
Endpoints: `GET /api/products`, `GET /api/products/{id}`, `POST /api/products`,
`PUT /api/products/{id}`. Errors as `ProblemDetail` (400/404/409).
