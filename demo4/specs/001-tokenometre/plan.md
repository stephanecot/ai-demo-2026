# Tokenomètre — plan d'implémentation (contrat gelé)

Ce fichier est **le contrat**. Tout agent qui écrit du code le lit d'abord et s'y conforme
à la lettre. En cas de désaccord entre ce plan, une maquette et les tokens de design :
**tokens > plan > maquette**.

## 1. Ce qu'on construit

Le **Tokenomètre** : une console qui montre ce que coûtent les sessions Claude Code —
par jour, par modèle, par projet, par session, par agent et par outil — et qui surveille
des budgets mensuels.

Maquettes de référence (canvas Claude Design) :

| Fichier | Écran |
|---|---|
| `design/Main.dc.html` | Tableau de bord |
| `design/Session.dc.html` | Détail d'une session |
| `design/Budgets.dc.html` | Budgets & alertes |

Cinq destinations de navigation, dans cet ordre : **Tableau de bord**, **Sessions**,
**Budgets & alertes**, **Modèles & agents**, **Réglages**. Les trois écrans maquettés sont
fidèles à leur maquette. **Sessions** (la liste), **Modèles & agents** et **Réglages**
n'ont pas de maquette : ils se composent du même design system, sans inventer une seule
valeur visuelle.

## 2. Source des données

Le produit lit deux sources, derrière **un seul port** : `backend/src/services/depot.ts`.

1. **Jeu d'exemple** (par défaut) — `backend/src/data/jeu-exemple.ts`, déterministe,
   calé sur les chiffres des maquettes. C'est ce que servent les écrans tant que rien
   n'est configuré. Le pied de page affiche « données d'exemple ».
2. **Transcripts réels** — si la variable d'environnement `TOKENOMETRE_TRANSCRIPTS`
   désigne un dossier, `backend/src/transcripts/` lit ses `*.jsonl` récursivement.

**On ne lit jamais `~/.claude/` par défaut, et on n'y écrit jamais.** Les tests des
transcripts tournent sur des `.jsonl` synthétiques dans `backend/tests/fixtures/`.

`GET /api/sante` dit laquelle des deux sources est active (`"exemple" | "transcripts"`).

## 3. Règle d'or des chiffres

- Les tarifs vivent **uniquement** dans `backend/src/domain/tarifs.ts`. Aucun prix, aucune
  multiplication de coût, aucun `/ 1_000_000` dans `frontend/`.
- Un coût se calcule toujours depuis les quatre compteurs de tokens
  (`entree`, `sortie`, `cacheEcriture`, `cacheLecture`), jamais depuis un montant arrondi.
- On arrondit **à la sortie** (millième de dollar), jamais à chaque addition.
- Invariant : total période = somme des jours = somme des projets = somme des modèles.

## 4. Contrat d'API

Base : `/api`. Toutes les réponses sont du JSON. Les dates sont `YYYY-MM-DD`, les
horodatages ISO 8601. `debut` et `fin` sont **inclusifs** ; absents, ils valent le cycle
en cours. Le frontend appelle l'API via le proxy Vite (`/api` vers `localhost:3001`).

### 4.1 Types partagés

Les types de `backend/src/types.ts` sont la source de vérité. Le frontend les **recopie**
à l'identique dans `frontend/src/types/api.ts` (recopie manuelle, pas d'import croisé).
Les ajouts au fichier existant sont listés ci-dessous.

```ts
// ── ajouts à backend/src/types.ts ────────────────────────────────────────
export interface Cycle {
  readonly debut: string;      // 'YYYY-MM-DD'
  readonly fin: string;
  readonly jour: number;       // jour écoulé dans le cycle, 1-based
  readonly jours: number;      // durée du cycle en jours
}

export interface Sante {
  readonly statut: 'ok';
  readonly version: string;
  readonly source: 'exemple' | 'transcripts';
  readonly synchro: string;    // ISO
  readonly cycle: Cycle;
}

export interface Poste {                 // un poste de dépense (outil, agent…)
  readonly label: string;
  readonly cout: number;
}

// LigneProjet gagne quatre champs :
//   part: number             — % du coût de la période
//   modeleDominant: ModeleId — porte la couleur de la ligne (voir §6)
//   postes: readonly Poste[] — 3 postes les plus chers
//   alerte: string           — une phrase, jamais vide

// Resume gagne :
//   deltaPeriodePrecedente: number  — % signé vs période précédente de même durée
//   plafondGlobal: number           — plafond du budget d'organisation
//   partPlafond: number             — projection / plafondGlobal, en %

export type SeveriteAlerte = 'critique' | 'limite' | 'info' | 'reglage';

export interface Alerte {
  readonly id: string;
  readonly horodatage: string;   // ISO
  readonly budgetId: string;
  readonly severite: SeveriteAlerte;
  readonly texte: string;
}

export interface Canal {
  readonly id: 'mail' | 'slack' | 'blocage';
  readonly libelle: string;
  readonly detail: string;
  readonly actif: boolean;
}

// Budget gagne : min, max, pas (bornes du curseur de plafond) et modifieLe/modifiePar.
// EtatDuBudget gagne : pctConsomme, pctProjection (bornés à 100 pour la jauge),
//                      verdict: string (la phrase du panneau de droite),
//                      canaux: readonly Canal[] (remplace readonly string[]).

export interface ReponseBudgets {
  readonly budgets: readonly EtatDuBudget[];
  readonly alertes: readonly Alerte[];
}

export interface LigneOutil {
  readonly outil: string;
  readonly cout: number;
  readonly appels: number;
}

export interface Reglages {
  readonly source: 'exemple' | 'transcripts';
  readonly chemin: string;          // chemin affiché, jamais un chemin absolu du disque
  readonly cycle: Cycle;
  readonly devise: 'USD';
  readonly modeles: readonly { modele: ModeleId; libelle: string; tarif: Tarif }[];
}
```

### 4.2 Routes

| Méthode | Route | Réponse |
|---|---|---|
| `GET` | `/api/sante` | `Sante` |
| `GET` | `/api/resume?debut&fin` | `Resume` |
| `GET` | `/api/projets?debut&fin` | `{ projets: LigneProjet[] }` |
| `GET` | `/api/sessions?debut&fin&projet` | `{ sessions: ResumeSession[] }` (plus récentes d'abord) |
| `GET` | `/api/sessions/:id` | `DetailSession` |
| `GET` | `/api/agents?debut&fin` | `{ agents: LigneAgent[], outils: LigneOutil[] }` |
| `GET` | `/api/budgets` | `ReponseBudgets` |
| `PATCH` | `/api/budgets/:id` | `EtatDuBudget` — corps `{ plafond?, seuils?, canaux? }`, persistance en mémoire |
| `GET` | `/api/reglages` | `Reglages` |
| `GET` | `/api/export.csv?debut&fin` | `text/csv; charset=utf-8`, séparateur `;`, en-têtes en français |

### 4.3 Erreurs

Forme unique : `{ "erreur": "<message>" }`. Message **en français, avec un point final**,
sans chemin absolu. Codes : `400` paramètre invalide (date mal formée, `fin` avant `debut`,
plafond hors bornes), `404` ressource inconnue, `500` seulement pour un vrai imprévu.
Jamais de `500` pour une mauvaise saisie.

## 5. Découpage des fichiers

```
backend/src/
  types.ts                  formes de réponse — identiques au §4.1
  domain/tarifs.ts          EXISTE — tarifs, coût, économie de cache
  domain/agregation.ts      EXISTE — agrégations pures ; à étendre, pas à dupliquer
  domain/budgets.ts         état d'un budget, seuils franchis, verdict, projection
  data/jeu-exemple.ts       sessions, budgets, alertes du jeu d'exemple
  transcripts/lecture.ts    parseur .jsonl tolérant (une ligne illisible est comptée, pas fatale)
  services/depot.ts         choisit la source, expose sessions/budgets/alertes
  services/periodes.ts      bornes, cycle en cours, période précédente
  services/*.ts             orchestration par ressource
  routes/*.ts               validation des paramètres + réponse ; zéro règle métier
  erreurs.ts                erreurs typées (RequeteInvalide, Introuvable)
  server.ts                 montage Express + middleware d'erreur
frontend/src/
  main.tsx  App.tsx  routes.tsx
  styles/tokens.css         SEULE source des valeurs visuelles
  styles/global.css         reset, fond gravé, polices
  types/api.ts              recopie du §4.1
  api/client.ts             le seul fetch du produit
  api/*.ts                  une fonction par endpoint
  hooks/*.ts                un hook par ressource → { data, statut, erreur, recharger }
  format.ts                 nombres, dates, durées — format français
  labels.ts                 TOUS les textes de l'interface
  components/ui/            design system (voir le skill design-system)
  components/mise-en-page/  BarreLaterale, Ecran, EnTeteEcran, PiedDePage
  ecrans/TableauDeBord/  Sessions/  Session/  Budgets/  ModelesEtAgents/  Reglages/
```

`statut` d'un hook vaut exactement `chargement | pret | vide | erreur`. Les quatre états
sont obligatoires sur chaque écran.

## 6. Décisions de design qui s'écartent de la maquette

Les maquettes sont une intention ; ces trois points sont tranchés en faveur du système :

1. **Couleur de ligne d'un projet.** La maquette invente une couleur par projet (violet,
   ocre…). Le design system fige trois couleurs de données et interdit d'en ajouter une
   quatrième. La ligne d'un projet porte donc la couleur de son **modèle dominant**
   (`modeleDominant`) — c'est une information, pas un décor.
2. **Couleur de puce d'un agent.** Même règle : les puces d'agent de la maquette de session
   utilisent cinq teintes. On garde `--surface-2` + `--texte-2` pour toutes, le nom de
   l'agent portant l'identité. Le coût par agent se lit dans l'onglet « Par agent ».
3. **Le curseur de plafond** est toujours doublé de boutons `−` / `+` et de la valeur
   chiffrée (règle du design system), et l'`input[type=range]` porte un `aria-label`.

Tout le reste — trame gravée 48 px, panneaux `--surface` sans ombre, chiffres mono
tabulaires, accent terre cuite unique, angles à 3 px — est repris tel quel.

## 7. Vérifications avant de rendre

Depuis la racine `demo4/` :

```
npm run typecheck && npm run lint && npm test && npm run build
```

Couverture ≥ 70 % sur les deux workspaces. Puis `npm run dev`, et l'écran est regardé
pour de vrai à 1 280 px **et** 1 440 px : rien ne déborde, aucune colonne de chiffres ne
se désaligne, les quatre états existent, le focus clavier est visible.
