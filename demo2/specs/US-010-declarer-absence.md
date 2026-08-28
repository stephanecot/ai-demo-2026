# US-010 — Déclarer une absence

**Prérequis** : US-009 — la saisie en journées et demi-journées doit exister.

## User Story

**En tant que** consultant,
**je veux** déclarer une absence sur un jour,
**afin que** mon CRA reflète l'intégralité du mois, et pas seulement les jours travaillés.

## Critères d'acceptation

- [ ] Sur un jour ouvré, je peux choisir une absence au lieu d'une mission : **Congé payé**, **RTT**, **Maladie**, **Sans solde**, **Formation**.
- [ ] Une absence se déclare en journée complète ou en demi-journée.
- [ ] Chaque type d'absence a une couleur et un libellé français distincts ; la couleur n'est jamais le seul indice.
- [ ] Une absence peut être supprimée comme une saisie d'activité.
- [ ] La règle de somme maximale d'un jour s'applique au total travail + absence.

## Règles métier

- Une absence n'est jamais rattachée à une mission.
- Les types d'absence forment une liste fermée, définie côté backend.

## Notes techniques

- Même endpoint que US-008, avec un champ `type` : `MISSION`, `CONGE_PAYE`, `RTT`, `MALADIE`, `SANS_SOLDE`, `FORMATION`.
- Une entrée de type `MISSION` exige une mission ; tout autre type l'interdit.
