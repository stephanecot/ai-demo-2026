package com.demo.stock.product;

import com.demo.stock.product.dto.CreateProductRequest;
import com.demo.stock.product.dto.ProductResponse;
import com.demo.stock.product.dto.UpdateProductRequest;
import com.demo.stock.product.exception.DuplicateReferenceException;
import com.demo.stock.product.exception.ProductNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for product management.
 * All public methods are a use-case; they return DTOs, never domain entities.
 */
@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    /** Returns all products as response DTOs. */
    @Transactional(readOnly = true)
    public List<ProductResponse> getAll() {
        return repository.findAll().stream()
                .map(ProductResponse::from)
                .toList();
    }

    /**
     * Returns the product with the given technical id.
     *
     * @throws ProductNotFoundException when no product has that id
     */
    @Transactional(readOnly = true)
    public ProductResponse getById(String id) {
        return repository.findById(id)
                .map(ProductResponse::from)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    /**
     * Creates a new product.
     *
     * @throws DuplicateReferenceException when a product with the same reference already exists
     */
    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        if (repository.existsByReference(req.reference())) {
            throw new DuplicateReferenceException(req.reference());
        }
        var product = new Product(
                req.reference(),
                req.name(),
                req.description(),
                req.category(),
                req.unitPrice(),
                req.quantity()
        );
        return ProductResponse.from(repository.save(product));
    }

    /**
     * Updates an existing product's mutable fields.
     * The {@code reference} field is immutable in v1.
     *
     * @throws ProductNotFoundException when no product has that id
     */
    @Transactional
    public ProductResponse update(String id, UpdateProductRequest req) {
        var product = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.updateName(req.name());
        product.updateDescription(req.description());
        product.updateCategory(req.category());
        product.updateUnitPrice(req.unitPrice());
        product.updateQuantity(req.quantity());
        return ProductResponse.from(repository.save(product));
    }
}
