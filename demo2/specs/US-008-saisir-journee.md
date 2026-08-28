# US-008 — Saisir une journée travaillée sur une mission

**Prérequis** : US-007 (calendrier) et US-005 (affectations).

## User Story

**En tant que** consultant,
**je veux** déclarer une journée complète travaillée sur une mission,
**afin de** renseigner mon activité jour par jour.

## Critères d'acceptation

- [ ] Cliquer sur un jour ouvré propose les missions auxquelles je suis affecté et actives à cette date.
- [ ] Sélectionner une mission enregistre une journée complète (1) sur ce jour.
- [ ] Le jour saisi affiche le nom de la mission et se distingue visuellement d'un jour vide.
- [ ] Une saisie peut être supprimée, et le jour redevient vide.
- [ ] La saisie est impossible sur un week-end ou un jour férié.
- [ ] Un consultant ne peut pas saisir sur le CRA d'un autre consultant, contrôle fait côté serveur.

## Règles métier

- Une seule journée complète par jour : une deuxième saisie sur un jour déjà complet est refusée.
- La mission doit être active à la date saisie et le consultant doit y être affecté.

## Notes techniques

- `POST /api/cra/{annee}/{mois}/entrees` → `201`, `DELETE /api/cra/{annee}/{mois}/entrees/{id}` → `204`.
- `409` si le jour est déjà complet, `403` si la mission n'est pas accessible au consultant.
