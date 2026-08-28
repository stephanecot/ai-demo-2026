# US-003 — Créer une mission

**Prérequis** : US-002 — le rôle de l'utilisateur courant doit être connu.

## User Story

**En tant que** manager,
**je veux** créer une mission pour un client,
**afin que** les consultants puissent ensuite y imputer leur activité.

## Critères d'acceptation

- [ ] Un formulaire permet de saisir : nom, client, date de début, date de fin (facultative), description (facultative).
- [ ] Le nom, le client et la date de début sont obligatoires ; un message en français signale chaque champ manquant.
- [ ] À la création, la mission est active et apparaît immédiatement dans la liste.
- [ ] Un consultant qui appelle l'API de création reçoit un refus, même si l'écran ne lui est pas proposé.
- [ ] Créer une mission dont le nom existe déjà pour le même client est refusé, avec un message explicite.

## Règles métier

- Le nom d'une mission est unique pour un client donné.
- La date de fin, si elle est renseignée, ne peut pas précéder la date de début.
- Une mission sans date de fin est active indéfiniment.

## Notes techniques

- `POST /api/missions` → `201` ; réservé au rôle **Manager** (`403` sinon), contrôlé côté serveur.
- `409` en cas de doublon nom + client.
