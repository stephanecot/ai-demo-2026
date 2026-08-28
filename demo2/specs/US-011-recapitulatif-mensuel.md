# US-011 — Voir le récapitulatif du mois

**Prérequis** : US-010 — activité et absences doivent pouvoir être saisies.

## User Story

**En tant que** consultant,
**je veux** voir les totaux de mon mois pendant que je saisis,
**afin de** vérifier que mon CRA est complet avant de le transmettre.

## Critères d'acceptation

- [ ] Un récapitulatif affiche le total de jours travaillés du mois.
- [ ] Il détaille le total par mission, et le total par type d'absence.
- [ ] Il indique le nombre de jours ouvrés du mois et le nombre de jours encore non renseignés.
- [ ] Les totaux se mettent à jour immédiatement après chaque saisie ou suppression.
- [ ] Les demi-journées sont comptées pour 0,5 et affichées en français (« 0,5 jour »).

## Règles métier

- Les totaux sont **calculés** à la lecture, jamais stockés : une valeur dérivée qui se désynchronise est un bug garanti.
- Les jours ouvrés excluent week-ends et jours fériés.

## Notes techniques

- Les totaux sont produits par le backend dans la réponse du mois, pas recalculés côté frontend.
