package com.demo.annonces.annonce;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record AnnonceResponse(
        UUID id,
        String title,
        Category category,
        String description,
        int price,
        String city,
        String postalCode,
        Instant createdAt
) {
    static AnnonceResponse from(Annonce annonce) {
        return new AnnonceResponse(
                Objects.requireNonNull(annonce.getId(), "id must be set once persisted"),
                annonce.getTitle(),
                annonce.getCategory(),
                annonce.getDescription(),
                annonce.getPrice(),
                annonce.getCity(),
                annonce.getPostalCode(),
                annonce.getCreatedAt());
    }
}
