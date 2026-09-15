package com.demo.annonces.annonce;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AnnonceService {

    private final AnnonceRepository repository;
    private final Clock clock;

    public AnnonceService(AnnonceRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    /** Request is already validated by the controller: fields are non-null here. */
    public AnnonceResponse create(CreateAnnonceRequest request) {
        var annonce = new Annonce(
                Objects.requireNonNull(request.title()).strip(),
                Objects.requireNonNull(request.category()),
                Objects.requireNonNull(request.description()).strip(),
                Objects.requireNonNull(request.price()),
                Objects.requireNonNull(request.city()).strip(),
                Objects.requireNonNull(request.postalCode()),
                Instant.now(clock));
        return AnnonceResponse.from(repository.save(annonce));
    }

    @Transactional(readOnly = true)
    public AnnonceResponse findById(UUID id) {
        return repository.findById(id)
                .map(AnnonceResponse::from)
                .orElseThrow(() -> new AnnonceNotFoundException(id));
    }
}
