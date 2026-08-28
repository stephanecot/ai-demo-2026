# US-006 — Clôturer une mission

**Prérequis** : US-004 — les missions doivent être consultables.

## User Story

**En tant que** manager,
**je veux** clôturer une mission terminée,
**afin qu'** elle ne soit plus proposée aux consultants pour de nouvelles saisies.

## Critères d'acceptation

- [ ] Depuis le détail d'une mission active, le manager peut la clôturer.
- [ ] Une mission clôturée est signalée comme telle dans la liste.
- [ ] Une mission clôturée n'est plus proposée à la saisie d'activité.
- [ ] Les saisies déjà faites sur la mission restent inchangées et consultables.
- [ ] Clôturer une mission déjà clôturée est refusé avec un message explicite.

## Règles métier

- La clôture est réversible : le manager peut rouvrir une mission clôturée.
- Un consultant ne peut ni clôturer ni rouvrir une mission.

## Notes techniques

- `POST /api/missions/{id}/cloturer` et `POST /api/missions/{id}/rouvrir` → `200`.
- `409` si la mission est déjà dans l'état demandé.
