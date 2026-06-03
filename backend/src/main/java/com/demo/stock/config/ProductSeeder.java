package com.demo.stock.config;

import com.demo.stock.product.Product;
import com.demo.stock.product.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds sample products on startup when the collection is empty.
 * Active on all profiles except {@code test} to avoid polluting test data.
 */
@Component
@Profile("!test")
public class ProductSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductSeeder.class);

    private final ProductRepository repository;

    public ProductSeeder(ProductRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            log.info("Products collection already populated — skipping seed.");
            return;
        }
        var products = List.of(
                new Product("SKU-001", "Café Arabica 1kg", "Café en grains 100% Arabica", "beverages", new BigDecimal("12.90"), 50),
                new Product("SKU-002", "Thé Earl Grey 100g", "Thé noir parfumé à la bergamote", "beverages", new BigDecimal("4.50"), 120),
                new Product("SKU-003", "Biscuits Digestive 400g", null, "snacks", new BigDecimal("2.30"), 200),
                new Product("SKU-004", "Huile d'olive extra vierge 1L", "Première pression à froid", "condiments", new BigDecimal("8.99"), 75),
                new Product("SKU-005", "Pâtes Spaghetti 500g", null, "pasta", new BigDecimal("1.20"), 300)
        );
        repository.saveAll(products);
        log.info("Seeded {} sample products.", products.size());
    }
}
