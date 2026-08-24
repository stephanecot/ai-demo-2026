---
name: spring-boot-persistence
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  The persistence layer for the Spring Boot 4 backend in this repo — JPA
  entities (domain model), Spring Data JPA repositories, derived/@Query queries,
  fetch strategy, and schema/seed (Flyway, data.sql). Use when adding or
  changing entities, tables, or repository queries. This is layer 1 of the
  new-resource flow: persistence → service (`spring-boot-service-layer`) → REST
  (`spring-boot-rest-api`).
---

# Persistence layer (entities + repositories)

The bottom layer. It owns the domain model and how it is stored — nothing else.
No business orchestration here (that's the service layer), no DTOs, no web
concerns. Worked example: the `Product` resource.

## Entities (`domain/`)

- One `@Entity` per persistent concept; `@Table` names it explicitly.
- Generated id (`@GeneratedValue`). A `protected` no-arg constructor for JPA +
  a real constructor for valid creation.
- Encapsulate: expose domain methods (e.g. `decreaseStock(int)`), avoid blanket
  public setters. Invariants live on the entity.
- Associations default to `FetchType.LAZY`. Add bidirectional relations only
  when truly needed, and keep both sides consistent.

```java
@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private int quantity;

    protected Product() {}                       // JPA only

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

- Extend `JpaRepository<Entity, IdType>`. Spring generates the implementation.
- Prefer **derived query methods** for readability; drop to `@Query` (JPQL) when
  the derived name would be unwieldy.
- Return `Optional<T>` for single lookups, `List<T>`/`Page<T>` for collections.
- Repositories do persistence only — no business logic, no mapping to DTOs.

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);
    List<Product> findByQuantityLessThan(int threshold);

    @Query("select p from Product p where p.quantity = 0")
    List<Product> findOutOfStock();
}
```

## Transactions

`@Transactional` belongs on **service methods**, not repositories. Repository
calls run inside the surrounding service transaction. (See
`spring-boot-service-layer`.)

## Schema & seed data

- Real environments: version the schema with **Flyway** (`db/migration/V1__*.sql`).
  Never auto-generate prod DDL from entities.
- Demo/dev: seed with a `CommandLineRunner` bean or `data.sql`. Keep
  `spring.jpa.hibernate.ddl-auto` at `validate` (or `none`) once Flyway owns the
  schema; `create-drop` is acceptable only for a throwaway demo profile.

## Testing

Test queries with the `@DataJpaTest` slice (rolls back per test). See
`spring-boot-testing`.

## Next layer

A repository alone isn't a feature. Expose behavior through a service
(`spring-boot-service-layer`), then over HTTP (`spring-boot-rest-api`).
