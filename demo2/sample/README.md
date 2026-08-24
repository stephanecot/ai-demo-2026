# sample/ — Outillage IA de référence

Contenu généré correspondant à la **phase 0** de [PLAN.MD](../PLAN.MD) : la mémoire projet,
les règles Do/Don't, les skills et les agents, en double — une version **Claude Code**
(`.claude/`) et une version **GitHub Copilot** (`.github/`), avec le même contenu.

Pendant la démo, on peut soit régénérer ces fichiers en direct avec les prompts de la
phase 0, soit copier ce dossier à la racine du projet pour démarrer immédiatement :

```bash
cp -R sample/.claude sample/.github sample/AGENT.md sample/CLAUDE.md .
```

## Mémoire projet : une seule source

`AGENT.md` est **générique et unique** : contexte, stack, structure, modèle de domaine,
conventions et commandes. Les deux outils y sont renvoyés par un pointeur de trois lignes,
pour qu'aucune connaissance projet ne soit dupliquée ni divergente :

```
AGENT.md                          ← la mémoire projet (source unique)
├── CLAUDE.md                     → « lis AGENT.md » + emplacements Claude Code
└── .github/copilot-instructions.md → « lis AGENT.md » + emplacements Copilot
```

## Correspondance des emplacements

| Élément | Claude Code | GitHub Copilot |
|---|---|---|
| Mémoire projet | `AGENT.md` via `CLAUDE.md` | `AGENT.md` via `.github/copilot-instructions.md` |
| Règles (×4) | `.claude/rules/*.md` | `.github/instructions/*.instructions.md` (`applyTo`) |
| Skills (×7) | `.claude/skills/<nom>/SKILL.md` | `.github/skills/<nom>/SKILL.md` |
| Agents (×4) | `.claude/agents/<nom>.md` | `.github/agents/<nom>.agent.md` |
| Permissions | `.claude/settings.json` | — |

## Règles — 4 fichiers

| Fichier | Contenu |
|---|---|
| `python-do` | Couches routers/services/modèles, typage, dépendances, erreurs, tests, style |
| `python-dont` | Logique métier dans un router, SQL brut, `Any`, rôle côté client, `except` nu |
| `react-do` | Composants fonction, appels API isolés, trois états, TypeScript strict, UI française |
| `react-dont` | `any`, `fetch` dans un composant, lib d'état globale, couleur seule, tests sur le DOM |

## Skills — 7 fichiers

| Skill | Sujet |
|---|---|
| `fastapi-endpoint` | Anatomie d'un endpoint : router → schémas → service, codes HTTP, erreurs en français |
| `fastapi-data-model` | Entités du domaine CRA, enums, invariants, valeurs dérivées, seed |
| `fastapi-testing` | pytest, SQLite en mémoire, tests API / règles métier / rôles |
| `react-screen` | Page → hook → client typé, trois états, formulaires, libellés français |
| `react-design-system` | Tokens, couleurs par statut et type d'absence, composants de base, accessibilité |
| `react-testing` | Vitest + Testing Library, requêtes accessibles, mock du module API |
| `implement-us` *(facultatif)* | Workflow bout en bout d'une user story : cadrage → `architect` → `fastapi-dev` + `react-dev` → vérification → `cra-reviewer` → case cochée et commit |

Le skill `implement-us` est **facultatif et remplaçable** : Spec Kit
(`/speckit.specify` → `.plan` → `.tasks` → `.implement`) ou du prompting manuel jouent le
même rôle. Ce qui compte est l'invariant qu'il encode — conception et contrat d'API
d'abord, un agent par côté, relecture avant de clore. Les six autres skills, les règles et
les agents restent valables quel que soit le workflow choisi.

## Agents — 4 fichiers

| Agent | Rôle | Périmètre |
|---|---|---|
| `architect` | Conçoit avant de coder : modèle, contrat d'API, ADR, découpage du travail | `docs/` uniquement |
| `fastapi-dev` | Développeur backend FastAPI | `backend/**` |
| `react-dev` | Développeur frontend React | `frontend/**` |
| `cra-reviewer` | Relecteur qualité, lecture seule, rapport classé par sévérité | tout le repo, sans écriture |

Enchaînement type sur une user story : `architect` → `fastapi-dev` et `react-dev` en
parallèle sur le contrat défini → `cra-reviewer`.

## Conventions rappelées partout

- Code, commentaires et identifiants en **anglais**.
- Tout ce que l'utilisateur lit (UI, messages d'erreur, exports PDF) en **français**.
- Les règles métier vivent dans les services backend, jamais dans un router ni un composant.
- Les contrôles de rôle sont appliqués côté serveur, jamais uniquement dans l'UI.
