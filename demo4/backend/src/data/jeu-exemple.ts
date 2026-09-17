import type { Alerte, Budget, ModeleId, Session, Tour, Usage } from '../types.js';
import { tarifDe } from '../domain/tarifs.js';

/**
 * Jeu de données déterministe du Tokenomètre.
 *
 * ## Comment il a été calibré
 *
 * Les trois maquettes (`design/Main.dc.html`, `design/Session.dc.html`,
 * `design/Budgets.dc.html`) stockent des **coûts déjà calculés** dans leur
 * `<script data-dc-script>`. Nous, on ne stocke jamais un coût : seulement les
 * quatre compteurs de tokens d'un tour, recalculés à chaque appel via
 * `domain/tarifs.ts`. Ce fichier fabrique donc des tokens qui, une fois passés
 * dans `coutUsage`, retombent (à l'arrondi du jeton près) sur les chiffres des
 * maquettes :
 *
 * - Période : 1 → 10 septembre 2026 (le cycle par défaut de `services/periodes.ts`
 *   tombe dessus, voir sa documentation).
 * - 6 projets, avec le total exact de `Main.dc.html` → `projets()` : la somme des
 *   trois coûts par modèle (`split`) de chaque projet vaut exactement le coût du
 *   projet dans la maquette (`gcmt-backend-simulation` 112,4 $, `enerflex-demo3`
 *   68,2 $, `ai-demo-2026` 54,8 $, `audit_code` 41,1 $, `synapse` 22,9 $,
 *   `divers / hors projet` 14,6 $), soit un total de période de 314,0 $
 *   (la mission parle d'« environ 318 $ » : l'écart vient de l'arrondi de
 *   l'énoncé, le chiffre exact et interne à la maquette est 314,0 $ — on retombe
 *   dessus, pas sur une approximation supplémentaire).
 * - La session `4f2c9a1e` reprend telle quelle la méthode `brut()` de
 *   `Session.dc.html` : mêmes 14 tours, mêmes agents (`principal`, `architecte`,
 *   `node-dev`, `react-dev`, `reviewer`), même projet `ai-demo-2026`, même
 *   branche `feat/import-jsonl`, même journée du 9 septembre 2026 14:02 → 16:41.
 *   Les tokens de la maquette y sont exprimés en **milliers** ; on les multiplie
 *   par 1000 pour obtenir de vrais compteurs. Son coût recalculé (≈ 2,386 $) et
 *   sa part de cache (≈ 83 %) sont les mêmes qu'à l'écran.
 * - Les 14 autres sessions sont réparties sur les 6 projets et complètent
 *   chaque projet jusqu'à son total cible (voir `usagePourCout` ci-dessous).
 *   Le mélange de tokens par défaut vise une part de cache globale d'environ
 *   78-80 %, cohérente avec la consigne (« autour de 80 % »).
 *
 * ## Le piège évité
 *
 * On ne recopie jamais un prix : `usagePourCout` n'appelle que `tarifDe` (donc
 * `tarifs.ts`) pour déduire, à partir d'un coût cible et d'un mélange de
 * répartition entrée/sortie/cache, les quatre compteurs de tokens qui, repassés
 * dans `coutUsage`, redonnent ce coût. C'est la seule endroit de ce fichier qui
 * « connaît » un tarif, et il ne fait que le lire.
 *
 * ## Écart volontaire au plan
 *
 * `Main.dc.html` affiche 14+9+8+6+3+2 = 42 sessions cumulées sur les 6 projets.
 * La mission demande explicitement « une quinzaine de sessions au total » : on
 * retombe donc sur les mêmes coûts par projet et par modèle, mais avec 15
 * sessions (4+3+3+2+2+1) au lieu de 42. Le nombre de sessions par projet à
 * l'écran de détail ne sera donc pas identique à celui de la maquette — c'est
 * documenté ici plutôt que « corrigé » en silence.
 */

/* ── Le seul endroit où ce fichier touche un tarif : il le lit, ne le recopie pas ── */

interface Melange {
  readonly entree: number;
  readonly sortie: number;
  readonly cacheEcriture: number;
  readonly cacheLecture: number;
}

/**
 * Mélange par défaut d'un tour Claude Code habituel : le plus gros volume sert
 * à relire un contexte déjà en cache (CLAUDE.md, specs, code déjà lu par un
 * tour précédent) ; l'écriture initiale du cache et l'entrée fraîche restent
 * modestes ; la sortie, seule à ne jamais bénéficier du tarif cache, reste la
 * plus chère par token. Ce mélange cale la part de cache du jeu autour de 78 %.
 */
const MELANGE_DEFAUT: Melange = { entree: 0.06, sortie: 0.12, cacheEcriture: 0.04, cacheLecture: 0.78 };

/**
 * Construit un usage (les quatre compteurs de tokens) qui, une fois passé à
 * `coutUsage(usage, modele)`, retombe sur `coutCible` à l'arrondi du jeton
 * près. Ne fait que lire `tarifDe` : aucun prix n'est recopié ici.
 */
function usagePourCout(modele: ModeleId, coutCible: number, melange: Melange = MELANGE_DEFAUT): Usage {
  const tarif = tarifDe(modele);
  const prixMoyenParMillion =
    melange.entree * tarif.entree +
    melange.sortie * tarif.sortie +
    melange.cacheEcriture * tarif.cacheEcriture +
    melange.cacheLecture * tarif.cacheLecture;
  const totalTokens = prixMoyenParMillion === 0 ? 0 : (coutCible / prixMoyenParMillion) * 1_000_000;
  return {
    entree: Math.round(totalTokens * melange.entree),
    sortie: Math.round(totalTokens * melange.sortie),
    cacheEcriture: Math.round(totalTokens * melange.cacheEcriture),
    cacheLecture: Math.round(totalTokens * melange.cacheLecture),
  };
}

/** Fabrique un tour à partir de ses quatre compteurs de tokens — jamais d'un coût. */
function creeTour(
  index: number,
  horodatage: string,
  modele: ModeleId,
  agent: string,
  outil: string,
  libelle: string,
  usage: Usage,
): Tour {
  return { index, horodatage, modele, agent, outil, libelle, usage };
}

function iso(date: string, heureMinute: string): string {
  return `${date}T${heureMinute}:00Z`;
}

function heureEnMinutes(heure: string): number {
  const morceaux = heure.split(':');
  const heures = Number(morceaux[0] ?? '0');
  const minutes = Number(morceaux[1] ?? '0');
  return heures * 60 + minutes;
}

function minutesEnHeure(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Répartit `n` horodatages également entre `debut` et `fin` (mêmes bornes incluses). */
function horodatagesEgalementRepartis(date: string, debut: string, fin: string, n: number): string[] {
  if (n <= 1) return [iso(date, debut)];
  const minDebut = heureEnMinutes(debut);
  const minFin = heureEnMinutes(fin);
  const pas = (minFin - minDebut) / (n - 1);
  return Array.from({ length: n }, (_, i) => iso(date, minutesEnHeure(Math.round(minDebut + pas * i))));
}

/* ── La session de référence de Session.dc.html, reprise telle quelle ──────── */

interface TourBrutReference {
  readonly modele: ModeleId;
  readonly agent: string;
  readonly outil: string;
  readonly libelle: string;
  readonly entreeK: number;
  readonly sortieK: number;
  readonly cacheLectureK: number;
  readonly cacheEcritureK: number;
}

// Tours de `Session.dc.html` (méthode `brut()`), tokens en milliers dans la
// maquette — on multiplie par 1000 pour obtenir de vrais compteurs de tokens.
const TOURS_REFERENCE: readonly TourBrutReference[] = [
  { modele: 'claude-opus-5', agent: 'principal', outil: 'Read', libelle: 'Lecture du brief, de CLAUDE.md et de la spec', entreeK: 14.2, sortieK: 2.1, cacheLectureK: 0, cacheEcritureK: 46.0 },
  { modele: 'claude-opus-5', agent: 'principal', outil: 'Grep', libelle: "Repérage des modules touchés par l'import", entreeK: 1.1, sortieK: 1.8, cacheLectureK: 48.0, cacheEcritureK: 4.2 },
  { modele: 'claude-sonnet-5', agent: 'principal', outil: 'Read', libelle: 'Lecture des artefacts speckit (plan, tasks)', entreeK: 0.9, sortieK: 1.2, cacheLectureK: 52.0, cacheEcritureK: 8.4 },
  { modele: 'claude-opus-5', agent: 'architecte', outil: 'Write', libelle: 'Plan technique du parseur JSONL', entreeK: 1.4, sortieK: 6.8, cacheLectureK: 61.0, cacheEcritureK: 2.1 },
  { modele: 'claude-opus-5', agent: 'node-dev', outil: 'Edit', libelle: "Service d'import et agrégation par session", entreeK: 2.2, sortieK: 9.4, cacheLectureK: 64.0, cacheEcritureK: 3.6 },
  { modele: 'claude-haiku-4-5', agent: 'node-dev', outil: 'Bash', libelle: 'npm test -w backend', entreeK: 0.6, sortieK: 0.4, cacheLectureK: 12.0, cacheEcritureK: 0.8 },
  { modele: 'claude-opus-5', agent: 'node-dev', outil: 'Edit', libelle: 'Correction des trois tests rouges', entreeK: 1.8, sortieK: 7.2, cacheLectureK: 72.0, cacheEcritureK: 1.9 },
  { modele: 'claude-sonnet-5', agent: 'reviewer', outil: 'Read', libelle: 'Relecture du diff backend', entreeK: 1.2, sortieK: 3.1, cacheLectureK: 78.0, cacheEcritureK: 2.4 },
  { modele: 'claude-opus-5', agent: 'react-dev', outil: 'Edit', libelle: 'Hook useSessions et écran Sessions', entreeK: 1.6, sortieK: 8.1, cacheLectureK: 81.0, cacheEcritureK: 2.8 },
  { modele: 'claude-haiku-4-5', agent: 'react-dev', outil: 'Bash', libelle: 'npm run typecheck -w frontend', entreeK: 0.5, sortieK: 0.3, cacheLectureK: 14.0, cacheEcritureK: 0.6 },
  { modele: 'claude-opus-5', agent: 'react-dev', outil: 'Write', libelle: "Tests Testing Library de l'écran", entreeK: 1.9, sortieK: 10.4, cacheLectureK: 86.0, cacheEcritureK: 3.2 },
  { modele: 'claude-sonnet-5', agent: 'node-dev', outil: 'Bash', libelle: 'npm test — seconde passe, tout au vert', entreeK: 0.8, sortieK: 1.1, cacheLectureK: 88.0, cacheEcritureK: 1.2 },
  { modele: 'claude-opus-5', agent: 'reviewer', outil: 'Edit', libelle: 'Ajustements demandés en revue', entreeK: 1.4, sortieK: 5.6, cacheLectureK: 92.0, cacheEcritureK: 2.0 },
  { modele: 'claude-opus-5', agent: 'principal', outil: 'Write', libelle: 'Rapport de session et mise à jour des tâches', entreeK: 1.1, sortieK: 4.2, cacheLectureK: 96.0, cacheEcritureK: 1.4 },
];

function construitSessionReference(): Session {
  const date = '2026-09-09';
  const horodatages = horodatagesEgalementRepartis(date, '14:02', '16:41', TOURS_REFERENCE.length);
  const tours = TOURS_REFERENCE.map((t, i) =>
    creeTour(i + 1, horodatages[i] ?? iso(date, '14:02'), t.modele, t.agent, t.outil, t.libelle, {
      entree: Math.round(t.entreeK * 1000),
      sortie: Math.round(t.sortieK * 1000),
      cacheEcriture: Math.round(t.cacheEcritureK * 1000),
      cacheLecture: Math.round(t.cacheLectureK * 1000),
    }),
  );
  return {
    id: '4f2c9a1e',
    projet: 'ai-demo-2026',
    branche: 'feat/import-jsonl',
    debut: iso(date, '14:02'),
    fin: iso(date, '16:41'),
    tours,
  };
}

/* ── Les 14 autres sessions, calibrées pour compléter chaque projet ────────── */

interface TourGenerique {
  readonly modele: ModeleId;
  readonly cout: number;
  readonly agent: string;
  readonly outil: string;
  readonly libelle: string;
}

interface ConfigSessionGenerique {
  readonly id: string;
  readonly projet: string;
  readonly branche: string;
  readonly date: string;
  readonly debut: string;
  readonly fin: string;
  readonly tours: readonly TourGenerique[];
}

function construitSessionGenerique(config: ConfigSessionGenerique): Session {
  const horodatages = horodatagesEgalementRepartis(config.date, config.debut, config.fin, config.tours.length);
  const tours = config.tours.map((t, i) =>
    creeTour(
      i + 1,
      horodatages[i] ?? iso(config.date, config.debut),
      t.modele,
      t.agent,
      t.outil,
      t.libelle,
      usagePourCout(t.modele, t.cout),
    ),
  );
  return {
    id: config.id,
    projet: config.projet,
    branche: config.branche,
    debut: iso(config.date, config.debut),
    fin: iso(config.date, config.fin),
    tours,
  };
}

const CONFIGS_SESSIONS_GENERIQUES: readonly ConfigSessionGenerique[] = [
  // gcmt-backend-simulation — cible 112,4 $ (64,2 / 43,1 / 5,1 opus/sonnet/haiku)
  {
    id: 'a13cf902',
    projet: 'gcmt-backend-simulation',
    branche: 'feature/moteur-scenarios',
    date: '2026-09-02',
    debut: '09:15',
    fin: '10:55',
    tours: [
      { modele: 'claude-opus-5', cout: 22.47, agent: 'principal', outil: 'Edit', libelle: 'Modélisation du moteur de calcul des scénarios budgétaires' },
      { modele: 'claude-sonnet-5', cout: 15.085, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du diff service simulation' },
      { modele: 'claude-haiku-4-5', cout: 1.785, agent: 'node-dev', outil: 'Bash', libelle: 'npm test -w gcmt-backend-simulation-service' },
    ],
  },
  {
    id: 'b47e21d0',
    projet: 'gcmt-backend-simulation',
    branche: 'feature/liquibase-changelogs',
    date: '2026-09-03',
    debut: '11:00',
    fin: '12:35',
    tours: [
      { modele: 'claude-opus-5', cout: 17.976, agent: 'principal', outil: 'Write', libelle: 'Changelogs Liquibase du service simulation' },
      { modele: 'claude-sonnet-5', cout: 12.068, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du diff service simulation' },
      { modele: 'claude-haiku-4-5', cout: 1.428, agent: 'node-dev', outil: 'Bash', libelle: 'npm test -w gcmt-backend-simulation-service' },
    ],
  },
  {
    id: 'c58a30e1',
    projet: 'gcmt-backend-simulation',
    branche: 'fix/arrondi-projection',
    date: '2026-09-08',
    debut: '09:30',
    fin: '11:00',
    tours: [
      { modele: 'claude-opus-5', cout: 14.124, agent: 'principal', outil: 'Edit', libelle: 'Correction des arrondis de projection sur les scénarios longs' },
      { modele: 'claude-sonnet-5', cout: 9.482, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du diff service simulation' },
      { modele: 'claude-haiku-4-5', cout: 1.122, agent: 'node-dev', outil: 'Bash', libelle: 'npm test -w gcmt-backend-simulation-service' },
    ],
  },
  {
    id: 'd6912fb3',
    projet: 'gcmt-backend-simulation',
    branche: 'feature/export-pdf',
    date: '2026-09-09',
    debut: '13:10',
    fin: '14:40',
    tours: [
      { modele: 'claude-opus-5', cout: 9.63, agent: 'principal', outil: 'Write', libelle: 'Export PDF des rapports de simulation' },
      { modele: 'claude-sonnet-5', cout: 6.465, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du diff service simulation' },
      { modele: 'claude-haiku-4-5', cout: 0.765, agent: 'node-dev', outil: 'Bash', libelle: 'npm test -w gcmt-backend-simulation-service' },
    ],
  },
  // enerflex-demo3 — cible 68,2 $ (48,9 / 16,8 / 2,5)
  {
    id: 'e0917c4a',
    projet: 'enerflex-demo3',
    branche: 'feat/agents-workflow',
    date: '2026-09-01',
    debut: '10:00',
    fin: '11:30',
    tours: [
      { modele: 'claude-opus-5', cout: 22.005, agent: 'principal', outil: 'Write', libelle: 'Mise en place du workflow à 7 agents' },
      { modele: 'claude-sonnet-5', cout: 7.56, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du plan multi-agents' },
      { modele: 'claude-haiku-4-5', cout: 1.125, agent: 'node-dev', outil: 'Bash', libelle: 'npm run typecheck -w frontend' },
    ],
  },
  {
    id: 'f1a2b3c4',
    projet: 'enerflex-demo3',
    branche: 'feat/ui-verification-claude-chrome',
    date: '2026-09-07',
    debut: '15:00',
    fin: '16:35',
    tours: [
      { modele: 'claude-opus-5', cout: 16.137, agent: 'principal', outil: 'Edit', libelle: 'Bascule de la vérification UI vers Claude in Chrome' },
      { modele: 'claude-sonnet-5', cout: 5.544, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du plan multi-agents' },
      { modele: 'claude-haiku-4-5', cout: 0.825, agent: 'node-dev', outil: 'Bash', libelle: 'npm run typecheck -w frontend' },
    ],
  },
  {
    id: '0b3d5e6f',
    projet: 'enerflex-demo3',
    branche: 'chore/tokens-report',
    date: '2026-09-09',
    debut: '09:00',
    fin: '10:25',
    tours: [
      { modele: 'claude-opus-5', cout: 10.758, agent: 'principal', outil: 'Write', libelle: 'Suivi des tokens et rapport de démo' },
      { modele: 'claude-sonnet-5', cout: 3.696, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du plan multi-agents' },
      { modele: 'claude-haiku-4-5', cout: 0.55, agent: 'node-dev', outil: 'Bash', libelle: 'npm run typecheck -w frontend' },
    ],
  },
  // ai-demo-2026 — cible 54,8 $, dont 2,386 $ déjà portés par la session de référence
  {
    id: '7c2d9a11',
    projet: 'ai-demo-2026',
    branche: 'feat/plan-contrat-api',
    date: '2026-09-03',
    debut: '16:00',
    fin: '17:20',
    tours: [
      { modele: 'claude-opus-5', cout: 22.2939, agent: 'architecte', outil: 'Write', libelle: "Spécification du contrat d'API du Tokenomètre" },
      { modele: 'claude-sonnet-5', cout: 7.83996, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du plan et des tâches' },
      { modele: 'claude-haiku-4-5', cout: 1.31463, agent: 'node-dev', outil: 'Bash', libelle: 'npm run typecheck -w backend' },
    ],
  },
  {
    id: '8f4e5b22',
    projet: 'ai-demo-2026',
    branche: 'feat/ecran-budgets',
    date: '2026-09-10',
    debut: '10:30',
    fin: '11:55',
    tours: [
      { modele: 'claude-opus-5', cout: 14.8626, agent: 'react-dev', outil: 'Edit', libelle: 'Écran Budgets & alertes côté frontend' },
      { modele: 'claude-sonnet-5', cout: 5.22664, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du diff frontend' },
      { modele: 'claude-haiku-4-5', cout: 0.87642, agent: 'react-dev', outil: 'Bash', libelle: 'npm run typecheck -w frontend' },
    ],
  },
  // audit_code — cible 41,1 $ (28,7 / 10,1 / 2,3)
  {
    id: '9a1b2c3d',
    projet: 'audit_code',
    branche: 'main',
    date: '2026-09-04',
    debut: '08:45',
    fin: '10:10',
    tours: [
      { modele: 'claude-opus-5', cout: 17.22, agent: 'principal', outil: 'Read', libelle: 'Audit Java du module de facturation' },
      { modele: 'claude-sonnet-5', cout: 6.06, agent: 'reviewer', outil: 'Write', libelle: 'Synthèse des constats' },
      { modele: 'claude-haiku-4-5', cout: 1.38, agent: 'node-dev', outil: 'Bash', libelle: 'Vérification des règles de style' },
    ],
  },
  {
    id: 'ab2c3d4e',
    projet: 'audit_code',
    branche: 'feature/rapport-bilingue',
    date: '2026-09-08',
    debut: '14:00',
    fin: '15:25',
    tours: [
      { modele: 'claude-opus-5', cout: 11.48, agent: 'principal', outil: 'Write', libelle: 'Génération du rapport HTML bilingue' },
      { modele: 'claude-sonnet-5', cout: 4.04, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du rapport' },
      { modele: 'claude-haiku-4-5', cout: 0.92, agent: 'node-dev', outil: 'Bash', libelle: 'Vérification des règles de style' },
    ],
  },
  // synapse — cible 22,9 $ (16,1 / 5,9 / 0,9)
  {
    id: 'bc3d4e5f',
    projet: 'synapse',
    branche: 'main',
    date: '2026-09-06',
    debut: '09:00',
    fin: '10:15',
    tours: [
      { modele: 'claude-opus-5', cout: 9.66, agent: 'principal', outil: 'Read', libelle: 'Exploration du graphe de connaissances' },
      { modele: 'claude-sonnet-5', cout: 3.54, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du modèle de graphe' },
      { modele: 'claude-haiku-4-5', cout: 0.54, agent: 'node-dev', outil: 'Bash', libelle: 'Scripts de vérification du graphe' },
    ],
  },
  {
    id: 'cd4e5f60',
    projet: 'synapse',
    branche: 'feat/export-graphe',
    date: '2026-09-10',
    debut: '15:30',
    fin: '16:50',
    tours: [
      { modele: 'claude-opus-5', cout: 6.44, agent: 'principal', outil: 'Write', libelle: 'Export du graphe vers le format cible' },
      { modele: 'claude-sonnet-5', cout: 2.36, agent: 'reviewer', outil: 'Read', libelle: 'Relecture du modèle de graphe' },
      { modele: 'claude-haiku-4-5', cout: 0.36, agent: 'node-dev', outil: 'Bash', libelle: 'Scripts de vérification du graphe' },
    ],
  },
  // divers / hors projet — cible 14,6 $ (9,3 / 4,1 / 1,2)
  {
    id: 'de5f6071',
    projet: 'divers / hors projet',
    branche: '(hors dépôt)',
    date: '2026-09-05',
    debut: '12:00',
    fin: '12:45',
    tours: [
      { modele: 'claude-opus-5', cout: 9.3, agent: 'principal', outil: 'Bash', libelle: 'Session ponctuelle hors dépôt suivi' },
      { modele: 'claude-sonnet-5', cout: 4.1, agent: 'principal', outil: 'Read', libelle: 'Consultation rapide de documentation' },
      { modele: 'claude-haiku-4-5', cout: 1.2, agent: 'principal', outil: 'WebSearch', libelle: 'Recherche ponctuelle' },
    ],
  },
];

/** Les 15 sessions du jeu d'exemple : la session de référence + les 14 calibrées. */
export const sessionsExemple: readonly Session[] = [
  construitSessionReference(),
  ...CONFIGS_SESSIONS_GENERIQUES.map(construitSessionGenerique),
];

/* ── Budgets — repris de `Budgets.dc.html` (méthode `base()` et son `state`) ── */

// Convention retenue pour relier un budget à des sessions (le service qui
// orchestre `depot.budgets()` et `depot.sessions()` s'appuie dessus) :
// - `portee` commençant par « organisation » : la somme de toutes les sessions.
// - sinon : la somme des sessions dont `projet === budget.id`.
// Les seuils actifs de la maquette (state.seuils) sont 80/90/100 (50 est
// désactivé) ; les canaux actifs sont mail et Slack (le blocage dur est éteint).
export const budgetsExemple: readonly Budget[] = [
  {
    id: 'equipe-avv',
    nom: 'Équipe AVV',
    portee: 'organisation',
    plafond: 1200,
    seuils: [80, 90, 100],
    canaux: ['mail', 'slack'],
    min: 400,
    max: 2400,
    pas: 50,
    modifieLe: '2026-09-01T09:00:00Z',
    modifiePar: 'stephane',
  },
  {
    id: 'gcmt-backend-simulation',
    nom: 'gcmt — Stellantis',
    portee: 'projet · refacturé',
    plafond: 400,
    seuils: [80, 90, 100],
    canaux: ['mail', 'slack'],
    min: 100,
    max: 900,
    pas: 25,
    modifieLe: '2026-09-05T08:30:00Z',
    modifiePar: 'stephane',
  },
  {
    id: 'ai-demo-2026',
    nom: 'ai-demo-2026',
    portee: 'projet · interne',
    plafond: 150,
    seuils: [80, 90, 100],
    canaux: ['mail', 'slack'],
    min: 50,
    max: 400,
    pas: 10,
    modifieLe: '2026-09-01T09:00:00Z',
    modifiePar: 'stephane',
  },
  {
    id: 'audit_code',
    nom: 'audit_code',
    portee: 'projet · interne',
    plafond: 60,
    seuils: [80, 90, 100],
    canaux: ['mail', 'slack'],
    min: 20,
    max: 250,
    pas: 5,
    modifieLe: '2026-09-08T09:00:00Z',
    modifiePar: 'stephane',
  },
  {
    id: 'synapse',
    nom: 'synapse',
    portee: 'projet · R&D',
    plafond: 25,
    seuils: [80, 90, 100],
    canaux: ['mail', 'slack'],
    min: 10,
    max: 150,
    pas: 5,
    modifieLe: '2026-09-01T09:00:00Z',
    modifiePar: 'stephane',
  },
];

/* ── Alertes — reprises de `Budgets.dc.html` (liste `alertes`) ─────────────── */

export const alertesExemple: readonly Alerte[] = [
  {
    id: 'alerte-synapse-90',
    horodatage: '2026-09-10T09:14:00Z',
    budgetId: 'synapse',
    severite: 'critique',
    texte: 'synapse a franchi 90 % de son plafond (22,90 $ / 25 $).',
  },
  {
    id: 'alerte-audit-code-80',
    horodatage: '2026-09-09T18:02:00Z',
    budgetId: 'audit_code',
    severite: 'limite',
    texte: 'audit_code a franchi 80 % — projection 58 $ sur 60 $.',
  },
  {
    id: 'alerte-equipe-avv-projection',
    horodatage: '2026-09-08T11:40:00Z',
    budgetId: 'equipe-avv',
    severite: 'info',
    texte: 'Équipe AVV : projection révisée à 942 $ (+18 % en 3 jours).',
  },
  {
    id: 'alerte-gcmt-plafond',
    horodatage: '2026-09-05T08:30:00Z',
    budgetId: 'gcmt-backend-simulation',
    severite: 'reglage',
    texte: 'gcmt — Stellantis : plafond porté de 300 $ à 400 $.',
  },
];
