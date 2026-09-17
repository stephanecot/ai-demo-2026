package com.demo.annonces.annonce;

import java.util.UUID;

public class AnnonceNotFoundException extends RuntimeException {

    public AnnonceNotFoundException(UUID id) {
        super("Annonce introuvable : " + id);
    }
}
