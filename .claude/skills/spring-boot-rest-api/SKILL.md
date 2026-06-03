---
name: spring-boot-rest-api
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  The web/REST layer for the Spring Boot 4 backend in this repo — thin
  @RestController endpoints, record request/response DTOs with Jakarta
  validation, HTTP status/ResponseEntity conventions, centralized ProblemDetail
  error handling (@RestControllerAdvice), and native API versioning. Use when
  adding or changing HTTP endpoints. This is layer 3 of the new-resource flow:
  persistence (`spring-boot-persistence`) → service (`spring-boot-service-layer`)
  → REST.
---

# REST API layer (controllers + DTOs + errors)

The top layer. It maps HTTP ⇄ DTO, validates input, calls the service, and
returns correct status codes. **No business logic, no JPA, no entities** here.
Worked example: the `Product` resource under `/api/products`.

## DTOs (`dto/`) — records + validation

- Request and response are separate `record`s. Never accept or return entities.
- Validate requests with Jakarta Bean Validation annotations.

```java
public record CreateProductRequest(
    @NotBlank String sku,
    @NotBlank String name,
    @PositiveOrZero int quantity) {}

public record ProductResponse(Long id, String sku, String name, int quantity) {
    public static ProductResponse from(Product p) {
        return new ProductResponse(p.getId(), p.getSku(), p.getName(), p.getQuantity());
    }
}
```

## Controllers (`controller/`) — thin web edge

- `@RestController` + `@RequestMapping("/api/...")`. Delegate to the service in
  one line; no logic.
- Correct status codes: 200 read, **201 + `Location`** on create, 204 on delete.
- `@Valid` on request bodies triggers validation.

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest req) {
        var created = service.create(req);
        var location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }
}
```

## Error handling → ProblemDetail (RFC 9457)

- One shared `@RestControllerAdvice`. **Never** try/catch in controllers.
- Map each typed domain exception (thrown by the service) to a status +
  `ProblemDetail`. Don't leak stack traces.

```java
@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    ProblemDetail handleNotFound(ProductNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DuplicateSkuException.class)
    ProblemDetail handleDuplicate(DuplicateSkuException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }
}
```

`@Valid` failures (`MethodArgumentNotValidException`) are turned into 400
ProblemDetail by Spring — add a handler to enrich the body with per-field errors
if the frontend needs them (it does; see `angular-http-integration` if present).

## API versioning (only on breaking changes)

Spring Framework 7 has native REST versioning. Configure the strategy once
(header/path/param via `ApiVersionConfigurer`), then version the mapping rather
than inventing a new path. Keep the old version until clients migrate.

```java
@GetMapping(path = "/{id}", version = "1.1")
public ProductResponseV2 getV2(@PathVariable Long id) { ... }
```

## Testing

`@WebMvcTest` slice with `MockMvcTester`, service mocked via `@MockitoBean`:
assert status, JSON shape, validation (400), and error mappings (404/409). See
`spring-boot-testing`.

## Checklist for a new endpoint

- [ ] Request/response **records** with validation
- [ ] Controller is thin, delegates to the service, correct status + Location
- [ ] Typed exceptions mapped to ProblemDetail in the shared advice
- [ ] `@WebMvcTest` covering happy path + validation + error cases (green)
- [ ] New/changed JSON shape communicated to `angular-dev`

## Layers below

This layer is only the edge. The behavior lives in
`spring-boot-service-layer`, backed by `spring-boot-persistence`.
