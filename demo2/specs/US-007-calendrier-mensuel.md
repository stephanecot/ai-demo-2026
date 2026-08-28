# US-007 — Afficher le calendrier du mois

**Prérequis** : US-002 — l'utilisateur courant doit être connu.

## User Story

**En tant que** consultant,
**je veux** afficher le calendrier d'un mois,
**afin de** voir les jours sur lesquels je pourrai déclarer mon activité.

## Critères d'acceptation

- [ ] Le calendrier affiche tous les jours du mois sélectionné, avec le nom du jour.
- [ ] Les week-ends et les jours fériés français sont grisés et distingués visuellement.
- [ ] Un jour férié affiche son libellé (ex. « Fête du travail ») au survol ou en légende.
- [ ] Deux boutons permettent de naviguer vers le mois précédent et le mois suivant.
- [ ] Le mois affiché par défaut est le mois en cours.
- [ ] Pendant le chargement, un indicateur s'affiche ; en cas d'erreur, un message en français avec bouton « Réessayer ».

## Règles métier

- Les jours fériés sont ceux de la France métropolitaine, calculés (y compris les fériés mobiles liés à Pâques).
- La navigation est libre vers le passé ; vers le futur, elle s'arrête au mois suivant.

## Notes techniques

- `GET /api/cra/{annee}/{mois}` — retourne le mois, ses jours ouvrés et les entrées existantes (vide à ce stade).
- Les jours fériés sont calculés côté backend : aucune dépendance supplémentaire.
