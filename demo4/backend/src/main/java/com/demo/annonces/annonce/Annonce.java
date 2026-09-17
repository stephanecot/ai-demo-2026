package com.demo.annonces.annonce;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "annonce")
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private @Nullable UUID id;

    @Column(nullable = false, length = 80)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false)
    private int price;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "postal_code", nullable = false, length = 5)
    private String postalCode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** JPA only. */
    @SuppressWarnings("NullAway.Init")
    protected Annonce() {
    }

    public Annonce(String title, Category category, String description, int price,
                   String city, String postalCode, Instant createdAt) {
        this.title = title;
        this.category = category;
        this.description = description;
        this.price = price;
        this.city = city;
        this.postalCode = postalCode;
        this.createdAt = createdAt;
    }

    public @Nullable UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Category getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public int getPrice() {
        return price;
    }

    public String getCity() {
        return city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
