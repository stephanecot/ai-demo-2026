package com.demo.stock.product;

import com.demo.stock.product.dto.CreateProductRequest;
import com.demo.stock.product.dto.ProductResponse;
import com.demo.stock.product.dto.UpdateProductRequest;
import com.demo.stock.product.exception.DuplicateReferenceException;
import com.demo.stock.product.exception.ProductNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Controller tests for {@link ProductController}.
 * Spring Boot 4 has no @WebMvcTest slice — uses the full Spring context with
 * ProductService mocked out via @MockitoBean.
 */
@SpringBootTest
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    WebApplicationContext ctx;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    ProductService service;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(ctx).build();
    }

    // ── GET /api/products ─────────────────────────────────────────────────────

    @Test
    void listProductsReturnsEmptyArray() throws Exception {
        given(service.getAll()).willReturn(List.of());

        mvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void listProductsReturnsTwoProducts() throws Exception {
        given(service.getAll()).willReturn(List.of(
                new ProductResponse("id-1", "SKU-001", "Coffee", null, "beverages", new BigDecimal("12.90"), 50),
                new ProductResponse("id-2", "SKU-002", "Tea", "Earl Grey", "beverages", new BigDecimal("4.50"), 120)
        ));

        mvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].reference", is("SKU-001")))
                .andExpect(jsonPath("$[1].reference", is("SKU-002")));
    }

    // ── GET /api/products/{id} ────────────────────────────────────────────────

    @Test
    void getProductReturnsProduct() throws Exception {
        given(service.getById("id-1")).willReturn(
                new ProductResponse("id-1", "SKU-001", "Coffee", null, "beverages", new BigDecimal("12.90"), 50));

        mvc.perform(get("/api/products/id-1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("id-1")))
                .andExpect(jsonPath("$.reference", is("SKU-001")))
                .andExpect(jsonPath("$.name", is("Coffee")))
                .andExpect(jsonPath("$.quantity", is(50)));
    }

    @Test
    void getProductReturns404WhenNotFound() throws Exception {
        given(service.getById("missing")).willThrow(new ProductNotFoundException("missing"));

        mvc.perform(get("/api/products/missing").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/products ────────────────────────────────────────────────────

    @Test
    void createProductReturns201WithLocation() throws Exception {
        var req = new CreateProductRequest("SKU-NEW", "Widget", null, "tools",
                new BigDecimal("5.00"), 10);
        var response = new ProductResponse("new-id", "SKU-NEW", "Widget", null, "tools",
                new BigDecimal("5.00"), 10);
        given(service.create(any())).willReturn(response);

        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(req)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id", is("new-id")))
                .andExpect(jsonPath("$.reference", is("SKU-NEW")));
    }

    @Test
    void createProductReturns400WhenReferenceBlank() throws Exception {
        var body = """
                {"reference":"","name":"Widget","category":"tools","unitPrice":5.00,"quantity":10}
                """;

        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.reference").exists());
    }

    @Test
    void createProductReturns400WhenNameMissing() throws Exception {
        var body = """
                {"reference":"SKU-X","category":"tools","unitPrice":5.00,"quantity":10}
                """;

        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProductReturns400WhenNegativePrice() throws Exception {
        var body = """
                {"reference":"SKU-X","name":"W","category":"tools","unitPrice":-1.00,"quantity":10}
                """;

        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProductReturns409WhenDuplicateReference() throws Exception {
        given(service.create(any())).willThrow(new DuplicateReferenceException("SKU-DUP"));
        var req = new CreateProductRequest("SKU-DUP", "Widget", null, "tools",
                new BigDecimal("5.00"), 10);

        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(req)))
                .andExpect(status().isConflict());
    }

    // ── PUT /api/products/{id} ────────────────────────────────────────────────

    @Test
    void updateProductReturns200() throws Exception {
        var req = new UpdateProductRequest("Updated Name", null, "electronics",
                new BigDecimal("19.99"), 5);
        var response = new ProductResponse("id-1", "SKU-001", "Updated Name", null,
                "electronics", new BigDecimal("19.99"), 5);
        given(service.update(eq("id-1"), any())).willReturn(response);

        mvc.perform(put("/api/products/id-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.quantity", is(5)));
    }

    @Test
    void updateProductReturns400WhenNameBlank() throws Exception {
        var body = """
                {"name":"","category":"electronics","unitPrice":19.99,"quantity":5}
                """;

        mvc.perform(put("/api/products/id-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void updateProductReturns404WhenNotFound() throws Exception {
        given(service.update(eq("ghost"), any())).willThrow(new ProductNotFoundException("ghost"));
        var req = new UpdateProductRequest("Name", null, "cat",
                BigDecimal.ONE, 0);

        mvc.perform(put("/api/products/ghost")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(req)))
                .andExpect(status().isNotFound());
    }
}
