/**
 * Bornes de période pour le filtre de la liste des sessions.
 *
 * Calcul de dates uniquement — aucun tarif, aucun coût, aucune multiplication :
 * la règle d'or du produit ne concerne pas cette arithmétique de calendrier.
 */

export interface BornesPeriode {
  readonly debut: string;
  readonly fin: string;
}

function auFormatIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Les `jours` derniers jours, bornes inclusives, jusqu'à aujourd'hui (UTC). */
export function derniersJours(jours: number): BornesPeriode {
  const fin = new Date();
  const debut = new Date(fin);
  debut.setUTCDate(debut.getUTCDate() - (jours - 1));
  return { debut: auFormatIso(debut), fin: auFormatIso(fin) };
}
