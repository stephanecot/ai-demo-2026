/**
 * Délai relatif court pour la mention « modifié … par … » du panneau de
 * réglage. Purement présentationnel — une différence de dates, comme
 * `minutesEcoulees` dans `BarreLaterale` — jamais une règle métier.
 */
const MS_PAR_JOUR = 86_400_000;

/** « aujourd'hui », « il y a 1 j », « il y a N j », à partir d'un horodatage ISO. */
export function delaiRelatifJours(iso: string): string {
  const jours = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / MS_PAR_JOUR));
  if (jours === 0) {
    return "aujourd'hui";
  }
  if (jours === 1) {
    return 'il y a 1 j';
  }
  return `il y a ${jours} j`;
}
