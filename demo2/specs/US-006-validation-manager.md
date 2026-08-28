# US-006 — Validation des CRA par le manager

## User Story

**En tant que** manager,
**je veux** consulter les CRA soumis par mes consultants et les valider ou les refuser,
**afin de** garantir l'exactitude des activités déclarées avant facturation.

## Critères d'acceptation

- [ ] Une page liste tous les CRA soumis en attente de validation, avec consultant, mois, total de jours.
- [ ] Le manager peut ouvrir un CRA et voir le détail jour par jour (missions et absences).
- [ ] Le manager peut **valider** le CRA : statut « Validé », CRA définitivement verrouillé.
- [ ] Le manager peut **refuser** le CRA avec un commentaire obligatoire expliquant le motif.
- [ ] En cas de refus, le CRA repasse en « Brouillon » et le commentaire du manager est affiché au consultant sur son CRA.
- [ ] Un manager ne voit que les CRA des consultants de son équipe.
- [ ] La validation en masse est possible (sélection multiple + « Tout valider »).

## Règles métier

- Un CRA validé ne peut plus être modifié par personne (une correction passe par une procédure hors application pour cette démo).
- Le commentaire de refus est limité à 500 caractères.
- L'historique des actions (soumission, refus, validation) est conservé avec horodatage et auteur.

## Notes techniques

- Endpoints backend : `GET /api/validation/cra-en-attente`, `POST /api/cra/{id}/valider`, `POST /api/cra/{id}/refuser`.
- Accès restreint au rôle **Manager**.
