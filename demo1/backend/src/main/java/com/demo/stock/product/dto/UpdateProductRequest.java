package com.demo.stock.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

/**
 * Request payload for updating an existing product.
 * {@code reference} is intentionally omitted — it is immutable in v1.
 */
public record UpdateProductRequest(

        @NotBlank
        @Size(max = 120)
        String name,

        @Nullable
        @Size(max = 2000)
        String description,

        @NotBlank
        @Size(max = 60)
        String category,

        @NotNull
        @PositiveOrZero
        BigDecimal unitPrice,

        @PositiveOrZero
        int quantity
) {}
