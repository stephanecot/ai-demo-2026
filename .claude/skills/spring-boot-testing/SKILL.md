---
name: spring-boot-testing
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  How to write tests for the Spring Boot 4 backend in this repo — the testing
  pyramid (plain unit, @WebMvcTest + MockMvc, @DataJpaTest, RestTestClient,
  @SpringBootTest + Testcontainers), JUnit 5 + AssertJ + Mockito conventions,
  and what to assert. Use when adding or fixing backend tests.
---

# Writing Spring Boot 4 tests

Stack: **JUnit 5 (Jupiter) + AssertJ + Mockito**, plus Spring Boot test slices.
Aim for a pyramid: many fast unit tests, fewer slice tests, a thin layer of full
integration tests.

## Choose the right test type

| Goal | Use |
|------|-----|
| Business logic in a service | plain JUnit + Mockito (no Spring context) |
| Controller: routing, status, JSON, validation | `@WebMvcTest` + `MockMvcTester` |
| Repository / JPA queries | `@DataJpaTest` |
| Full HTTP round-trip | `@SpringBootTest(webEnvironment=RANDOM_PORT)` + `RestTestClient` |
| Real DB behavior | `@SpringBootTest` + **Testcontainers** |

Naming: `ClassNameTest` for unit/slice, `ClassNameIT` for integration. Method
names describe behavior, e.g. `returns404WhenProductMissing`.

## 1. Service unit test (no Spring)

Fast. Mock collaborators with Mockito; assert with AssertJ.

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {
    @Mock ProductRepository repository;
    @InjectMocks ProductService service;

    @Test
    void throwsWhenProductMissing() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(1L))
            .isInstanceOf(ProductNotFoundException.class);
    }

    @Test
    void decrementsStockOnSale() {
        var product = new Product("SKU-1", "Widget", 10);
        when(repository.findById(1L)).thenReturn(Optional.of(product));

        service.recordSale(1L, 3);

        assertThat(product.getQuantity()).isEqualTo(7);
    }
}
```

## 2. Controller slice — `@WebMvcTest`

Loads only the web layer; mock the service with `@MockitoBean`.

```java
@WebMvcTest(ProductController.class)
class ProductControllerTest {
    @Autowired MockMvcTester mvc;
    @MockitoBean ProductService service;

    @Test
    void getReturnsProduct() {
        when(service.getById(1L)).thenReturn(new ProductResponse(1L, "SKU-1", "Widget", 10));

        assertThat(mvc.get().uri("/api/products/1"))
            .hasStatusOk()
            .bodyJson().extractingPath("$.sku").isEqualTo("SKU-1");
    }

    @Test
    void rejectsInvalidBody() {
        assertThat(mvc.post().uri("/api/products").contentType(APPLICATION_JSON)
                .content("{\"name\":\"\"}"))
            .hasStatus(HttpStatus.BAD_REQUEST);
    }
}
```

## 3. Repository slice — `@DataJpaTest`

In-memory or Testcontainers DB, rolled back per test.

```java
@DataJpaTest
class ProductRepositoryTest {
    @Autowired ProductRepository repository;

    @Test
    void findsLowStock() {
        repository.save(new Product("A", "Low", 2));
        repository.save(new Product("B", "Ok", 50));

        assertThat(repository.findByQuantityLessThan(5))
            .extracting(Product::getSku).containsExactly("A");
    }
}
```

## 4. Full integration — `RestTestClient` + Testcontainers

Use for true end-to-end confidence against a real database.

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class ProductApiIT {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");

    @Autowired RestTestClient client;

    @Test
    void createsThenReadsProduct() {
        var created = client.post().uri("/api/products")
            .body(new CreateProduct("SKU-9", "New", 5))
            .exchange().expectStatus().isCreated()
            .expectBody(ProductResponse.class).returnResult().getResponseBody();

        client.get().uri("/api/products/{id}", created.id())
            .exchange().expectStatus().isOk();
    }
}
```

## Principles

- **Test behavior, not implementation.** Assert outputs/state, not that a mock
  was called a certain way (use `verify` only for true side effects).
- One logical assertion per test; cover the happy path **and** the error/edge
  cases (missing, invalid, boundary quantities).
- Keep tests deterministic and independent — no shared mutable state, no order
  dependence. Use `@Transactional`/rollback or fresh containers.
- Prefer the narrowest slice that proves the behavior; reserve `@SpringBootTest`
  for genuine integration.
- Run `./mvnw test` and report the real result. Don't mark work done on a red
  suite.
