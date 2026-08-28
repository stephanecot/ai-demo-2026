# US-004 — Consulter et filtrer la liste des missions

**Prérequis** : US-003 — des missions doivent pouvoir exister.

## User Story

**En tant que** manager,
**je veux** consulter la liste des missions et la filtrer,
**afin de** retrouver rapidement une mission parmi celles du portefeuille.

## Critères d'acceptation

- [ ] La liste affiche pour chaque mission : nom, client, dates, statut actif ou clôturé.
- [ ] Un filtre par client et un filtre par statut (active / clôturée) sont disponibles et combinables.
- [ ] Quand aucun résultat ne correspond, un message explicite s'affiche à la place d'un tableau vide.
- [ ] Un consultant ne voit que les missions auxquelles il est affecté.

## Règles métier

- Les missions clôturées restent consultables ; elles ne disparaissent pas de l'historique.

## Notes techniques

- `GET /api/missions?client=&closed=` — la réponse dépend du rôle de l'appelant, filtrée côté serveur.
