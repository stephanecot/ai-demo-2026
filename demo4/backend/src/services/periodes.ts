import { RequeteInvalide } from '../erreurs.js';
import type { Cycle } from '../types.js';

/**
 * Bornes, cycle en cours et validation de dates pour toutes les routes qui
 * acceptent `debut`/`fin`. Aucune horloge cachée : la date « aujourd'hui »
 * est toujours un paramètre, avec une valeur par défaut lisible.
 *
 * Le jeu d'exemple (`data/jeu-exemple.ts`) vit du 1er au 10 septembre 2026.
 * `AUJOURD_HUI_PAR_DEFAUT` vaut donc `2026-09-10` : c'est le dernier jour de
 * données du jeu d'exemple, ce qui place le cycle par défaut (le mois
 * calendaire de septembre 2026, jour 10 sur 30) exactement sur des données
 * réelles du jeu, sans dépendre de la date système — les tests et le mode
 * « exemple » restent donc déterministes indéfiniment.
 */
export const AUJOURD_HUI_PAR_DEFAUT = '2026-09-10';

const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `true` si `date` est une chaîne `AAAA-MM-JJ` qui correspond à un jour calendaire réel. */
export function estDateValide(date: string): boolean {
  if (!RE_DATE.test(date)) return false;
  const temps = new Date(`${date}T00:00:00Z`).getTime();
  if (Number.isNaN(temps)) return false;
  return new Date(temps).toISOString().slice(0, 10) === date;
}

/** Valide une date `AAAA-MM-JJ` ; lève une erreur 400 en français sinon. */
export function validerDate(date: string, nomChamp: string): string {
  if (!estDateValide(date)) {
    throw new RequeteInvalide(`Le paramètre « ${nomChamp} » doit être une date valide au format AAAA-MM-JJ.`);
  }
  return date;
}

function annee(date: string): number {
  return Number(date.slice(0, 4));
}

function mois(date: string): number {
  return Number(date.slice(5, 7));
}

function jourDuMois(date: string): number {
  return Number(date.slice(8, 10));
}

function joursDansLeMois(a: number, m: number): number {
  // Jour 0 du mois suivant = dernier jour du mois `m`.
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

/** Le cycle calendaire (mois) contenant `aujourdHui`. `jour` est 1-based. */
export function cycleEnCours(aujourdHui: string = AUJOURD_HUI_PAR_DEFAUT): Cycle {
  validerDate(aujourdHui, 'aujourd’hui');
  const a = annee(aujourdHui);
  const m = mois(aujourdHui);
  const jours = joursDansLeMois(a, m);
  const prefixe = aujourdHui.slice(0, 7); // 'AAAA-MM'
  return {
    debut: `${prefixe}-01`,
    fin: `${prefixe}-${String(jours).padStart(2, '0')}`,
    jour: jourDuMois(aujourdHui),
    jours,
  };
}

/**
 * Bornes d'une période à partir de `debut`/`fin` (tous deux inclusifs) :
 * absents tous les deux, la période vaut le cycle en cours ; fournis, ils
 * doivent être valides et `fin` ne peut pas précéder `debut`.
 */
export function bornesPeriode(
  debut: string | undefined,
  fin: string | undefined,
  aujourdHui: string = AUJOURD_HUI_PAR_DEFAUT,
): { debut: string; fin: string } {
  if (debut === undefined && fin === undefined) {
    const cycle = cycleEnCours(aujourdHui);
    return { debut: cycle.debut, fin: cycle.fin };
  }
  if (debut === undefined || fin === undefined) {
    throw new RequeteInvalide('Les paramètres « debut » et « fin » doivent être fournis ensemble.');
  }
  validerDate(debut, 'debut');
  validerDate(fin, 'fin');
  if (fin < debut) {
    throw new RequeteInvalide('Le paramètre « fin » doit être postérieur ou égal à « debut ».');
  }
  return { debut, fin };
}

function versDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function versChaine(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Durée d'une période inclusive, en jours (`debut` === `fin` vaut 1 jour). */
export function dureeEnJours(debut: string, fin: string): number {
  const diff = versDate(fin).getTime() - versDate(debut).getTime();
  return Math.round(diff / 86_400_000) + 1;
}

/** La période de même durée qui précède immédiatement `[debut, fin]`. */
export function periodePrecedente(debut: string, fin: string): { debut: string; fin: string } {
  const duree = dureeEnJours(debut, fin);
  const finPrecedente = versDate(debut);
  finPrecedente.setUTCDate(finPrecedente.getUTCDate() - 1);
  const debutPrecedent = new Date(finPrecedente);
  debutPrecedent.setUTCDate(debutPrecedent.getUTCDate() - (duree - 1));
  return { debut: versChaine(debutPrecedent), fin: versChaine(finPrecedente) };
}

/**
 * Nombre de jours de `[debut, fin]` déjà écoulés au regard de `aujourdHui` :
 * 0 si la période n'a pas commencé, la durée complète si elle est déjà
 * terminée, sinon le nombre de jours jusqu'à `aujourdHui` inclus.
 */
export function joursEcoules(debut: string, fin: string, aujourdHui: string = AUJOURD_HUI_PAR_DEFAUT): number {
  if (aujourdHui < debut) return 0;
  const borne = aujourdHui < fin ? aujourdHui : fin;
  return dureeEnJours(debut, borne);
}
