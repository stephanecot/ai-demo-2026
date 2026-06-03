package com.demo.stock.product;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for {@link Product}.
 * Persistence only — no business logic.
 */
public interface ProductRepository extends MongoRepository<Product, String> {

    Optional<Product> findByReference(String reference);

    boolean existsByReference(String reference);
}
