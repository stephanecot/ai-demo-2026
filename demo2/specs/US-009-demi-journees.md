# US-009 — Répartir une journée en demi-journées

**Prérequis** : US-008 — la saisie d'une journée doit exister.

## User Story

**En tant que** consultant,
**je veux** répartir une journée entre deux missions,
**afin de** refléter une journée partagée entre deux clients.

## Critères d'acceptation

- [ ] À la saisie, je peux choisir entre journée complète et demi-journée.
- [ ] Un jour peut porter deux demi-journées sur deux missions différentes.
- [ ] Le jour affiche alors les deux missions, chacune pour une demi-journée.
- [ ] Ajouter une saisie qui ferait dépasser 1 sur un jour est refusée, avec un message indiquant ce qu'il reste de disponible.
- [ ] Chaque demi-journée peut être supprimée indépendamment de l'autre.

## Règles métier

- La somme des fractions d'un même jour ne dépasse jamais **1**.
- Les seules fractions autorisées sont **1** et **0,5**.

## Notes techniques

- Même endpoint que US-008, avec un champ `fraction` valant `1` ou `0.5`.
- La règle de somme est vérifiée dans le service, testée sans passer par HTTP.
