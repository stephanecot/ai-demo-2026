package com.demo.stock.product;

import com.demo.stock.product.dto.CreateProductRequest;
import com.demo.stock.product.dto.UpdateProductRequest;
import com.demo.stock.product.exception.DuplicateReferenceException;
import com.demo.stock.product.exception.ProductNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link ProductService} — plain JUnit + Mockito, no Spring context.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    ProductRepository repository;

    @InjectMocks
    ProductService service;

    // ── getAll ────────────────────────────────────────────────────────────────

    @Test
    void getAllReturnsAllProductsAsDtos() {
        given(repository.findAll()).willReturn(List.of(
                product("id-1", "SKU-001", "Coffee"),
                product("id-2", "SKU-002", "Tea")));

        var results = service.getAll();

        assertThat(results).hasSize(2);
        assertThat(results).extracting("reference").containsExactly("SKU-001", "SKU-002");
    }

    @Test
    void getAllReturnsEmptyListWhenNoProducts() {
        given(repository.findAll()).willReturn(List.of());

        assertThat(service.getAll()).isEmpty();
    }

    // ── getById ───────────────────────────────────────────────────────────────

    @Test
    void getByIdReturnsProductDto() {
        given(repository.findById("id-1")).willReturn(Optional.of(product("id-1", "SKU-001", "Coffee")));

        var result = service.getById("id-1");

        assertThat(result.id()).isEqualTo("id-1");
        assertThat(result.name()).isEqualTo("Coffee");
    }

    @Test
    void getByIdThrowsNotFoundWhenMissing() {
        given(repository.findById("missing")).willReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById("missing"))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("missing");
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void createSavesAndReturnsDto() {
        var req = new CreateProductRequest("SKU-NEW", "New Product", null,
                "electronics", new BigDecimal("19.99"), 5);
        given(repository.existsByReference("SKU-NEW")).willReturn(false);
        given(repository.save(any())).willAnswer(inv -> {
            Product p = inv.getArgument(0);
            setId(p, "new-id");
            return p;
        });

        var result = service.create(req);

        assertThat(result.id()).isEqualTo("new-id");
        assertThat(result.reference()).isEqualTo("SKU-NEW");
        assertThat(result.name()).isEqualTo("New Product");
    }

    @Test
    void createThrowsDuplicateReferenceWhenReferenceExists() {
        given(repository.existsByReference("SKU-DUP")).willReturn(true);
        var req = new CreateProductRequest("SKU-DUP", "Duplicate", null,
                "misc", new BigDecimal("1.00"), 1);

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(DuplicateReferenceException.class)
                .hasMessageContaining("SKU-DUP");

        verify(repository, never()).save(any());
    }

    @Test
    void createPassesAllFieldsToRepository() {
        var req = new CreateProductRequest("SKU-X", "Widget", "A nice widget",
                "tools", new BigDecimal("5.50"), 20);
        given(repository.existsByReference("SKU-X")).willReturn(false);
        given(repository.save(any())).willAnswer(inv -> {
            Product p = inv.getArgument(0);
            setId(p, "x-id");
            return p;
        });

        service.create(req);

        var captor = ArgumentCaptor.forClass(Product.class);
        verify(repository).save(captor.capture());
        var saved = captor.getValue();
        assertThat(saved.getReference()).isEqualTo("SKU-X");
        assertThat(saved.getName()).isEqualTo("Widget");
        assertThat(saved.getDescription()).isEqualTo("A nice widget");
        assertThat(saved.getCategory()).isEqualTo("tools");
        assertThat(saved.getUnitPrice()).isEqualByComparingTo("5.50");
        assertThat(saved.getQuantity()).isEqualTo(20);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void updateAppliesChangesAndReturnsDto() {
        var existing = product("id-1", "SKU-001", "Old Name");
        given(repository.findById("id-1")).willReturn(Optional.of(existing));
        given(repository.save(any())).willAnswer(inv -> inv.getArgument(0));

        var req = new UpdateProductRequest("New Name", "Desc", "category",
                new BigDecimal("9.99"), 30);
        var result = service.update("id-1", req);

        assertThat(result.name()).isEqualTo("New Name");
        assertThat(result.description()).isEqualTo("Desc");
        assertThat(result.quantity()).isEqualTo(30);
    }

    @Test
    void updateThrowsNotFoundWhenMissing() {
        given(repository.findById("ghost")).willReturn(Optional.empty());
        var req = new UpdateProductRequest("Name", null, "cat",
                BigDecimal.ONE, 0);

        assertThatThrownBy(() -> service.update("ghost", req))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("ghost");

        verify(repository, never()).save(any());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Product product(String id, String reference, String name) {
        var p = new Product(reference, name, null, "cat", new BigDecimal("1.00"), 1);
        setId(p, id);
        return p;
    }

    /** Use reflection to set the private id field (normally set by Mongo). */
    private void setId(Product product, String id) {
        try {
            var field = Product.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(product, id);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }
}
