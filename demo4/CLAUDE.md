# CLAUDE.md — Tokenomètre

Mode d'emploi du dépôt. Tout est en français : interface, messages d'erreur, noms du
domaine, commentaires. Les mots-clés des frameworks restent en anglais.

## Le contrat, d'abord

`specs/001-tokenometre/plan.md` **est le contrat** : routes, types, invariants, découpage
des fichiers. Il prime sur l'intuition. Hiérarchie en cas de désaccord :
**tokens de design > plan > maquette**.

Pour tout travail sous `frontend/`, lire d'abord `.claude/skills/design-system/SKILL.md`
et ses références `references/tokens.md`, `references/composants.md`,
`references/graphiques.md`. Les maquettes sont dans `design/*.dc.html` (la structure DOM du
haut est la maquette ; le `<script data-dc-script>` du bas porte les données).

## La règle d'or

Les tarifs vivent **uniquement** dans `backend/src/domain/tarifs.ts`. Aucun prix, aucune
multiplication de coût, aucun `/ 1_000_000` ailleurs — et surtout pas sous `frontend/`,
qui reçoit des montants déjà calculés. Un coût se dérive toujours des quatre compteurs de
tokens (`entree`, `sortie`, `cacheEcriture`, `cacheLecture`), jamais d'un montant arrondi ;
on arrondit **à la sortie** (millième de dollar). Invariant :
total période = somme des jours = somme des projets = somme des modèles.

Corollaire visuel : aucune valeur en dur sous `frontend/` — pas un `#hex`, pas un `14px`,
pas un rayon littéral hors `frontend/src/styles/tokens.css`. Tout passe par `var(--…)`.
Seule exception : les trois couleurs de séries des graphiques.

## Source des données

Un seul port : `backend/src/services/depot.ts`.

1. **Jeu d'exemple** (défaut) — `backend/src/data/jeu-exemple.ts`, déterministe, calé sur
   les maquettes. Le pied de page affiche « données d'exemple ».
2. **Transcripts réels** — si la variable d'environnement `TOKENOMETRE_TRANSCRIPTS` désigne
   un dossier, `backend/src/transcripts/` y lit les `*.jsonl` récursivement (parseur
   tolérant : une ligne illisible est comptée, pas fatale).

On ne lit **jamais** `~/.claude/` par défaut et on n'y écrit jamais. Les tests des
transcripts tournent sur des `.jsonl` synthétiques de `backend/tests/fixtures/`.
`GET /api/sante` dit quelle source est active (`"exemple" | "transcripts"`).

```bash
TOKENOMETRE_TRANSCRIPTS=/chemin/vers/transcripts npm run dev -w backend
```

## Commandes

Toutes depuis la racine `demo4/` (npm workspaces).

```bash
npm install                       # une fois

npm run dev                       # backend 3001 + frontend 5173
npm run dev -w backend            # tsx watch src/server.ts        → http://localhost:3001
npm run dev -w frontend           # vite                           → http://localhost:5173

npm run typecheck                 # tsc --noEmit sur les deux workspaces
npm run lint                      # eslint, config plate à la racine
npm test                          # vitest run --coverage, seuils à 70 %
npm run build                     # tsc puis vite build

npm run typecheck -w frontend     # variantes par workspace : -w backend | -w frontend
npx vitest run tests/domain/tarifs.test.ts --root backend     # un seul fichier
npx vitest run -t "économie de cache" --root backend          # un seul test
npx tsc --noEmit -p backend/tsconfig.json                     # vérification ciblée
```

Le frontend appelle l'API par le proxy Vite (`/api` → `http://localhost:3001`, déclaré dans
`frontend/vite.config.ts`). Vérification de bout en bout, les deux serveurs lancés :
`curl -s localhost:5173/api/sante` — un Vitest vert ne dit rien d'un proxy cassé.

## Arborescence

```
backend/src/
  types.ts                  formes de réponse — source de vérité des types
  erreurs.ts                erreurs typées (RequeteInvalide, Introuvable)
  domain/                   tarifs.ts (LES prix), agregation.ts, budgets.ts — fonctions pures
  data/jeu-exemple.ts       le jeu d'exemple déterministe
  transcripts/lecture.ts    parseur .jsonl tolérant, aucun calcul de coût
  services/                 depot.ts (choix de la source), periodes.ts, orchestration
  routes/                   validation des paramètres + réponse, zéro règle métier
  server.ts                 montage Express + middleware d'erreur
frontend/src/
  main.tsx App.tsx routes.tsx          main.tsx monte sur <div id="racine"> (index.html)
  styles/tokens.css                    SEULE source des valeurs visuelles
  styles/global.css                    reset, fond gravé, polices
  types/api.ts                         recopie manuelle des types du backend
  api/client.ts + api/*.ts             le seul endroit où `fetch` est appelé
  hooks/*.ts                           un hook par ressource → { data, statut, erreur, recharger }
  format.ts labels.ts                  formats français ; TOUS les textes de l'interface
  components/ui/                       design system
  components/mise-en-page/             BarreLaterale, Ecran, EnTeteEcran, PiedDePage
  ecrans/                              TableauDeBord Sessions Session Budgets
                                       ModelesEtAgents Reglages
design/     maquettes Claude Design (*.dc.html)
docs/design/DESIGN.md   le parti pris visuel
specs/      artefacts speckit par feature (spec.md, plan.md, tasks.md)
.claude/    agents/ et skills/design-system/
```

Le `statut` d'un hook vaut exactement `chargement | pret | vide | erreur`. Les quatre états
sont obligatoires sur chaque écran.

## Interdits

`any`, `@ts-ignore`, assertion `!` de complaisance, `console.log` livré (`warn`/`error`
tolérés), texte anglais à l'écran, date ISO brute affichée, emoji. ESLint les refuse.

Formats : montants `1 234,56 $` (espace fine insécable, virgule décimale), tokens
`125,6 M`, `font-variant-numeric: tabular-nums` sur tout nombre comparé. Un statut n'est
jamais porté par la couleur seule : toujours un libellé ou une icône. Les icônes sont du
SVG en ligne (trait 1,6–2,2 px, grille 16/20/24), jamais une librairie.

Erreurs d'API : `{ "erreur": "<message>" }`, message en français avec un point final, sans
chemin absolu. `400` saisie invalide, `404` inconnu, `500` seulement pour un vrai imprévu.
