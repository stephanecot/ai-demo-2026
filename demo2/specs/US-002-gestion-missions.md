# US-002 — Gestion des missions

## User Story

**En tant que** manager,
**je veux** créer et gérer les missions (client, période, consultants affectés),
**afin que** les consultants puissent imputer leur activité sur les bonnes missions.

## Critères d'acceptation

- [ ] Un manager peut créer une mission avec : nom, client, date de début, date de fin (optionnelle), description.
- [ ] Un manager peut affecter un ou plusieurs consultants à une mission.
- [ ] Un consultant ne voit dans son CRA que les missions auxquelles il est affecté et qui sont actives sur la période.
- [ ] Une mission peut être clôturée : elle n'apparaît plus pour les saisies futures, mais l'historique est conservé.
- [ ] La liste des missions est consultable avec filtres (client, statut actif/clôturé, consultant).
- [ ] Un consultant ne peut ni créer ni modifier une mission (contrôle côté backend, pas seulement UI).

## Règles métier

- Une mission sans date de fin est considérée comme active indéfiniment.
- La clôture d'une mission n'affecte pas les CRA déjà saisis.
- Le nom de mission doit être unique par client.

## Notes techniques

- Endpoints backend : `GET/POST /api/missions`, `PUT /api/missions/{id}`, `POST /api/missions/{id}/affectations`.
- Accès restreint au rôle **Manager** pour la création et la modification.
