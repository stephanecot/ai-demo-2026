/**
 * Calcul des bornes de période à partir de la sélection de l'écran.
 *
 * Aucun calcul de coût ici : uniquement de l'arithmétique de dates (aligner
 * une fenêtre de 7, 10 ou 30 jours, ou un trimestre, sur la dernière journée
 * réellement chargée) et des seuils de pourcentage déjà calculés par le
 * backend (`Resume.partPlafond`) pour choisir une tonalité d'état.
 *
 * `ClePeriode` et `Unite` reprennent les clés de `TABLEAU_DE_BORD.segmentPeriodes`
 * et `TABLEAU_DE_BORD.segmentUnites` dans `src/labels.ts`.
 */
import type { ParametresPeriode } from '../../api/resume';
import type { Resume } from '../../types/api';

export type ClePeriode = '7j' | '10j' | '30j' | 'trimestre';
export type Unite = 'cout' | 'tokens';

/** Décale une date `AAAA-MM-JJ` de `deltaJours` (peut être négatif), en UTC. */
export function decaleDate(date: string, deltaJours: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaJours);
  return d.toISOString().slice(0, 10);
}

/** Bornes du trimestre calendaire contenant `ancre`. */
export function bornesTrimestre(ancre: string): { debut: string; fin: string } {
  const annee = Number(ancre.slice(0, 4));
  const mois = Number(ancre.slice(5, 7));
  const premierMois = Math.floor((mois - 1) / 3) * 3 + 1;
  const debut = `${annee}-${String(premierMois).padStart(2, '0')}-01`;
  // Jour 0 du mois suivant le dernier mois du trimestre = son dernier jour.
  const finDate = new Date(Date.UTC(annee, premierMois + 2, 0));
  return { debut, fin: finDate.toISOString().slice(0, 10) };
}

/**
 * La dernière journée pour laquelle le résumé porte une donnée réelle — sert
 * d'ancre « aujourd'hui » pour les périodes glissantes (7 j, 30 j, trimestre).
 * À défaut de jour dans `parJour`, on retombe sur la borne de fin du résumé.
 */
export function dernierJourDonnees(resume: Resume | undefined): string | undefined {
  if (!resume) {
    return undefined;
  }
  return resume.parJour.at(-1)?.date ?? resume.fin;
}

/**
 * Traduit la période sélectionnée en bornes `debut`/`fin` pour l'API.
 * « 10j » (CE MOIS) et toute période dont l'ancre n'est pas encore connue
 * omettent les bornes : le backend retombe alors sur le cycle en cours.
 */
export function bornesPourPeriode(cle: ClePeriode, ancre: string | undefined): ParametresPeriode {
  if (cle === '10j' || ancre === undefined) {
    return {};
  }
  if (cle === '7j') {
    return { debut: decaleDate(ancre, -6), fin: ancre };
  }
  if (cle === '30j') {
    return { debut: decaleDate(ancre, -29), fin: ancre };
  }
  return bornesTrimestre(ancre);
}

/** Une clé stable identifiant une paire de bornes, pour détecter un vrai changement de période. */
export function cleBornes(bornes: ParametresPeriode): string {
  return `${bornes.debut ?? ''}|${bornes.fin ?? ''}`;
}

/** Les quatre états d'un budget (§ tokens.md), à partir d'un pourcentage déjà calculé par le backend. */
export type EtatSeuil = 'ok' | 'vigilance' | 'limite' | 'depassement';

export function etatDepuisPourcentage(pct: number): EtatSeuil {
  if (pct > 110) {
    return 'depassement';
  }
  if (pct >= 95) {
    return 'limite';
  }
  if (pct >= 70) {
    return 'vigilance';
  }
  return 'ok';
}
