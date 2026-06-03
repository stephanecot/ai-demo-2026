# Phase 1 — Data Model: Product Management

One aggregate/entity: **Product**, stored in the MongoDB `products` collection.

## Entity: Product

| Field         | Type            | Required | Rules / Notes |
|---------------|-----------------|----------|---------------|
| `id`          | string (ObjectId)| system   | Technical id; assigned by Mongo on create; never edited by the user. Exposed as string. |
| `reference`   | string          | yes      | Business SKU. **Unique** (unique index). Trimmed, non-blank, max 64 chars. |
| `name`        | string          | yes      | Non-blank, max 120 chars. |
| `description` | string          | no       | Optional, max 2000 chars. |
| `category`    | string          | yes      | Non-blank, max 60 chars. (Free-text label in v1.) |
| `unitPrice`   | decimal         | yes      | ≥ 0. Single currency (unspecified). Stored as `BigDecimal`. |
| `quantity`    | integer         | yes      | ≥ 0. Whole units of stock. |

### Validation (Jakarta Bean Validation on request DTOs)

- `reference`: `@NotBlank`, `@Size(max = 64)`
- `name`: `@NotBlank`, `@Size(max = 120)`
- `description`: `@Size(max = 2000)` (nullable)
- `category`: `@NotBlank`, `@Size(max = 60)`
- `unitPrice`: `@NotNull`, `@PositiveOrZero` (`BigDecimal`)
- `quantity`: `@PositiveOrZero` (`int`)
- **Uniqueness**: `reference` unique across the collection — enforced by a unique
  Mongo index **and** a service pre-check → `409` `DuplicateReferenceException`.

### Indexes

- `_id` (default).
- `reference` → `@Indexed(unique = true)`.

### Identity & lifecycle

- Created with no `id`; Mongo assigns `_id`. `reference` is provided by the user and
  must be unique.
- Edited: all business fields except `id` may change; if `reference` changes, the
  uniqueness rule re-applies. **Last-write-wins** (no optimistic locking in v1; the
  spec accepts this for rare concurrent edits).
- No delete in this increment.

## DTOs (REST boundary — records, entities never exposed)

```text
CreateProductRequest { reference, name, description?, category, unitPrice, quantity }
UpdateProductRequest { name, description?, category, unitPrice, quantity }   # reference editable? see note
ProductResponse      { id, reference, name, description, category, unitPrice, quantity }
```

> **Note**: For v1, `reference` is set on create and treated as immutable on edit
> (`UpdateProductRequest` omits it) to keep identity stable and the form simple. This
> satisfies the edit scenarios (price/quantity/name/category/description). Allowing
> reference change can be added later without breaking the contract.

## TypeScript mirror (frontend)

```ts
export interface Product {
  id: string;
  reference: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  quantity: number;
}
export type CreateProduct = Omit<Product, 'id'>;
export type UpdateProduct = Omit<Product, 'id' | 'reference'>;
```

## Mapping to Success Criteria / FRs

- FR-001/002 → `ProductResponse` list & detail.
- FR-003/004 → Create/Update DTOs + service.
- FR-005 → validation rules + uniqueness above.
- FR-006 → Mongo `products` collection (embedded).
- Edge cases (duplicate reference, invalid input, not found) → 409 / 400 / 404.
