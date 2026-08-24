package com.demo.stock.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

/**
 * Request payload for creating a new product.
 */
public record CreateProductRequest(

        @NotBlank
        @Size(max = 64)
        String reference,

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
