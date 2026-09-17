import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModeleId, Session, Tour, Usage } from '../types.js';

/**
 * Parseur `.jsonl` tolérant des transcripts Claude Code. Aucun calcul de coût
 * ici : on ne fait que lire quatre compteurs de tokens et les identifiants
 * qui permettent de reconstituer des `Session`/`Tour`. Une ligne illisible ou
 * incomplète ne fait jamais tomber l'import : elle est comptée dans
 * `lignesIgnorees` et l'import continue.
 */

export interface RapportLecture {
  readonly sessions: Session[];
  readonly fichiersLus: number;
  readonly lignesLues: number;
  readonly lignesIgnorees: number;
}

// Les transcripts écrivent le nom de version complet du modèle (par exemple
// « claude-opus-5-20260815 »). On rattache au préfixe connu le plus proche —
// le préfixe suffit à identifier la famille de tarifs à appliquer, la date de
// snapshot n'a pas d'incidence sur le prix. Si aucun préfixe connu ne
// correspond (nouveau modèle non encore tarifé, ou ligne corrompue), la ligne
// est ignorée plutôt que de fausser un coût avec un tarif arbitraire.
const PREFIXES_CONNUS: readonly ModeleId[] = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'];

function modeleConnu(brut: unknown): ModeleId | undefined {
  if (typeof brut !== 'string') return undefined;
  return PREFIXES_CONNUS.find((prefixe) => brut.startsWith(prefixe));
}

interface BlocContenu {
  readonly type?: unknown;
  readonly name?: unknown;
  readonly text?: unknown;
}

interface UsageBrut {
  readonly input_tokens?: unknown;
  readonly output_tokens?: unknown;
  readonly cache_creation_input_tokens?: unknown;
  readonly cache_read_input_tokens?: unknown;
}

interface MessageBrut {
  readonly model?: unknown;
  readonly usage?: UsageBrut;
  readonly content?: unknown;
}

interface LigneBrute {
  readonly sessionId?: unknown;
  readonly timestamp?: unknown;
  readonly cwd?: unknown;
  readonly gitBranch?: unknown;
  readonly message?: MessageBrut;
}

function nombrePositif(valeur: unknown): number | undefined {
  return typeof valeur === 'number' && Number.isFinite(valeur) && valeur >= 0 ? valeur : undefined;
}

/** Dernier segment d'un `cwd` : sert de nom de projet quand aucun autre n'est fourni. */
function nomProjetDepuisCwd(cwd: string): string {
  const segments = cwd.split(/[\\/]/).filter((s) => s.length > 0);
  return segments[segments.length - 1] ?? 'projet-inconnu';
}

function extraisContenu(message: MessageBrut | undefined): BlocContenu[] {
  const contenu = message?.content;
  return Array.isArray(contenu) ? (contenu as BlocContenu[]) : [];
}

/** Le nom du premier outil appelé dans ce tour, ou « reponse » si aucun. */
function outilDe(message: MessageBrut | undefined): string {
  const appel = extraisContenu(message).find((b) => b.type === 'tool_use');
  return typeof appel?.name === 'string' ? appel.name : 'reponse';
}

/** Un libellé lisible et court pour le tour : premier texte, sinon le nom de l'outil. */
function libelleDe(message: MessageBrut | undefined): string {
  const blocs = extraisContenu(message);
  const texte = blocs.find((b) => b.type === 'text');
  if (typeof texte?.text === 'string' && texte.text.trim().length > 0) {
    return texte.text.trim().slice(0, 120);
  }
  const appel = blocs.find((b) => b.type === 'tool_use');
  if (typeof appel?.name === 'string') return `Appel ${appel.name}`;
  return 'Tour sans texte';
}

interface TourLu {
  readonly sessionId: string;
  readonly projet: string;
  readonly branche: string;
  readonly tour: Tour;
}

/** Tente de lire une ligne ; renvoie `undefined` si elle est illisible ou incomplète. */
function essaieDeLireLigne(ligne: string): TourLu | undefined {
  let brut: unknown;
  try {
    brut = JSON.parse(ligne);
  } catch {
    return undefined;
  }
  if (typeof brut !== 'object' || brut === null) return undefined;
  const l = brut as LigneBrute;

  const usageBrut = l.message?.usage;
  if (usageBrut === undefined) return undefined;

  const entree = nombrePositif(usageBrut.input_tokens);
  const sortie = nombrePositif(usageBrut.output_tokens);
  if (entree === undefined || sortie === undefined) return undefined;
  const cacheEcriture = nombrePositif(usageBrut.cache_creation_input_tokens) ?? 0;
  const cacheLecture = nombrePositif(usageBrut.cache_read_input_tokens) ?? 0;

  const modele = modeleConnu(l.message?.model);
  if (modele === undefined) return undefined;

  const sessionId = typeof l.sessionId === 'string' ? l.sessionId : undefined;
  const horodatage = typeof l.timestamp === 'string' ? l.timestamp : undefined;
  if (sessionId === undefined || horodatage === undefined) return undefined;

  const projet = typeof l.cwd === 'string' ? nomProjetDepuisCwd(l.cwd) : 'projet-inconnu';
  const branche = typeof l.gitBranch === 'string' ? l.gitBranch : '';

  const usage: Usage = { entree, sortie, cacheEcriture, cacheLecture };
  const tour: Tour = {
    index: 0, // repli sans signification : réattribué après tri par session
    horodatage,
    modele,
    agent: 'principal', // le transcript brut ne porte pas d'identifiant d'agent, voir l'en-tête du fichier
    outil: outilDe(l.message),
    libelle: libelleDe(l.message),
    usage,
  };
  return { sessionId, projet, branche, tour };
}

async function listeFichiersJsonl(dossier: string): Promise<string[]> {
  const entrees = await readdir(dossier, { withFileTypes: true });
  const fichiers: string[] = [];
  for (const entree of entrees) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      fichiers.push(...(await listeFichiersJsonl(chemin)));
    } else if (entree.isFile() && entree.name.endsWith('.jsonl')) {
      fichiers.push(chemin);
    }
  }
  return fichiers;
}

interface GroupeSession {
  projet: string;
  branche: string;
  tours: Tour[];
}

/**
 * Lit récursivement tous les `.jsonl` d'un dossier et reconstitue les
 * sessions. Un dossier absent ou illisible renvoie un rapport vide plutôt que
 * de lever une exception : c'est au service appelant de décider si c'est une
 * erreur (dossier configuré mais introuvable) ou un simple « rien à lire ».
 */
export async function litDossierTranscripts(dossier: string): Promise<RapportLecture> {
  let fichiers: string[];
  try {
    fichiers = await listeFichiersJsonl(dossier);
  } catch {
    return { sessions: [], fichiersLus: 0, lignesLues: 0, lignesIgnorees: 0 };
  }

  const parSession = new Map<string, GroupeSession>();
  let lignesLues = 0;
  let lignesIgnorees = 0;

  for (const fichier of fichiers) {
    const contenu = await readFile(fichier, 'utf-8');
    const lignes = contenu.split('\n').filter((l) => l.trim().length > 0);
    for (const ligne of lignes) {
      lignesLues += 1;
      const lu = essaieDeLireLigne(ligne);
      if (lu === undefined) {
        lignesIgnorees += 1;
        continue;
      }
      const groupe = parSession.get(lu.sessionId) ?? { projet: lu.projet, branche: lu.branche, tours: [] };
      groupe.tours.push(lu.tour);
      parSession.set(lu.sessionId, groupe);
    }
  }

  const sessions: Session[] = [...parSession.entries()].map(([id, groupe]) => {
    const toursTries = [...groupe.tours]
      .sort((a, b) => a.horodatage.localeCompare(b.horodatage))
      .map((t, i) => ({ ...t, index: i + 1 }));
    const premier = toursTries[0];
    const dernier = toursTries[toursTries.length - 1];
    return {
      id,
      projet: groupe.projet,
      branche: groupe.branche,
      debut: premier?.horodatage ?? '',
      fin: dernier?.horodatage ?? '',
      tours: toursTries,
    };
  });

  return { sessions, fichiersLus: fichiers.length, lignesLues, lignesIgnorees };
}
