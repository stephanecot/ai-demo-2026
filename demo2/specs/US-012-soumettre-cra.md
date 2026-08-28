# US-012 — Soumettre son CRA

**Prérequis** : US-011 — le mois doit être saisissable et son récapitulatif visible.

## User Story

**En tant que** consultant,
**je veux** soumettre mon CRA une fois le mois complété,
**afin de** le transmettre à mon manager pour validation.

## Critères d'acceptation

- [ ] Un bouton « Soumettre » est disponible sur un CRA en statut « Brouillon ».
- [ ] Avant soumission, les jours ouvrés non renseignés sont signalés ; la soumission reste possible après confirmation explicite.
- [ ] Après soumission, le CRA passe en « Soumis » et devient non modifiable : toute tentative de saisie est refusée par le serveur.
- [ ] Le statut du CRA et la date de soumission sont affichés.
- [ ] Soumettre un CRA sans aucune saisie est refusé, avec un message explicite.

## Règles métier

- Cycle de vie : **Brouillon → Soumis**. Un CRA vide ne peut pas être soumis.
- Un seul CRA par consultant et par mois.

## Notes techniques

- `POST /api/cra/{annee}/{mois}/soumettre` → `200`, `409` si le CRA est vide ou déjà soumis.
- Le statut est revérifié côté serveur à chaque tentative de modification d'entrée.
