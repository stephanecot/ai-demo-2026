# US-014 — Consulter les CRA en attente de validation

**Prérequis** : US-012 — des CRA doivent pouvoir être soumis.

## User Story

**En tant que** manager,
**je veux** voir les CRA soumis par mon équipe,
**afin de** savoir ce que j'ai à traiter.

## Critères d'acceptation

- [ ] Une page liste les CRA en statut « Soumis » : consultant, mois, total de jours, date de soumission.
- [ ] La liste ne contient que les consultants de l'équipe du manager connecté.
- [ ] Quand il n'y a rien à valider, un message explicite s'affiche.
- [ ] Ouvrir un CRA affiche son détail jour par jour, en lecture seule.
- [ ] Un consultant qui appelle cet endpoint reçoit un refus.

## Règles métier

- Un manager ne voit jamais les CRA d'un consultant qui n'est pas dans son équipe, y compris via un appel direct à l'API.

## Notes techniques

- `GET /api/validation/cra-en-attente` — filtré côté serveur sur l'équipe du manager ; `403` pour un consultant.
