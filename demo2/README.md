# Spécifications — Application de gestion de CRA

Projet démo : développer une application avec l'IA en 2026. L'application permet aux consultants de saisir leur **Compte Rendu d'Activité (CRA)** mensuel et aux managers de le valider.

## Stack technique

- **Frontend** : React (TypeScript, Vite)
- **Backend** : Python — **FastAPI** recommandé (API REST, validation Pydantic, OpenAPI auto-généré, scheduler via APScheduler pour US-010)
- **Base de données** : SQLite pour la démo (zéro installation), via SQLAlchemy
- Les endpoints `/api/...` décrits dans les notes techniques des user stories restent valables tels quels.

## Rôles

- **Consultant** : saisit son activité et ses absences, soumet son CRA.
- **Manager** : gère les missions, valide ou refuse les CRA de son équipe.

## User stories

17 stories **unitaires** : chacune cible une fonctionnalité précise, pas un ensemble. Elles se réalisent **dans l'ordre de leur numéro** ; le prérequis d'une story est toujours une story précédente, indiqué en tête de son fichier.

| ID | Titre | Rôle | Prérequis |
|----|-------|------|-----------|
| [US-001](specs/US-001-connexion-profil.md) | Se connecter en choisissant un profil de démo | Tous | — |
| [US-002](specs/US-002-identite-deconnexion.md) | Voir qui je suis et me déconnecter | Tous | US-001 |
| [US-003](specs/US-003-creer-mission.md) | Créer une mission | Manager | US-002 |
| [US-004](specs/US-004-lister-missions.md) | Consulter et filtrer la liste des missions | Manager | US-003 |
| [US-005](specs/US-005-affecter-consultants.md) | Affecter des consultants à une mission | Manager | US-004 |
| [US-006](specs/US-006-cloturer-mission.md) | Clôturer une mission | Manager | US-004 |
| [US-007](specs/US-007-calendrier-mensuel.md) | Afficher le calendrier du mois | Consultant | US-002 |
| [US-008](specs/US-008-saisir-journee.md) | Saisir une journée travaillée sur une mission | Consultant | US-005, US-007 |
| [US-009](specs/US-009-demi-journees.md) | Répartir une journée en demi-journées | Consultant | US-008 |
| [US-010](specs/US-010-declarer-absence.md) | Déclarer une absence | Consultant | US-009 |
| [US-011](specs/US-011-recapitulatif-mensuel.md) | Voir le récapitulatif du mois | Consultant | US-010 |
| [US-012](specs/US-012-soumettre-cra.md) | Soumettre son CRA | Consultant | US-011 |
| [US-013](specs/US-013-annuler-soumission.md) | Annuler sa soumission | Consultant | US-012 |
| [US-014](specs/US-014-lister-cra-en-attente.md) | Consulter les CRA en attente de validation | Manager | US-012 |
| [US-015](specs/US-015-valider-cra.md) | Valider un CRA | Manager | US-014 |
| [US-016](specs/US-016-refuser-cra.md) | Refuser un CRA avec un commentaire | Manager | US-014 |
| [US-017](specs/US-017-tableau-de-bord-consultant.md) | Tableau de bord du consultant | Consultant | US-016 |

## Cycle de vie d'un CRA

```
Brouillon ──soumettre──▶ Soumis ──valider──▶ Validé (verrouillé)
    ▲                      │
    └──────refuser─────────┘
```

## Ordre de développement

De US-001 à US-017, dans l'ordre. Le numéro **est** l'ordre : rien à arbitrer en cours de démo, et l'application reste démontrable après chaque story.

