/**
 * Textes propres à l'écran « Réglages ».
 *
 * `src/labels.ts` porte déjà `REGLAGES` (titres, libellés de source, colonnes
 * de tarifs) ; ce fichier complète ce qui manquait pour composer l'écran sans
 * toucher à un fichier hors du périmètre de cette mission (voir le rapport de
 * mission). À rapatrier dans `src/labels.ts` par qui en a la charge.
 */
export const TEXTES_REGLAGES = {
  microLabel: 'Lecture seule',
  derniereSynchroLabel: 'Dernière synchro',
  bornesCycleLabel: 'Bornes du cycle',
  bascule:
    "Pour lire des transcripts réels plutôt que le jeu d'exemple, définis la variable d'environnement TOKENOMETRE_TRANSCRIPTS sur le dossier à lire, puis redémarre le serveur.",
  mentionSourceVerite:
    'Ces tarifs sont la seule source de vérité des coûts affichés dans le Tokenomètre : ils vivent côté serveur, jamais dans ce navigateur.',
  progressionAccessible: (jour: number, jours: number) => `jour ${jour} sur ${jours} du cycle de facturation`,
} as const;
