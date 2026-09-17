import { arrondi } from './tarifs.js';
import type { EtatBudget } from '../types.js';

/**
 * Règles pures de l'état d'un budget. Rien ici ne lit d'horloge ni de session :
 * `plafond`, `consomme` et `projection` sont fournis par le service qui
 * orchestre les données (sessions du dépôt + `projection` de `agregation.ts`).
 * Les seuils (0,7 / 0,95 / 1,1) et la formulation du verdict reprennent à la
 * lettre `design/Budgets.dc.html` (méthode `etat()` et le champ `verdict`).
 */

const SEUIL_SURVEILLANCE = 0.7;
const SEUIL_LIMITE = 0.95;
const SEUIL_DEPASSEMENT = 1.1;

/**
 * Ratio projection / plafond. Un plafond nul ou négatif n'a pas de sens
 * métier (un budget mal configuré) : on le traite comme un dépassement
 * certain plutôt que de diviser par zéro.
 */
export function ratioProjection(projection: number, plafond: number): number {
  if (plafond <= 0) return Number.POSITIVE_INFINITY;
  return projection / plafond;
}

/** État d'un budget selon le ratio projection / plafond — mêmes seuils que la maquette. */
export function etatBudget(projection: number, plafond: number): EtatBudget {
  const ratio = ratioProjection(projection, plafond);
  if (ratio < SEUIL_SURVEILLANCE) return 'dans-le-budget';
  if (ratio < SEUIL_LIMITE) return 'a-surveiller';
  if (ratio < SEUIL_DEPASSEMENT) return 'limite-atteinte';
  return 'depassement-prevu';
}

/** Seuils d'alerte (en %) déjà franchis par la projection actuelle, triés croissants. */
export function seuilsFranchis(seuils: readonly number[], projection: number, plafond: number): number[] {
  const pct = ratioProjection(projection, plafond) * 100;
  return [...seuils].filter((s) => pct >= s).sort((a, b) => a - b);
}

/** Ce qu'il reste avant le plafond, au consommé réel — peut être négatif (dépassement). */
export function resteBudget(plafond: number, consomme: number): number {
  return arrondi(plafond - consomme);
}

/** Part du plafond déjà consommée, bornée à 100 pour la jauge (le vrai dépassement se lit dans `reste`). */
export function pctConsomme(consomme: number, plafond: number): number {
  if (plafond <= 0) return 100;
  return Math.min(100, arrondiPourcent((consomme / plafond) * 100));
}

/** Part du plafond que vise la projection, bornée à 100 pour la jauge. */
export function pctProjection(projection: number, plafond: number): number {
  if (plafond <= 0) return 100;
  return Math.min(100, arrondiPourcent((projection / plafond) * 100));
}

function arrondiPourcent(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Formate un montant comme le reste du produit : virgule décimale, espace
 * fine insécable pour les milliers. Ce n'est pas une formule de prix — juste
 * la mise en forme du texte du verdict, qui doit arriver déjà en français.
 */
function formateMontant(n: number, decimales: number): string {
  const valeur = Number(n.toFixed(decimales));
  const [entier, decimale] = Math.abs(valeur).toFixed(decimales).split('.');
  const entierGroupe = (entier ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const signe = valeur < 0 ? '-' : '';
  return decimale === undefined ? `${signe}${entierGroupe}` : `${signe}${entierGroupe},${decimale}`;
}

/**
 * La phrase du panneau de droite de `Budgets.dc.html`, dans ses deux
 * variantes : projection au-dessus ou en dessous (ou égale) au plafond.
 * Formulation reprise à l'identique.
 */
export function verdictBudget(params: {
  readonly plafond: number;
  readonly consomme: number;
  readonly projection: number;
}): string {
  const { plafond, consomme, projection } = params;
  const ratio = ratioProjection(projection, plafond);
  const reste = resteBudget(plafond, consomme);
  if (ratio > 1) {
    const depassement = (ratio - 1) * 100;
    return (
      `Au rythme actuel, le cycle se termine à ${formateMontant(projection, 0)} $, soit ` +
      `${formateMontant(depassement, 0)} % au-dessus du plafond. Il reste ${formateMontant(reste, 2)} $ avant blocage.`
    );
  }
  const pct = ratio * 100;
  const marge = plafond - projection;
  return (
    `Au rythme actuel, le cycle se termine à ${formateMontant(projection, 0)} $, soit ` +
    `${formateMontant(pct, 0)} % du plafond. Marge restante : ${formateMontant(marge, 0)} $.`
  );
}
