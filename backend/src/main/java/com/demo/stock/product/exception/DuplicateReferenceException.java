package com.demo.stock.product.exception;

/**
 * Thrown when a product with the same reference already exists.
 * Mapped to HTTP 409 by {@link com.demo.stock.common.ApiExceptionHandler}.
 */
public class DuplicateReferenceException extends RuntimeException {

    public DuplicateReferenceException(String reference) {
        super("A product with reference '" + reference + "' already exists");
    }
}
