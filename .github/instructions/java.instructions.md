---
applyTo: "backend/**/*.java"
description: "Java 25 / Spring Boot 4 forbidden patterns (hard constraints) for backend code."
---

# Java 25 / Spring Boot 4 — Règles : ce qu'il NE FAUT PAS faire

Liste des interdits pour tout code backend de ce repo. Si une de ces choses
apparaît dans un diff, c'est un bug à corriger. Le « à faire » correspondant est
dans `spring-boot-best-practices` et les skills par couche.

## Injection & beans
- ❌ Pas d'injection par **champ** (`@Autowired` sur un field) — injection par
  **constructeur** avec champs `final`.
- ❌ Pas de `@Autowired` sur un constructeur unique (inutile).

## Couches (controller / service / repository)
- ❌ Pas de **logique métier dans un controller** — il délègue, point.
- ❌ Pas d'accès `repository` depuis un controller — passer par le service.
- ❌ Pas de logique de persistance écrite à la main dans un service en
  contournant le repository.
- ❌ Pas de `@Transactional` sur un controller ou un repository — sur les
  **services**.
- ❌ Pas d'auto-invocation d'une méthode `@Transactional` du même bean (le proxy
  est contourné).

## Frontière REST & DTO
- ❌ **Pas d'entité JPA exposée** en requête/réponse — utiliser des **records** DTO.
- ❌ Pas de DTO unique partagé pour l'entrée et la sortie quand ils diffèrent —
  séparer request/response.
- ❌ Pas de mapping entity⇄DTO dans le controller — dans le service / factory DTO.

## Erreurs
- ❌ Pas de `try/catch` qui **avale** l'exception, pas de `catch (Exception e) {}`.
- ❌ Pas de **stack trace** renvoyée au client — `ProblemDetail` via un
  `@RestControllerAdvice` central.
- ❌ Pas de gestion d'erreur dispersée endpoint par endpoint.

## Persistance
- ❌ Pas de `FetchType.EAGER` par défaut sur les associations.
- ❌ Pas de `spring.jpa.hibernate.ddl-auto=update/create-drop` hors profil démo
  jetable — schéma versionné (Flyway) en vrai.
- ❌ Pas de setters publics partout sur les entités — encapsuler les invariants.
- ❌ Pas de concaténation de chaînes pour construire des requêtes (injection) —
  requêtes dérivées ou `@Query` paramétrées.

## HTTP client
- ❌ **Pas de `RestTemplate`** dans du code neuf — `RestClient` / `@HttpExchange`.

## Validation
- ❌ Pas de validation manuelle à coups de `if` dans le controller — Jakarta Bean
  Validation (`@Valid`, `@NotBlank`, `@Positive`…).

## Configuration & null-safety
- ❌ Pas de configuration au format **`.properties`** — **YAML** (`application.yml`)
  uniquement (voir `spring-boot-best-practices`).
- ❌ Pas de `@Value` éparpillés — `@ConfigurationProperties` typés (records).
- ❌ Pas de secrets commités — config externalisée / variables d'environnement.
- ❌ Pas d'ignorance de la null-safety — annoter avec JSpecify (`@NullMarked`,
  `@Nullable`).

## API versioning
- ❌ Pas de nouveau path « v2 » bricolé — versioning REST natif (`version=`), et
  seulement sur changement incompatible.

## Logging & divers
- ❌ Pas de `System.out.println` — un logger (SLF4J).
- ❌ Pas d'état statique mutable partagé.
- ❌ Pas de second pattern pour une chose déjà faite d'une façon dans le repo.

## Tests
- ❌ Pas de feature sans test. Pas de suite rouge ignorée.
- ❌ Pas de `@SpringBootTest` (contexte complet) là où une slice (`@WebMvcTest`,
  `@DataMongoTest`) suffit.
- ❌ Pas de test couplé aux interactions de mocks quand on peut asserter l'état.
