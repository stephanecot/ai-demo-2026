# US-005 — Soumission du CRA

## User Story

**En tant que** consultant,
**je veux** soumettre mon CRA mensuel une fois complet,
**afin qu'** il soit transmis à mon manager pour validation.

## Critères d'acceptation

- [ ] Un bouton « Soumettre » est disponible sur le CRA du mois en statut « Brouillon ».
- [ ] Avant soumission, une vérification signale les jours ouvrés sans aucune saisie (travail ou absence) ; la soumission reste possible après confirmation explicite.
- [ ] Après soumission, le CRA passe au statut « Soumis » et devient en lecture seule pour le consultant.
- [ ] Le consultant peut annuler sa soumission tant que le manager n'a pas validé ou refusé (retour en « Brouillon »).
- [ ] La date et l'heure de soumission sont enregistrées et affichées.
- [ ] Le manager concerné est notifié de la soumission (voir [US-010]).

## Règles métier

- Cycle de vie d'un CRA : **Brouillon → Soumis → Validé** ou **Soumis → Refusé → Brouillon**.
- Un CRA vide (0 jour saisi) ne peut pas être soumis.
- Un seul CRA par consultant et par mois.

## Notes techniques

- Endpoints backend : `POST /api/cra/{annee}/{mois}/soumettre`, `POST /api/cra/{annee}/{mois}/annuler-soumission`.
- Le statut est vérifié côté backend à chaque tentative de modification.
