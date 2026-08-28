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

Les stories se réalisent **dans l'ordre de leur numéro**. Chacune est autonome : elle ne suppose jamais une story ultérieure, et son éventuel prérequis — toujours une story précédente — est indiqué en tête de fichier.

| ID | Titre | Rôle principal | Prérequis |
|----|-------|----------------|-----------|
| [US-001](specs/US-001-authentification.md) | Authentification (bouchonnée pour la démo) | Tous | — |
| [US-002](specs/US-002-gestion-missions.md) | Gestion des missions | Manager | — |
| [US-003](specs/US-003-saisie-cra-mensuel.md) | Saisie du CRA mensuel | Consultant | US-002 |
| [US-004](specs/US-004-declaration-absences.md) | Déclaration des absences | Consultant | US-003 |
| [US-005](specs/US-005-soumission-cra.md) | Soumission du CRA | Consultant | US-003 |
| [US-006](specs/US-006-validation-manager.md) | Validation des CRA par le manager | Manager | US-005 |
| [US-007](specs/US-007-tableau-de-bord.md) | Tableau de bord | Tous | US-005 |
| [US-008](specs/US-008-historique-consultation.md) | Historique et consultation des CRA passés | Tous | US-003 |
| [US-009](specs/US-009-export-pdf-excel.md) | Export du CRA en PDF et Excel | Tous | US-003 |
| [US-010](specs/US-010-notifications-rappels.md) | Notifications et rappels | Tous | US-006 |

## Cycle de vie d'un CRA

```
Brouillon ──soumettre──▶ Soumis ──valider──▶ Validé (verrouillé)
    ▲                      │
    └──────refuser─────────┘
```

## Ordre de développement

De US-001 à US-010, dans l'ordre. Le numéro **est** l'ordre : rien à arbitrer en cours de démo, et chaque story peut être démontrée dès qu'elle est terminée, sur une application qui fonctionne.
