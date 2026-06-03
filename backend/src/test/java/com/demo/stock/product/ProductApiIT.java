package com.demo.stock.product;

import com.demo.stock.product.dto.CreateProductRequest;
import com.demo.stock.product.dto.ProductResponse;
import com.demo.stock.product.dto.UpdateProductRequest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full integration test running against embedded MongoDB.
 * Exercises the complete create → read → update round-trip over real HTTP.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ProductApiIT {

    @LocalServerPort
    int port;

    private RestTestClient client() {
        return RestTestClient.bindToServer()
                .baseUrl("http://localhost:" + port)
                .build();
    }

    @Test
    void createReadUpdateRoundTrip() {
        var createReq = new CreateProductRequest(
                "SKU-IT-RT-" + System.nanoTime(), "Integration Widget", "A test widget",
                "test-tools", new BigDecimal("9.99"), 25);

        // ── CREATE ────────────────────────────────────────────────────────────
        var created = client().post().uri("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .body(createReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(ProductResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(created).isNotNull();
        assertThat(created.id()).isNotBlank();
        assertThat(created.name()).isEqualTo("Integration Widget");
        assertThat(created.quantity()).isEqualTo(25);

        // ── READ ──────────────────────────────────────────────────────────────
        var fetched = client().get().uri("/api/products/" + created.id())
                .exchange()
                .expectStatus().isOk()
                .expectBody(ProductResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(fetched).isNotNull();
        assertThat(fetched.id()).isEqualTo(created.id());

        // ── UPDATE ────────────────────────────────────────────────────────────
        var updateReq = new UpdateProductRequest(
                "Updated Widget", "Updated description",
                "test-tools-v2", new BigDecimal("14.99"), 50);

        var updated = client().put().uri("/api/products/" + created.id())
                .contentType(MediaType.APPLICATION_JSON)
                .body(updateReq)
                .exchange()
                .expectStatus().isOk()
                .expectBody(ProductResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(updated).isNotNull();
        assertThat(updated.name()).isEqualTo("Updated Widget");
        assertThat(updated.quantity()).isEqualTo(50);
        assertThat(updated.unitPrice()).isEqualByComparingTo("14.99");
        // reference must remain unchanged (immutable in v1)
        assertThat(updated.reference()).isEqualTo(created.reference());
    }

    @Test
    void returns404ForUnknownId() {
        client().get().uri("/api/products/nonexistent-id")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void returns409ForDuplicateReference() {
        var ref = "SKU-IT-DUP-" + System.nanoTime();
        var req = new CreateProductRequest(ref, "Duplicate", null,
                "cat", BigDecimal.ONE, 1);

        client().post().uri("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .exchange()
                .expectStatus().isCreated();

        client().post().uri("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .exchange()
                .expectStatus().isEqualTo(409);
    }
}
