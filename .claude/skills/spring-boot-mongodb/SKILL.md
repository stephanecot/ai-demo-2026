---
name: spring-boot-mongodb
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Spring Data MongoDB for the Spring Boot 4 backend in this repo — document
  modeling (@Document), MongoRepository + derived/@Query queries, indexes,
  aggregation pipelines, MongoTemplate/Criteria for dynamic queries, references
  vs. embedding, optimistic locking, transactions (replica set), and testing
  with Testcontainers. Use when adding or changing MongoDB documents,
  repositories, or queries. Document equivalent of `spring-boot-persistence`.
---

# Spring Data MongoDB

The persistence layer when the store is **MongoDB** instead of a relational DB.
It owns the document model and how it is stored — nothing else. No business
orchestration (that's the service layer), no DTOs, no web concerns. This is the
document analogue of `spring-boot-persistence`; the same layering rules apply:
persistence → service (`spring-boot-service-layer`) → REST (`spring-boot-rest-api`).

> Pick **one** store per resource. Don't mix JPA entities and Mongo documents
> for the same concept. If the repo already uses JPA, only introduce Mongo for a
> resource that genuinely needs a document model — don't add a second pattern
> casually.

## Setup

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

```yaml
# application.yml — YAML always (see spring-boot-best-practices); never commit credentials
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/stock}
      auto-index-creation: false   # create indexes explicitly (see below)
```

## Documents (`domain/`)

- One `@Document` per aggregate; name the collection explicitly.
- `@Id` field maps to Mongo `_id` (use `String` for an ObjectId, or your own
  natural key). Encapsulate invariants with domain methods — no blanket public
  setters (same rule as JPA entities).
- Model the **aggregate**: embed data that is read and written together; use a
  reference for data with an independent lifecycle (see Embedding vs. references).
- Add `@Version` for optimistic locking on documents updated concurrently.

```java
@Document(collection = "products")
public class Product {
    @Id
    private String id;

    @Indexed(unique = true)
    private String sku;
    private String name;
    private int quantity;

    @Version
    private Long version;

    protected Product() {}                       // framework only

    public Product(String sku, String name, int quantity) {
        this.sku = sku; this.name = name; this.quantity = quantity;
    }

    public void decreaseStock(int amount) {
        if (amount > quantity) throw new InsufficientStockException(sku, quantity, amount);
        this.quantity -= amount;
    }
    // getters; setters only where genuinely needed
}
```

## Repositories (`repository/`)

- Extend `MongoRepository<Document, IdType>`. Spring generates the implementation.
- Prefer **derived query methods**; drop to `@Query` (Mongo JSON) when a derived
  name would be unwieldy. Use a **projection** field set to limit returned fields.
- Return `Optional<T>` for single lookups, `List<T>`/`Page<T>`/`Slice<T>` for
  collections. Pass a `Pageable` for paging/sorting.
- Repositories do persistence only — no business logic, no DTO mapping.

```java
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    List<Product> findByQuantityLessThan(int threshold);

    @Query("{ 'quantity': 0 }")
    List<Product> findOutOfStock();

    // only return name + quantity
    @Query(value = "{ 'sku': ?0 }", fields = "{ 'name': 1, 'quantity': 1 }")
    Optional<Product> findSummaryBySku(String sku);
}
```

## Indexes

- Declare indexes **explicitly** and keep `auto-index-creation=false` in prod
  (auto-creation is a startup cost and a foot-gun at scale).
- `@Indexed` / `@CompoundIndex` on the document for the fields you query/sort on.
  Unique constraints → `@Indexed(unique = true)` (the only way to enforce
  uniqueness in Mongo — there are no DB-level unique columns otherwise).
- Index every field used in a frequent filter or sort; verify with `explain()`.

```java
@Document("products")
@CompoundIndex(name = "category_qty_idx", def = "{ 'category': 1, 'quantity': -1 }")
public class Product { … }
```

## Embedding vs. references

- **Embed** sub-documents read/written with the parent and bounded in size
  (e.g. an order's line items). One read, atomic update.
- **Reference** (`@DocumentReference`, store the id) when the related data has
  its own lifecycle, is large, or is shared. Mongo has no joins — a reference
  means a second query, so prefer embedding for read-heavy aggregates.
- Avoid `@DBRef` in new code (legacy, eager, slower) — use `@DocumentReference`.

## Dynamic queries — MongoTemplate / Criteria

When filters are built at runtime (optional search params), inject `MongoTemplate`
and build a `Query` with `Criteria`. Never concatenate user input into a query
string. Keep this in a repository (a custom fragment), not a service.

```java
public List<Product> search(@Nullable String name, @Nullable Integer maxQty) {
    var query = new Query();
    if (name != null)   query.addCriteria(Criteria.where("name").regex(name, "i"));
    if (maxQty != null) query.addCriteria(Criteria.where("quantity").lte(maxQty));
    return mongoTemplate.find(query, Product.class);
}
```

## Aggregation pipelines

For grouping/reporting, use the typed aggregation DSL (not hand-built JSON).

```java
var agg = Aggregation.newAggregation(
    Aggregation.match(Criteria.where("quantity").gt(0)),
    Aggregation.group("category").sum("quantity").as("total"),
    Aggregation.sort(Sort.Direction.DESC, "total"));
var results = mongoTemplate.aggregate(agg, "products", CategoryTotal.class)
                           .getMappedResults();
```

## Atomic updates

Prefer a targeted `$inc`/`$set` via `MongoTemplate.updateFirst(...)` over
read-modify-write when you only change a counter — it's atomic server-side and
avoids lost updates. Use `@Version` (optimistic locking) when you must
read-modify-write the whole document.

## Transactions

- Multi-document `@Transactional` requires a **replica set** (a standalone
  `mongod` has no transactions). Same rule as JPA: `@Transactional` lives on
  **service methods**, never on repositories.
- Mongo's natural unit of atomicity is the **single document** — model
  aggregates so most writes are one document and you rarely need a transaction.

## Testing

Use a real MongoDB via **Testcontainers** (`@Testcontainers` +
`MongoDBContainer`) with `@DataMongoTest`, not an in-memory fake — behavior
(indexes, queries, aggregation) must match prod. Start the container as a replica
set if a test needs transactions. See `spring-boot-testing`.

```java
@DataMongoTest
@Testcontainers
class ProductRepositoryTest {
    @Container
    static final MongoDBContainer MONGO = new MongoDBContainer("mongo:7");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.data.mongodb.uri", MONGO::getReplicaSetUrl);
    }
    // @Autowired ProductRepository — assert state, not mocks
}
```

## Next layer

A repository alone isn't a feature. Expose behavior through a service
(`spring-boot-service-layer`), then over HTTP (`spring-boot-rest-api`). Never
expose a `@Document` across the REST boundary — map to record DTOs.
