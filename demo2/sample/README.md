# sample/ — Outillage IA et socle de référence

Résultat des **phases 0 et 1** de [PLAN.MD](../PLAN.MD), généré par les agents eux-mêmes :

| Dossier | Contenu | Produit par |
|---|---|---|
| `.claude/` · `.github/` · `AGENT.md` | l'outillage IA : mémoire, règles, skills, agents | phase 0 |
| `docs/architecture/` · `docs/adr/` | la note de conception du socle et les ADR | agent `architect` |
| `backend/` | socle FastAPI + SQLAlchemy + SQLite | agent `fastapi-dev` |
| `frontend/` | socle React + TypeScript + Vite | agent `react-dev` |

## Démarrer

```bash
# backend — http://localhost:8000 (/docs pour l'OpenAPI)
cd backend && uv sync && uv run uvicorn app.main:app --reload

# frontend — http://localhost:5173 (proxy /api vers :8000)
cd frontend && npm install && npm run dev

# tests
cd backend && uv run pytest && uv run ruff check .
cd frontend && npm test && npm run build && npm run lint
```

Toujours ouvrir `http://localhost:5173` : c'est le chemin réel, celui qui passe par le
proxy Vite. Interroger `:8000` directement contourne la moitié de ce qu'on veut vérifier.

## Réutiliser l'outillage seul

Pour repartir de l'outillage sans le socle, le copier à la racine d'un autre projet :

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
| Skills (×10) | `.claude/skills/<nom>/SKILL.md` | `.github/skills/<nom>/SKILL.md` |
| Agents (×5) | `.claude/agents/<nom>.md` | `.github/agents/<nom>.agent.md` |
| Permissions | `.claude/settings.json` | — |

## Règles — 4 fichiers

| Fichier | Contenu |
|---|---|
| `python-do` | Couches routers/services/modèles, typage, dépendances, erreurs, tests, style |
| `python-dont` | Logique métier dans un router, SQL brut, `Any`, rôle côté client, `except` nu |
| `react-do` | Composants fonction, appels API isolés, trois états, TypeScript strict, UI française |
| `react-dont` | `any`, `fetch` dans un composant, lib d'état globale, couleur seule, tests sur le DOM |

## Skills — 10 fichiers

| Skill | Sujet |
|---|---|
| `fastapi-endpoint` | Anatomie d'un endpoint : router → schémas → service, codes HTTP, erreurs en français |
| `fastapi-data-model` | Entités du domaine CRA, enums, invariants, valeurs dérivées, seed |
| `fastapi-testing` | pytest, SQLite en mémoire, tests API / règles métier / rôles |
| `react-screen` | Page → hook → client typé, trois états, formulaires, libellés français |
| `react-design-system` | Tokens, couleurs par statut et type d'absence, composants de base, accessibilité |
| `react-testing` | Vitest + Testing Library, requêtes accessibles, mock du module API |
| `ui-verification` | Vérification de l'IHM dans un vrai Chrome via le **MCP Chrome DevTools** : snapshot avant action, console, appels réseau, trois états, clavier, responsive |
| `story-readiness` | Revue d'une user story **avant conception** : compréhensible, unitaire, testable, complète, bornée, implémentable. Délègue à `business-analyst`, produit un rapport par story dans `docs/revues/` |
| `architecture-pdf` | Document d'architecture en PDF : template livré dans `template/`, contenu assemblé depuis le dépôt (notes, ADR, code réel), rendu par Chrome headless |
| `implement-us` *(facultatif)* | Workflow bout en bout d'une user story : cadrage → `architect` → `fastapi-dev` + `react-dev` → vérification → `cra-reviewer` → case cochée et commit |

Le skill `implement-us` est **facultatif et remplaçable** : Spec Kit
(`/speckit.specify` → `.plan` → `.tasks` → `.implement`) ou du prompting manuel jouent le
même rôle. Ce qui compte est l'invariant qu'il encode — conception et contrat d'API
d'abord, un agent par côté, relecture avant de clore. Les neuf autres skills, les règles et
les agents restent valables quel que soit le workflow choisi.

## Agents — 5 fichiers

| Agent | Rôle | Périmètre |
|---|---|---|
| `business-analyst` | Conteste le besoin avant toute conception : rapport de recevabilité par story | `docs/revues/` uniquement |
| `architect` | Conçoit avant de coder : modèle, contrat d'API, ADR, découpage du travail | `docs/` uniquement |
| `fastapi-dev` | Développeur backend FastAPI | `backend/**` |
| `react-dev` | Développeur frontend React | `frontend/**` |
| `cra-reviewer` | Relecteur qualité, lecture seule, rapport classé par sévérité ; vérifie aussi l'IHM dans un vrai navigateur (MCP Chrome DevTools) | tout le repo, sans écriture |

Enchaînement type sur une user story : `business-analyst` (la story est-elle implémentable ?)
→ `architect` (contrat d'API) → `fastapi-dev` et `react-dev` en parallèle → `cra-reviewer`.

## MCP Chrome DevTools

Déclaré dans `.mcp.json` (Claude Code) et `.vscode/mcp.json` (Copilot). Il sert à vérifier
l'application **qui tourne** — proxy, en-tête `X-Demo-User`, vraies charges utiles, CSS,
console — là où Vitest ne teste que des composants en jsdom. Mode d'emploi : skill
`ui-verification`. Un serveur MCP n'est chargé qu'au démarrage d'une session.

## Conventions rappelées partout

- Code, commentaires et identifiants en **anglais**.
- Tout ce que l'utilisateur lit (UI, messages d'erreur, exports PDF) en **français**.
- Les règles métier vivent dans les services backend, jamais dans un router ni un composant.
- Les contrôles de rôle sont appliqués côté serveur, jamais uniquement dans l'UI.
