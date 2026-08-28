# US-015 — Valider un CRA

**Prérequis** : US-014 — les CRA en attente doivent être consultables.

## User Story

**En tant que** manager,
**je veux** valider un CRA que j'ai vérifié,
**afin d'** acter que l'activité déclarée est exacte.

## Critères d'acceptation

- [ ] Depuis le détail d'un CRA soumis, un bouton « Valider » est disponible.
- [ ] Après validation, le CRA passe en « Validé » et disparaît de la liste des CRA en attente.
- [ ] Un CRA validé n'est plus modifiable, ni par le consultant ni par le manager.
- [ ] Le consultant voit son CRA en statut « Validé », avec la date de validation.
- [ ] Valider un CRA qui n'est pas en statut « Soumis » est refusé.
- [ ] Un consultant qui appelle l'endpoint de validation reçoit un refus, y compris sur son propre CRA.

## Règles métier

- Transition : **Soumis → Validé**. Un CRA validé est définitivement verrouillé.
- La date de validation et son auteur sont enregistrés.

## Notes techniques

- `POST /api/cra/{id}/valider` → `200` ; `403` pour un consultant, `409` si le statut ne permet pas la transition.
