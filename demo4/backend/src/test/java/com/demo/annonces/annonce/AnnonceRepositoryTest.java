package com.demo.annonces.annonce;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

@DataJpaTest
class AnnonceRepositoryTest {

    @Autowired
    private AnnonceRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void savesAndReadsBackAnAnnonce() {
        Instant createdAt = Instant.parse("2026-09-15T10:00:00Z");
        Annonce saved = repository.save(new Annonce(
                "Vélo de course", Category.LOISIRS, "Vélo de course en très bon état, peu servi.",
                350, "Lyon", "69003", createdAt));
        entityManager.flush();
        entityManager.clear();

        assertThat(saved.getId()).isNotNull();
        assertThat(repository.findById(saved.getId())).hasValueSatisfying(annonce -> {
            assertThat(annonce.getTitle()).isEqualTo("Vélo de course");
            assertThat(annonce.getCategory()).isEqualTo(Category.LOISIRS);
            assertThat(annonce.getDescription()).isEqualTo("Vélo de course en très bon état, peu servi.");
            assertThat(annonce.getPrice()).isEqualTo(350);
            assertThat(annonce.getCity()).isEqualTo("Lyon");
            assertThat(annonce.getPostalCode()).isEqualTo("69003");
            assertThat(annonce.getCreatedAt()).isEqualTo(createdAt);
        });
    }
}
