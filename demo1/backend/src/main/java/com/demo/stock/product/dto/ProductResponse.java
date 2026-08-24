package com.demo.stock.product.dto;

import com.demo.stock.product.Product;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

/**
 * Read-only projection of a {@link Product} sent over the REST boundary.
 * Entities are never exposed directly — this record is the sole REST representation.
 */
public record ProductResponse(
        String id,
        String reference,
        String name,
        @Nullable String description,
        String category,
        BigDecimal unitPrice,
        int quantity
) {
    /**
     * Factory method mapping a {@link Product} document to this response record.
     */
    public static ProductResponse from(Product p) {
        return new ProductResponse(
                p.getId() != null ? p.getId() : "",
                p.getReference(),
                p.getName(),
                p.getDescription(),
                p.getCategory(),
                p.getUnitPrice(),
                p.getQuantity()
        );
    }
}
