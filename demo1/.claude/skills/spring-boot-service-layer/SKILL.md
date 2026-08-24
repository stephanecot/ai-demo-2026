---
name: spring-boot-service-layer
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  The business/service layer for the Spring Boot 4 backend in this repo —
  @Service classes, business rules, @Transactional boundaries, typed domain
  exceptions, entity⇄DTO mapping, and resilience (@Retryable). Use when adding
  or changing business logic. This is layer 2 of the new-resource flow:
  persistence (`spring-boot-persistence`) → service → REST (`spring-boot-rest-api`).
---

# Service layer (business logic)

The middle layer. It orchestrates the domain: applies business rules, defines
transaction boundaries, and translates between entities and DTOs so the web
layer never touches JPA. Worked example: the `Product` resource.

## Responsibilities

- Hold **all business logic**. Controllers and repositories stay dumb.
- Define **transaction boundaries** with `@Transactional`.
- Throw **typed domain exceptions** (`ProductNotFoundException`,
  `DuplicateSkuException`) — the REST layer maps them to HTTP/ProblemDetail.
- Map entity ⇄ DTO so entities never cross the REST boundary.

## Anatomy

- `@Service`, **constructor injection**, `final` dependencies.
- Read methods: `@Transactional(readOnly = true)`. Write methods:
  `@Transactional`.
- A service method is a use case: validate preconditions, mutate via domain
  methods, return a DTO.

```java
@Service
public class ProductService {
    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return repository.findById(id)
            .map(ProductResponse::from)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        repository.findBySku(req.sku()).ifPresent(p -> {
            throw new DuplicateSkuException(req.sku());
        });
        var saved = repository.save(new Product(req.sku(), req.name(), req.quantity()));
        return ProductResponse.from(saved);
    }

    @Transactional
    public void recordSale(Long id, int amount) {
        var product = repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        product.decreaseStock(amount);   // invariant enforced on the entity
    }
}
```

## Entity ⇄ DTO mapping

- Keep mapping here (or in the DTO's static factory), never in controllers.
- For simple cases a record factory (`ProductResponse.from(entity)`) is enough;
  introduce a dedicated mapper only when mapping grows non-trivial. Don't pull
  in a mapping framework for a handful of fields.

## Transaction rules

- One transaction per use case; don't span unrelated work.
- Within a `@Transactional` method, changes to a managed entity are flushed at
  commit — no explicit `save()` needed for updates (it's harmless but optional).
- Avoid calling a `@Transactional` method from within the same bean (self-
  invocation bypasses the proxy).

## Resilience (when needed)

For flaky external calls or contended operations, use Spring's built-in
`@Retryable` (+ `@Recover`) and `@ConcurrencyLimit` rather than external
libraries. Apply at the service method that owns the risky work.

## Domain exceptions

Define small, typed exceptions in the service/domain area. They carry enough
context for the REST layer to build a meaningful `ProblemDetail`:

```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) { super("Product %d not found".formatted(id)); }
}
```

## Testing

Plain JUnit + Mockito, **no Spring context** — mock the repository, assert
behavior and exceptions. See `spring-boot-testing`.

## Adjacent layers

- Below: `spring-boot-persistence` (entities + repositories).
- Above: `spring-boot-rest-api` exposes these methods over HTTP and maps the
  typed exceptions to responses.
