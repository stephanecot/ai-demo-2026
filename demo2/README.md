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

| ID | Titre | Rôle principal |
|----|-------|----------------|
| [US-001](specs/US-001-authentification.md) | Authentification (bouchonnée pour la démo) | Tous |
| [US-002](specs/US-002-saisie-cra-mensuel.md) | Saisie du CRA mensuel | Consultant |
| [US-003](specs/US-003-declaration-absences.md) | Déclaration des absences | Consultant |
| [US-004](specs/US-004-gestion-missions.md) | Gestion des missions | Manager |
| [US-005](specs/US-005-soumission-cra.md) | Soumission du CRA | Consultant |
| [US-006](specs/US-006-validation-manager.md) | Validation des CRA par le manager | Manager |
| [US-007](specs/US-007-tableau-de-bord.md) | Tableau de bord | Tous |
| [US-008](specs/US-008-export-pdf-excel.md) | Export du CRA en PDF et Excel | Tous |
| [US-009](specs/US-009-historique-consultation.md) | Historique et consultation des CRA passés | Tous |
| [US-010](specs/US-010-notifications-rappels.md) | Notifications et rappels | Tous |

## Cycle de vie d'un CRA

```
Brouillon ──soumettre──▶ Soumis ──valider──▶ Validé (verrouillé)
    ▲                      │
    └──────refuser─────────┘
```

## Ordre de développement suggéré

1. **Socle** : US-001 (authentification bouchonnée, rôles, profils de démo)
2. **Cœur métier** : US-004 (missions), US-002 (saisie), US-003 (absences)
3. **Workflow** : US-005 (soumission), US-006 (validation)
4. **Confort** : US-007 (dashboard), US-009 (historique), US-008 (exports), US-010 (notifications)
