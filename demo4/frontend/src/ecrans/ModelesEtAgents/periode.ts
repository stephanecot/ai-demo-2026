/**
 * Sélecteur de période local à l'écran « Modèles & agents ».
 *
 * Aucune maquette ne fixe les bornes de cet écran (§1 du plan) : on retient
 * trois choix simples — le cycle de facturation en cours (comportement par
 * défaut de l'API quand `debut`/`fin` sont absents) et deux fenêtres glissantes.
 * Aucun calcul de coût ici, seulement des bornes de date.
 */
import type { ParametresPeriode } from '../../api/resume';
import type { OptionSegment } from '../../components/ui';

export type PeriodeCode = 'cycle' | '7j' | '30j';

const JOURS_PAR_CODE: Readonly<Record<Exclude<PeriodeCode, 'cycle'>, number>> = {
  '7j': 7,
  '30j': 30,
};

/** Date ISO `YYYY-MM-DD`, en UTC, sans l'heure. */
function versDateJour(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Bornes `debut`/`fin` (inclusives) pour un code de période. `'cycle'` renvoie
 * un objet vide : l'API retombe alors sur le cycle de facturation en cours.
 * `reference` sert de « aujourd'hui » pour les tests.
 */
export function calculeBornes(code: PeriodeCode, reference: Date = new Date()): ParametresPeriode {
  if (code === 'cycle') {
    return {};
  }
  const jours = JOURS_PAR_CODE[code];
  const fin = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const debut = new Date(fin);
  debut.setUTCDate(debut.getUTCDate() - (jours - 1));
  return { debut: versDateJour(debut), fin: versDateJour(fin) };
}

export const OPTIONS_PERIODE: readonly OptionSegment<PeriodeCode>[] = [
  { valeur: 'cycle', libelle: 'CYCLE' },
  { valeur: '7j', libelle: '7 J' },
  { valeur: '30j', libelle: '30 J' },
];

export const MICRO_LABEL_PERIODE: Readonly<Record<PeriodeCode, string>> = {
  cycle: 'cycle en cours',
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
};
