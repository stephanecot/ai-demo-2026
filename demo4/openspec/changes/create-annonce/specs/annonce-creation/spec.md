## ADDED Requirements

### Requirement: Créer une annonce via l'API
Le système SHALL exposer `POST /api/annonces` acceptant un corps JSON
`{ title, category, description, price, city, postalCode }` et retournant l'annonce créée.

#### Scenario: Création réussie
- **WHEN** un client envoie un corps valide (titre 5–80 caractères, catégorie connue, description
  20–4000 caractères, prix entier ≥ 0 en euros, ville non vide, code postal à 5 chiffres)
- **THEN** le système répond `201 Created` avec un en-tête `Location: /api/annonces/{id}`
  et un corps JSON contenant `id`, tous les champs soumis et `createdAt` (ISO-8601, UTC)

#### Scenario: Corps invalide
- **WHEN** un client envoie un corps dont au moins un champ viole une règle de validation
- **THEN** le système répond `400 Bad Request` avec un `ProblemDetail` (`application/problem+json`)
  dont la propriété `errors` liste, pour chaque champ en erreur, `{ field, message }` en français

#### Scenario: Catégorie inconnue
- **WHEN** le champ `category` ne correspond à aucune valeur de l'énumération
  `VEHICULES, IMMOBILIER, MULTIMEDIA, MAISON, LOISIRS, MODE, EMPLOI, SERVICES, AUTRES`
- **THEN** le système répond `400 Bad Request` avec un `ProblemDetail` mentionnant le champ `category`

### Requirement: Relire une annonce
Le système SHALL exposer `GET /api/annonces/{id}` retournant l'annonce identifiée.

#### Scenario: Annonce existante
- **WHEN** un client demande un `id` existant
- **THEN** le système répond `200 OK` avec la même représentation JSON que celle renvoyée à la création

#### Scenario: Annonce inconnue
- **WHEN** un client demande un `id` inexistant
- **THEN** le système répond `404 Not Found` avec un `ProblemDetail`

### Requirement: Persistance de l'annonce
Le système SHALL persister chaque annonce créée avec un identifiant unique généré par le serveur
et une date de création fixée par le serveur (jamais fournie par le client).

#### Scenario: Identifiant et date serveur
- **WHEN** le client fournit `id` ou `createdAt` dans le corps de création
- **THEN** ces valeurs sont ignorées ; le système génère les siennes

### Requirement: Formulaire « Déposer une annonce »
Le frontend SHALL proposer la route `/deposer` avec un formulaire comportant les champs
titre, catégorie (liste déroulante), description, prix (€), ville et code postal,
et un bouton « Déposer mon annonce ».

#### Scenario: Soumission valide
- **WHEN** l'utilisateur remplit tous les champs correctement et soumet
- **THEN** le frontend appelle `POST /api/annonces`, désactive le bouton pendant l'envoi,
  puis affiche un écran de confirmation « Votre annonce est en ligne » reprenant
  titre, prix formaté (`1 250 €`), catégorie et localisation de l'annonce créée

#### Scenario: Validation côté client
- **WHEN** l'utilisateur soumet avec un champ vide ou hors limites
- **THEN** le formulaire n'appelle pas l'API et affiche un message d'erreur en français sous chaque
  champ fautif, le premier champ en erreur reçoit le focus

#### Scenario: Erreur renvoyée par l'API
- **WHEN** l'API répond `400` avec un `ProblemDetail` contenant `errors`
- **THEN** chaque message est affiché sous le champ correspondant

#### Scenario: API indisponible
- **WHEN** l'appel échoue (réseau, `5xx`)
- **THEN** le formulaire reste rempli et affiche un bandeau d'erreur
  « Impossible de déposer l'annonce, réessayez. »

### Requirement: Accessibilité du formulaire
Le formulaire SHALL être utilisable au clavier et par un lecteur d'écran.

#### Scenario: Libellés et erreurs liés aux champs
- **WHEN** un champ est en erreur
- **THEN** il porte `aria-invalid="true"` et `aria-describedby` pointant sur son message d'erreur ;
  chaque champ a un `<label>` associé
