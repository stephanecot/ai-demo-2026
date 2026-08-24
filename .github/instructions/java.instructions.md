---
applyTo: "backend/**/*.java"
description: "Java 25 / Spring Boot 4 forbidden patterns (hard constraints) for backend code."
---

# Java 25 / Spring Boot 4 — Rules: what you MUST NOT do

List of forbidden patterns for all backend code in this repo. If one of these
shows up in a diff, it's a bug to fix. The corresponding "do this instead" lives
in `spring-boot-best-practices` and the per-layer skills.

## Injection & beans
- ❌ No **field** injection (`@Autowired` on a field) — use **constructor**
  injection with `final` fields.
- ❌ No `@Autowired` on a single constructor (it's redundant).

## Layers (controller / service / repository)
- ❌ No **business logic in a controller** — it delegates, period.
- ❌ No `repository` access from a controller — go through the service.
- ❌ No hand-written persistence logic in a service that bypasses the repository.
- ❌ No `@Transactional` on a controller or a repository — on **services**.
- ❌ No self-invocation of a `@Transactional` method of the same bean (the proxy
  is bypassed).

## REST boundary & DTOs
- ❌ **No JPA entity exposed** in request/response — use DTO **records**.
- ❌ No single shared DTO for input and output when they differ — separate
  request/response.
- ❌ No entity⇄DTO mapping in the controller — do it in the service / DTO factory.

## Errors
- ❌ No `try/catch` that **swallows** the exception, no `catch (Exception e) {}`.
- ❌ No **stack trace** returned to the client — `ProblemDetail` via a central
  `@RestControllerAdvice`.
- ❌ No error handling scattered endpoint by endpoint.

## Persistence
- ❌ No `FetchType.EAGER` by default on associations.
- ❌ No `spring.jpa.hibernate.ddl-auto=update/create-drop` outside a throwaway
  demo profile — use a versioned schema (Flyway) for real.
- ❌ No public setters everywhere on entities — encapsulate invariants.
- ❌ No string concatenation to build queries (injection) — derived queries or
  parameterized `@Query`.

## HTTP client
- ❌ **No `RestTemplate`** in new code — `RestClient` / `@HttpExchange`.

## Validation
- ❌ No manual validation with `if` checks in the controller — Jakarta Bean
  Validation (`@Valid`, `@NotBlank`, `@Positive`…).

## Configuration & null-safety
- ❌ No configuration in **`.properties`** format — **YAML** (`application.yml`)
  only (see `spring-boot-best-practices`).
- ❌ No scattered `@Value` — use typed `@ConfigurationProperties` (records).
- ❌ No committed secrets — externalized config / environment variables.
- ❌ No ignoring null-safety — annotate with JSpecify (`@NullMarked`,
  `@Nullable`).

## API versioning
- ❌ No hand-rolled new "v2" path — use native REST versioning (`version=`), and
  only on a breaking change.

## Logging & misc
- ❌ No `System.out.println` — use a logger (SLF4J).
- ❌ No shared mutable static state.
- ❌ No second pattern for something already done one way in the repo.

## Tests
- ❌ No feature without a test. No ignored red suite.
- ❌ No `@SpringBootTest` (full context) where a slice (`@WebMvcTest`,
  `@DataMongoTest`) is enough.
- ❌ No test coupled to mock interactions when you can assert state.
