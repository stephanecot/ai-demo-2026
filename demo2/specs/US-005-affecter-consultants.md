# US-005 — Affecter des consultants à une mission

**Prérequis** : US-004 — les missions doivent être consultables.

## User Story

**En tant que** manager,
**je veux** affecter un ou plusieurs consultants à une mission,
**afin qu'** ils puissent imputer leur activité dessus.

## Critères d'acceptation

- [ ] Depuis le détail d'une mission, le manager peut ajouter un ou plusieurs consultants.
- [ ] La liste des consultants déjà affectés est visible, et chacun peut être retiré.
- [ ] Affecter deux fois le même consultant à la même mission est sans effet et ne crée pas de doublon.
- [ ] Retirer un consultant n'efface aucune saisie d'activité déjà faite sur la mission.
- [ ] L'action est refusée à un consultant, contrôle fait côté serveur.

## Règles métier

- Seuls les utilisateurs de rôle **Consultant** peuvent être affectés.
- Une affectation ne peut porter que sur une mission active.

## Notes techniques

- `POST /api/missions/{id}/affectations` → `201`, `DELETE /api/missions/{id}/affectations/{userId}` → `204`.
- Contrainte d'unicité sur le couple (mission, consultant).
