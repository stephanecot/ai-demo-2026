package com.demo.stock.product;

import org.jspecify.annotations.Nullable;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

/**
 * Aggregate root for a stock product, stored in the {@code products} MongoDB collection.
 * Encapsulates all mutable state via explicit mutator methods — no public blanket setters.
 */
@Document(collection = "products")
public class Product {

    @Id
    private @Nullable String id;

    @Indexed(unique = true)
    private String reference;

    private String name;

    private @Nullable String description;

    private String category;

    private BigDecimal unitPrice;

    private int quantity;

    /** Required by Spring Data — framework use only. */
    protected Product() {
        this.reference = "";
        this.name = "";
        this.category = "";
        this.unitPrice = BigDecimal.ZERO;
    }

    public Product(String reference, String name, @Nullable String description,
                   String category, BigDecimal unitPrice, int quantity) {
        this.reference = reference;
        this.name = name;
        this.description = description;
        this.category = category;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public @Nullable String getId() { return id; }
    public String getReference()    { return reference; }
    public String getName()         { return name; }
    public @Nullable String getDescription() { return description; }
    public String getCategory()     { return category; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public int getQuantity()        { return quantity; }

    // ── Mutators (for update use-case) ────────────────────────────────────────

    public void updateName(String name)                     { this.name = name; }
    public void updateDescription(@Nullable String desc)    { this.description = desc; }
    public void updateCategory(String category)             { this.category = category; }
    public void updateUnitPrice(BigDecimal unitPrice)       { this.unitPrice = unitPrice; }
    public void updateQuantity(int quantity)                { this.quantity = quantity; }
}
