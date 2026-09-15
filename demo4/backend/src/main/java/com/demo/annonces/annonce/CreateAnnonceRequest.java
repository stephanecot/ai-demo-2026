package com.demo.annonces.annonce;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

/** Body of POST /api/annonces. Validation messages are shown as-is by the frontend. */
public record CreateAnnonceRequest(
        @NotBlank(message = "Le titre est obligatoire")
        @Size(min = 5, max = 80, message = "Le titre doit contenir entre 5 et 80 caractères")
        @Nullable String title,

        @NotNull(message = "La catégorie est obligatoire")
        @Nullable Category category,

        @NotBlank(message = "La description est obligatoire")
        @Size(min = 20, max = 4000, message = "La description doit contenir entre 20 et 4000 caractères")
        @Nullable String description,

        @NotNull(message = "Le prix est obligatoire")
        @Min(value = 0, message = "Le prix doit être supérieur ou égal à 0")
        @Nullable Integer price,

        @NotBlank(message = "La ville est obligatoire")
        @Size(max = 100, message = "La ville doit contenir au plus 100 caractères")
        @Nullable String city,

        @NotBlank(message = "Le code postal est obligatoire")
        @Pattern(regexp = "\\d{5}", message = "Le code postal doit contenir 5 chiffres")
        @Nullable String postalCode
) {
}
