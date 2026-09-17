import { statSync } from 'node:fs';
import { alertesExemple, budgetsExemple, sessionsExemple } from '../data/jeu-exemple.js';
import { Introuvable, RequeteInvalide } from '../erreurs.js';
import { litDossierTranscripts } from '../transcripts/lecture.js';
import type { Alerte, Budget, Session } from '../types.js';

/**
 * Le port unique du produit : décide de la source de données (jeu d'exemple
 * par défaut, ou transcripts réels si `TOKENOMETRE_TRANSCRIPTS` désigne un
 * dossier lisible) et l'expose à travers une poignée de fonctions. Aucune
 * route ni aucun autre service ne doit lire `process.env` ou le système de
 * fichiers directement : tout passe par ici.
 *
 * On ne lit jamais `~/.claude/` par défaut, et on n'y écrit jamais : ce
 * module ne fait que lire le dossier explicitement désigné par la variable
 * d'environnement.
 */

export type SourceDonnees = 'exemple' | 'transcripts';

interface EtatDepot {
  readonly source: SourceDonnees;
  readonly sessions: readonly Session[];
  readonly synchro: string; // ISO — instant où cet état a été chargé
  readonly budgets: Budget[]; // mutable en mémoire : c'est la cible du PATCH
  readonly alertes: readonly Alerte[];
}

function dossierTranscritsConfigure(): string | undefined {
  const chemin = process.env['TOKENOMETRE_TRANSCRIPTS'];
  if (chemin === undefined || chemin.trim() === '') return undefined;
  try {
    return statSync(chemin).isDirectory() ? chemin : undefined;
  } catch {
    return undefined;
  }
}

async function charge(): Promise<EtatDepot> {
  const dossier = dossierTranscritsConfigure();
  if (dossier === undefined) {
    return {
      source: 'exemple',
      sessions: sessionsExemple,
      synchro: new Date().toISOString(),
      budgets: budgetsExemple.map((b) => ({ ...b })),
      alertes: alertesExemple,
    };
  }
  const rapport = await litDossierTranscripts(dossier);
  return {
    source: 'transcripts',
    sessions: rapport.sessions,
    synchro: new Date().toISOString(),
    // Les budgets restent ceux configurés pour l'organisation même en mode
    // transcripts : ce ne sont pas des données lues depuis les `.jsonl`.
    budgets: budgetsExemple.map((b) => ({ ...b })),
    // Un vrai dossier de transcripts n'a pas d'historique d'alertes : il n'y
    // a rien à rejouer tant qu'un service de surveillance ne les régénère pas.
    alertes: [],
  };
}

let etatCharge: Promise<EtatDepot> | undefined;

function obtientEtat(): Promise<EtatDepot> {
  etatCharge ??= charge();
  return etatCharge;
}

export async function sessions(): Promise<readonly Session[]> {
  return (await obtientEtat()).sessions;
}

export async function budgets(): Promise<readonly Budget[]> {
  return (await obtientEtat()).budgets;
}

export async function alertes(): Promise<readonly Alerte[]> {
  return (await obtientEtat()).alertes;
}

export async function source(): Promise<SourceDonnees> {
  return (await obtientEtat()).source;
}

export async function synchro(): Promise<string> {
  return (await obtientEtat()).synchro;
}

export interface ModificationsBudget {
  readonly plafond?: number;
  readonly seuils?: readonly number[];
  readonly canaux?: readonly string[];
}

/** Met à jour un budget en mémoire (le `PATCH`). Valide le plafond contre `min`/`max`. */
export async function metAJourBudget(id: string, modifications: ModificationsBudget): Promise<Budget> {
  const etat = await obtientEtat();
  const index = etat.budgets.findIndex((b) => b.id === id);
  const existant = index === -1 ? undefined : etat.budgets[index];
  if (existant === undefined) {
    throw new Introuvable(`Aucun budget ne correspond à l'identifiant « ${id} ».`);
  }
  if (modifications.plafond !== undefined) {
    if (modifications.plafond < existant.min || modifications.plafond > existant.max) {
      throw new RequeteInvalide(
        `Le plafond doit être compris entre ${existant.min} et ${existant.max} pour ce budget.`,
      );
    }
  }
  const misAJour: Budget = {
    ...existant,
    plafond: modifications.plafond ?? existant.plafond,
    seuils: modifications.seuils ?? existant.seuils,
    canaux: modifications.canaux ?? existant.canaux,
    modifieLe: new Date().toISOString(),
  };
  etat.budgets[index] = misAJour;
  return misAJour;
}

/**
 * Réinitialise l'état chargé en mémoire. Réservé aux tests : entre deux cas
 * qui changent `TOKENOMETRE_TRANSCRIPTS` ou qui vérifient le `PATCH`, on ne
 * veut pas réutiliser l'état chargé par un test précédent.
 */
export function reinitialisePourLesTests(): void {
  etatCharge = undefined;
}
