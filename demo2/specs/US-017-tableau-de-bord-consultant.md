# US-017 — Tableau de bord du consultant

**Prérequis** : US-016 — le cycle de vie complet du CRA doit exister.

## User Story

**En tant que** consultant,
**je veux** une page d'accueil qui me dit où j'en suis,
**afin de** savoir immédiatement s'il me reste quelque chose à faire.

## Critères d'acceptation

- [ ] La page affiche le statut du CRA du mois en cours, avec un lien direct vers la saisie.
- [ ] Elle affiche la progression du mois : jours renseignés sur jours ouvrés.
- [ ] Si le CRA a été refusé, une alerte affiche le motif et invite à corriger.
- [ ] Chaque statut est rendu avec son libellé français, jamais la valeur technique.

## Règles métier

- Le contenu dépend uniquement de l'utilisateur connecté ; aucun paramètre d'identité ne vient du client.

## Notes techniques

- `GET /api/tableau-de-bord` — le backend adapte la réponse au rôle de l'appelant.
