package com.demo.stock.product;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests using an embedded MongoDB provided by flapdoodle.
 * Uses a full Spring Boot context (Spring Boot 4 no longer ships @DataMongoTest).
 */
@SpringBootTest
@ActiveProfiles("test")
class ProductRepositoryTest {

    @Autowired
    ProductRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void savesAndFindsById() {
        var saved = repository.save(product("SKU-R01", "Widget"));

        var found = repository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Widget");
    }

    @Test
    void findsByReference() {
        repository.save(product("SKU-R02", "Gadget"));

        var found = repository.findByReference("SKU-R02");

        assertThat(found).isPresent();
        assertThat(found.get().getReference()).isEqualTo("SKU-R02");
    }

    @Test
    void returnsEmptyWhenReferenceNotFound() {
        var found = repository.findByReference("UNKNOWN");

        assertThat(found).isEmpty();
    }

    @Test
    void existsByReferenceReturnsTrueWhenPresent() {
        repository.save(product("SKU-R03", "Thing"));

        assertThat(repository.existsByReference("SKU-R03")).isTrue();
    }

    @Test
    void existsByReferenceReturnsFalseWhenAbsent() {
        assertThat(repository.existsByReference("SKU-MISSING")).isFalse();
    }

    @Test
    void findsAllProducts() {
        repository.save(product("SKU-R04", "Alpha"));
        repository.save(product("SKU-R05", "Beta"));

        assertThat(repository.findAll()).hasSize(2);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Product product(String reference, String name) {
        return new Product(reference, name, null, "test-category",
                new BigDecimal("9.99"), 10);
    }
}
