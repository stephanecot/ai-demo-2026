# US-010 — Notifications et rappels

## User Story

**En tant qu'** utilisateur,
**je veux** recevoir des notifications dans l'application sur les événements liés à mes CRA,
**afin de** ne manquer aucune échéance ni action attendue.

## Critères d'acceptation

- [ ] Une icône cloche dans l'en-tête affiche le nombre de notifications non lues.
- [ ] Un consultant est notifié quand : son CRA est **validé**, son CRA est **refusé** (avec le commentaire du manager).
- [ ] Un manager est notifié quand : un consultant **soumet** un CRA.
- [ ] Un rappel automatique est généré pour le consultant le **dernier jour ouvré du mois** si son CRA n'est pas encore soumis.
- [ ] Un rappel automatique est généré le **5 du mois suivant** si le CRA du mois précédent n'est toujours pas soumis.
- [ ] Cliquer sur une notification redirige vers la page concernée et la marque comme lue.
- [ ] Une action « Tout marquer comme lu » est disponible.

## Règles métier

- Les notifications sont conservées 90 jours puis purgées.
- Les rappels ne sont pas envoyés si le CRA du mois est déjà soumis ou validé.
- Pour cette démo, les notifications sont uniquement in-app (pas d'e-mail).

## Notes techniques

- Endpoints backend : `GET /api/notifications`, `POST /api/notifications/{id}/lue`, `POST /api/notifications/tout-lu`.
- Les rappels sont générés par une tâche planifiée côté backend (scheduler quotidien).
- Le frontend interroge le backend par polling (toutes les 60 s) — pas de WebSocket pour la démo.
