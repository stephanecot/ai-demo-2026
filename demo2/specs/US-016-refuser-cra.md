# US-016 — Refuser un CRA avec un commentaire

**Prérequis** : US-014 — les CRA en attente doivent être consultables.

## User Story

**En tant que** manager,
**je veux** refuser un CRA en expliquant pourquoi,
**afin que** le consultant sache précisément quoi corriger.

## Critères d'acceptation

- [ ] Depuis le détail d'un CRA soumis, un bouton « Refuser » ouvre une saisie de commentaire.
- [ ] Le commentaire est obligatoire : sans lui, le refus n'est pas envoyé et un message le signale.
- [ ] Après refus, le CRA repasse en « Brouillon » et redevient modifiable par le consultant.
- [ ] Le consultant voit le motif du refus affiché sur son CRA.
- [ ] Refuser un CRA qui n'est pas en statut « Soumis » est refusé.

## Règles métier

- Transition : **Soumis → Brouillon**, avec un motif conservé.
- Le commentaire est limité à 500 caractères.

## Notes techniques

- `POST /api/cra/{id}/refuser` avec `{ "commentaire": "..." }` → `200` ; `422` si le commentaire est absent ou trop long.
