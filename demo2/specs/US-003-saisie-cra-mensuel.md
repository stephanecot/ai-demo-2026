# US-003 — Saisie du CRA mensuel

**Prérequis** : US-002 — les missions sur lesquelles imputer l'activité doivent exister.

## User Story

**En tant que** consultant,
**je veux** saisir mes jours travaillés dans une vue calendrier mensuelle,
**afin de** déclarer mon activité du mois de façon simple et rapide.

## Critères d'acceptation

- [ ] Une vue calendrier affiche tous les jours du mois sélectionné.
- [ ] Pour chaque jour, je peux saisir une activité en **journée complète (1)** ou **demi-journée (0,5)**.
- [ ] Les week-ends et jours fériés (calendrier français) sont grisés et non saisissables par défaut.
- [ ] Chaque saisie est associée à une mission active (voir [US-002]).
- [ ] Le total de jours saisis dans le mois s'affiche en temps réel et se met à jour à chaque modification.
- [ ] Un enregistrement automatique (autosave) est déclenché à chaque modification.

## Règles métier

- Un jour ne peut pas dépasser 1 (ex. : 0,5 sur mission A + 0,5 sur mission B = OK ; 1 + 0,5 = refusé).
- Il est possible de saisir sur plusieurs missions le même jour (répartition en demi-journées).
- La saisie sur un mois futur est autorisée uniquement pour le mois suivant (M+1).

## Notes techniques

- Endpoints backend : `GET /api/cra/{annee}/{mois}`, `PUT /api/cra/{annee}/{mois}/jours`.
- Les jours fériés français sont calculés côté backend et exposés via `GET /api/jours-feries/{annee}`.
