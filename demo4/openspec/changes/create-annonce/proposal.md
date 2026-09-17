## Why

L'application de petites annonces n'a aujourd'hui aucune fonctionnalité métier : c'est un squelette
Spring Boot + React vide. La première brique indispensable est le dépôt d'une annonce par un
utilisateur — sans annonces, rien d'autre (liste, recherche, détail) n'a de sens. C'est aussi la
feature qui fixe le modèle de données `Annonce` et le vocabulaire visuel (design leboncoin)
sur lesquels toutes les suivantes s'appuieront.

## What Changes

- Nouveau modèle de domaine `Annonce` (titre, catégorie, description, prix, localisation,
  date de création) persisté en base via Spring Data JPA.
- Nouvel endpoint REST `POST /api/annonces` qui valide et crée une annonce, et
  `GET /api/annonces/{id}` pour relire l'annonce créée (nécessaire à l'écran de confirmation).
- Gestion uniforme des erreurs de validation en `ProblemDetail` (RFC 9457) via un
  `@RestControllerAdvice` unique — pattern réutilisé par toutes les features suivantes.
- Nouvelle page frontend « Déposer une annonce » (`/deposer`) reproduisant le parcours
  et le design de leboncoin.fr : en-tête orange avec bouton « Déposer une annonce », formulaire
  en carte blanche sur fond gris clair, erreurs inline sous chaque champ, écran de confirmation.
- Mise en place du socle frontend partagé : design tokens (couleurs, espacements, typo),
  en-tête, client API typé, routeur.

## Capabilities

### New Capabilities
- `annonce-creation`: création d'une annonce — règles de validation, persistance, contrat API
  `POST /api/annonces` / `GET /api/annonces/{id}` et parcours utilisateur du formulaire de dépôt.
- `leboncoin-design-system`: charte visuelle commune (tokens, en-tête, boutons, champs de
  formulaire, cartes) calquée sur leboncoin.fr, réutilisable par toutes les pages.

### Modified Capabilities
<!-- aucune : premier changement du projet -->

## Impact

- **Backend** : nouveau package `com.demo.annonces.annonce` (entité, repository, service,
  controller, DTOs) + `com.demo.annonces.common` (gestion d'erreurs). Schéma H2 créé
  automatiquement (`ddl-auto`), pas de migration.
- **Frontend** : nouveaux modules `src/features/annonces/`, `src/shared/ui/`, `src/api/`,
  `src/styles/tokens.css` ; ajout de `react-router` (déjà installé).
- **Aucune dépendance externe supplémentaire** ; pas d'authentification (l'annonce est anonyme
  dans cette version).

## Non-objectifs

- Liste, recherche, filtre et pagination des annonces.
- Upload de photos (prévu dans un changement ultérieur ; le modèle réserve la place).
- Comptes utilisateurs, authentification, modération.
- Modification / suppression d'une annonce.
