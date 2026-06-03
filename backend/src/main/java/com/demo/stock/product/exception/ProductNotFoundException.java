package com.demo.stock.product.exception;

/**
 * Thrown when a product cannot be found by its id.
 * Mapped to HTTP 404 by {@link com.demo.stock.common.ApiExceptionHandler}.
 */
public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(String id) {
        super("Product not found: " + id);
    }
}
