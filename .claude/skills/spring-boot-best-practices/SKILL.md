---
name: spring-boot-best-practices
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Canonical Java 25 + Spring Boot 4 / Spring Framework 7 conventions for this
  repo — layering, constructor injection, record DTOs, JPA, validation,
  ProblemDetail error handling, RestClient, null-safety (JSpecify), API
  versioning, and resilience. Use when writing or reviewing ANY backend code.
---

# Spring Boot 4 best practices

Spring Boot 4 / Spring Framework 7 (Nov 2025) on **Java 25** (baseline 17),
Jakarta EE 11, Jackson 3. Write modern, null-safe, layered code.

## Layering

```
controller  → web edge: maps HTTP ⇄ DTO, validates, no business logic
service     → business logic, @Transactional boundaries
repository  → Spring Data JPA, persistence only
domain      → JPA entities (never crossing the REST boundary)
dto         → request/response records
```

Controllers are thin. Business rules live in services. Repositories never leak
above the service layer.

## Dependency injection

- **Constructor injection only.** No field `@Autowired`. Use `final` fields.
- A single constructor → no annotation needed; Spring wires it automatically.

```java
@Service
public class ProductService {
    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }
}
```

## DTOs & mapping

- DTOs are **`record`s**. Never serialize JPA entities directly (lazy-loading
  traps, leaking internals, coupling the API to the schema).
- Map entity ⇄ DTO explicitly (static factory or a small mapper). Keep mapping
  out of controllers.

```java
public record ProductResponse(Long id, String sku, String name, int quantity) {
    public static ProductResponse from(Product p) {
        return new ProductResponse(p.getId(), p.getSku(), p.getName(), p.getQuantity());
    }
}
```

## Controllers

- `@RestController` + `@RequestMapping("/api/...")`. Return `ResponseEntity<T>`
  or the body directly; use correct status codes (201 + `Location` on create).
- Validate request bodies with `@Valid`.
- The three layers each have a dedicated skill: `spring-boot-persistence`
  (entities + repositories), `spring-boot-service-layer` (business logic +
  transactions), `spring-boot-rest-api` (controllers, DTOs, errors, versioning).

## Validation

- Jakarta Bean Validation on DTO records: `@NotBlank`, `@NotNull`, `@Positive`,
  `@Size`, `@Email`. Validation failures are handled centrally (below).

## Error handling

- One `@RestControllerAdvice` returning **`ProblemDetail`** (RFC 9457).
- Throw typed domain exceptions (e.g. `ProductNotFoundException`) in services;
  translate them to HTTP in the advice. Never expose stack traces.

```java
@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(ProductNotFoundException.class)
    ProblemDetail handleNotFound(ProductNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}
```

## Persistence (Spring Data JPA)

- Entities in `domain`; `@Entity` with a generated id. Avoid bidirectional
  relations unless needed; default to `FetchType.LAZY` for associations.
- Repositories extend `JpaRepository<Entity, Id>`; use derived queries or
  `@Query`. Keep `@Transactional` on service methods, not repositories.
- Use Flyway/Liquibase for schema in real environments; for the demo, seed via
  a `CommandLineRunner` or `data.sql`.

## HTTP clients (calling other services)

- Use **`RestClient`** or declarative **`@HttpExchange`** interfaces. Do NOT use
  the legacy `RestTemplate` in new code.

```java
@HttpExchange("/suppliers")
interface SupplierClient {
    @GetExchange("/{id}") Supplier byId(@PathVariable String id);
}
```

## Null-safety (JSpecify)

- Annotate packages `@NullMarked` (package-info.java) and mark nullable returns/
  params with `@Nullable`. This drives IDE/tooling checks and Kotlin interop.

## API versioning

- Spring Framework 7 supports native REST versioning. Configure the strategy
  (header/path/param) once, then version mappings:

```java
@GetMapping(path = "/products", version = "1.1")
```

Add a version only when the contract changes incompatibly; keep the old one
until clients migrate.

## Resilience

- Use built-in `@Retryable` (with `@Recover`) and `@ConcurrencyLimit` from
  Spring core rather than adding external resilience libraries.

## Configuration

- **YAML, always.** Configuration lives in `application.yml` (and
  `application-{profile}.yml`) — **never `.properties`**. YAML is the canonical
  format for this repo: profiles, nested keys, and lists read far better.
- One file per profile (`dev`, `test`, `prod`), or `---` document separators
  with `spring.config.activate.on-profile` inside a single file.
- Reference env vars for anything environment-specific or secret
  (`${MONGODB_URI}`), with a sane local default where appropriate.
- Bind config to typed **`@ConfigurationProperties` records**, not scattered
  `@Value`.
- Never commit secrets; use env vars / externalized config.

```yaml
# application.yml
spring:
  application:
    name: stock-service
  threads:
    virtual:
      enabled: true

server:
  port: 8080

stock:                      # bound to a @ConfigurationProperties record
  low-stock-threshold: 5
  reorder-enabled: true
---
spring:
  config:
    activate:
      on-profile: prod
  data:
    mongodb:
      uri: ${MONGODB_URI}
```

```java
@ConfigurationProperties(prefix = "stock")
public record StockProperties(int lowStockThreshold, boolean reorderEnabled) {}
```

## Don't

- Don't put business logic in controllers or queries in services-by-hand.
- Don't return entities from controllers.
- Don't catch-and-swallow exceptions; let the advice handle them.
- Don't use field injection or `RestTemplate` in new code.
