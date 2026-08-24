# US-007 — Tableau de bord

## User Story

**En tant qu'** utilisateur (consultant ou manager),
**je veux** un tableau de bord personnalisé à la connexion,
**afin de** voir en un coup d'œil l'état de mes CRA et les actions à effectuer.

## Critères d'acceptation

### Consultant

- [ ] Affiche le statut du CRA du mois en cours (Brouillon / Soumis / Validé / Refusé) avec un lien direct vers la saisie.
- [ ] Affiche la progression du mois : jours saisis / jours ouvrés du mois.
- [ ] Affiche les 6 derniers mois avec leur statut (mini-historique).
- [ ] Affiche une alerte si un CRA a été refusé et doit être corrigé.

### Manager

- [ ] Affiche le nombre de CRA en attente de validation avec un lien direct vers la page de validation.
- [ ] Affiche la liste des consultants n'ayant pas encore soumis leur CRA du mois précédent après le 5 du mois.
- [ ] Affiche un graphique simple : jours déclarés par mission sur le mois en cours.

## Règles métier

- Le contenu du tableau de bord dépend exclusivement du rôle de l'utilisateur connecté.
- Les jours ouvrés excluent week-ends et jours fériés français.

## Notes techniques

- Endpoint backend : `GET /api/dashboard` (le backend adapte la réponse au rôle).
- Le graphique côté frontend est rendu avec une librairie de charts légère.
