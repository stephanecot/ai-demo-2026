## Context

Premier changement du projet : les deux applications sont des squelettes vides (contexte Spring
chargé, page Vite par défaut). Ce changement pose à la fois la feature « créer une annonce » et
les fondations techniques (gestion d'erreurs, client API, design tokens) que les changements
suivants réutiliseront. Aucune contrainte de compatibilité : pas d'API ni de schéma existants.

## Goals / Non-Goals

**Goals:**
- Un parcours de bout en bout : formulaire React → `POST /api/annonces` → base H2 → confirmation.
- Un contrat d'erreur unique (`ProblemDetail` + `errors[]`) exploité tel quel par le frontend.
- Un socle visuel fidèle à leboncoin.fr, entièrement en CSS natif (tokens), sans framework UI.

**Non-Goals:**
- Liste / détail public des annonces, photos, authentification (cf. proposal).
- Migrations de schéma (Flyway/Liquibase) : `ddl-auto: update` suffit pour la démo.

## Decisions

1. **Modèle `Annonce` en JPA + H2 fichier** plutôt que MongoDB (utilisé en demo1).
   Le domaine est relationnel et simple ; H2 en fichier (`./data/`) donne une persistance
   entre redémarrages sans service externe, et H2 mémoire en test évite Testcontainers.
   Alternative écartée : PostgreSQL via Docker — plus lourd pour une démo.

2. **Catégorie = `enum Category` Java** (9 valeurs, cf. spec) exposée en chaîne dans l'API.
   Alternative écartée : table `category` référentielle — inutile tant que la liste est figée.

3. **Prix en `Integer` euros entiers** (`price`, ≥ 0). leboncoin n'affiche pas de centimes ;
   évite `BigDecimal` dans le JSON et le formulaire. `null` interdit (un don = `0`).

4. **DTOs en records** : `CreateAnnonceRequest` (validation Jakarta, messages en français dans
   les annotations) et `AnnonceResponse`. L'entité n'est jamais sérialisée.
   Mapping manuel dans le service (pas de MapStruct pour deux records).

5. **Erreurs** : un seul `GlobalExceptionHandler` (`@RestControllerAdvice`) qui convertit
   `MethodArgumentNotValidException` → `ProblemDetail` 400 avec propriété `errors: [{field, message}]`,
   `HttpMessageNotReadableException` (enum inconnu) → 400 avec `errors[{field:"category"}]`,
   et `AnnonceNotFoundException` → 404. Le frontend parse `errors` pour l'affichage inline.

6. **Frontend sans lib de formulaire** : `useState` + fonction `validateAnnonce()` pure
   (testable unitairement) qui reproduit les règles backend. Les règles vivent dans
   `src/features/annonces/validation.ts` — une seule source côté front.
   Alternative écartée : react-hook-form + zod — deux dépendances pour six champs.

7. **Client API** : `src/api/http.ts` (wrapper `fetch` qui lève `ApiError` avec le `ProblemDetail`
   parsé) + `src/api/annonces.ts` (`createAnnonce`, `getAnnonce`). Le proxy Vite route `/api` vers
   `:8080`, donc pas de CORS en dev.

8. **Styles** : CSS Modules (`*.module.css`) + `tokens.css` global. Fidélité leboncoin :
   fond `#F5F5F5`, cartes blanches `radius 8px`, orange `#FF6E14`, boutons pill, en-tête blanc
   à ombre légère. Les composants partagés (`Button`, `TextField`, `TextArea`, `Select`, `Card`)
   sont les seuls à contenir des styles de contrôle.

9. **Routing** : `react-router` (data router `createBrowserRouter`) avec `/` (page d'accueil
   placeholder « Bientôt : les annonces ») et `/deposer`. La confirmation est un état de la page
   `/deposer` (pas de route dédiée) pour rester dans le périmètre.

## Risks / Trade-offs

- [Divergence des règles de validation front/back] → un test backend et un test front partagent
  les mêmes cas limites (5/80, 20/4000, code postal `^\d{5}$`) ; la source de vérité reste l'API.
- [H2 fichier commité par erreur] → `backend/.gitignore` exclut `data/`.
- [Marque « leboncoin » reproduite] → usage strictement démo interne ; logo textuel, aucun asset
  copié du site.
- [Java 26 par défaut sur le poste, Spring Boot 4.0.6 validé jusqu'à Java 25] → documenter
  `JAVA_HOME` dans CLAUDE.md.

## Open Questions

- Faut-il un champ « type d'annonce » (offre / demande) comme sur leboncoin ? Reporté : ajout
  trivial plus tard (enum + select).
