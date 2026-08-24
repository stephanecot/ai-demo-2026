# US-009 — Historique et consultation des CRA passés

## User Story

**En tant que** consultant,
**je veux** consulter l'historique de tous mes CRA passés,
**afin de** retrouver facilement mon activité sur les mois précédents.

## Critères d'acceptation

- [ ] Une page « Historique » liste tous mes CRA par ordre antéchronologique avec : mois, statut, total jours travaillés, total absences.
- [ ] Un filtre par année et par statut est disponible.
- [ ] Cliquer sur un CRA ouvre sa vue détaillée en lecture seule (même rendu calendrier que la saisie).
- [ ] Depuis la vue détaillée, l'export (voir [US-008]) est accessible.
- [ ] Un manager peut consulter l'historique des CRA de chacun des consultants de son équipe.
- [ ] Une recherche cumulée affiche le total de jours par mission sur une période donnée (de mois à mois).

## Règles métier

- L'historique est conservé sans limite de durée pour la démo.
- Un consultant ne voit que ses propres CRA ; un manager voit ceux de son équipe uniquement.

## Notes techniques

- Endpoints backend : `GET /api/cra?annee=&statut=`, `GET /api/cra/{id}`, `GET /api/rapports/cumul?missionId=&de=&a=`.
- La vue détaillée réutilise le composant calendrier de la saisie (US-002) en mode lecture seule.
