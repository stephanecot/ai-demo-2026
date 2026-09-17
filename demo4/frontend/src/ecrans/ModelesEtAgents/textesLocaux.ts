/**
 * Textes propres à l'écran « Modèles & agents ».
 *
 * `src/labels.ts` porte déjà `MODELES_ET_AGENTS` (titres, colonnes communes) ;
 * ce fichier complète ce qui manquait pour composer l'écran sans toucher à un
 * fichier hors du périmètre de cette mission (voir le rapport de mission).
 * À rapatrier dans `src/labels.ts` par qui en a la charge.
 */
export const TEXTES_MODELES = {
  microLabelDefaut: 'Modèles & agents',
  periodeAccessible: 'Période affichée',
  colonneRepartition: 'Répartition par modèle',
  colonneEconomie: 'Économie Sonnet 5 $',
  colonnePart: 'Part',
  libelleAccessibleRepartition: (detail: string) => `Répartition par modèle : ${detail}.`,
  aucuneRepartition: 'aucune donnée',
  encartEconomie:
    "« Économie si Sonnet 5 » : ce qu'auraient coûté les tours Opus 5 de cet agent s'ils avaient tourné en Sonnet 5, à tokens identiques.",
  tarifIndisponible: '—',
} as const;
