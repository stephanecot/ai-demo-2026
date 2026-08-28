# US-004 — Déclaration des absences

**Prérequis** : US-003 — le calendrier mensuel de saisie doit exister.

## User Story

**En tant que** consultant,
**je veux** déclarer mes absences (congés payés, RTT, maladie, sans solde) directement dans mon CRA,
**afin de** fournir une vision complète et exacte de mon mois.

## Critères d'acceptation

- [ ] Sur chaque jour du calendrier, je peux sélectionner un type d'absence au lieu d'une mission : **Congé payé**, **RTT**, **Maladie**, **Sans solde**, **Formation**.
- [ ] Les absences se saisissent aussi en journée ou demi-journée.
- [ ] Les absences sont visuellement distinctes des jours travaillés (couleur/icône par type).
- [ ] Le récapitulatif mensuel affiche le total par type : jours travaillés, congés, RTT, maladie, etc.
- [ ] La règle « maximum 1 par jour » s'applique à la somme travail + absence.

## Règles métier

- Une absence « Maladie » peut être saisie rétroactivement sur un mois déjà soumis mais non validé : le CRA repasse alors en statut « Brouillon ».
- Les absences n'ont pas de mission associée.

## Notes techniques

- Le type d'un jour saisi est modélisé par un enum : `MISSION`, `CONGE_PAYE`, `RTT`, `MALADIE`, `SANS_SOLDE`, `FORMATION`.
- Mêmes endpoints que la saisie d'activité (US-003), avec un champ `type` par entrée.
