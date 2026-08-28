# US-013 — Annuler sa soumission

**Prérequis** : US-012 — la soumission doit exister.

## User Story

**En tant que** consultant,
**je veux** annuler ma soumission tant que le manager n'a pas statué,
**afin de** corriger une erreur repérée juste après l'envoi.

## Critères d'acceptation

- [ ] Un bouton « Annuler la soumission » est disponible sur un CRA en statut « Soumis ».
- [ ] Après annulation, le CRA repasse en « Brouillon » et redevient modifiable.
- [ ] L'annulation est refusée si le manager a déjà validé ou refusé le CRA.
- [ ] Un consultant ne peut annuler que la soumission de son propre CRA.

## Règles métier

- Transition autorisée : **Soumis → Brouillon**, uniquement tant qu'aucune décision manager n'a été prise.

## Notes techniques

- `POST /api/cra/{annee}/{mois}/annuler-soumission` → `200`, `409` si le statut ne le permet pas.
