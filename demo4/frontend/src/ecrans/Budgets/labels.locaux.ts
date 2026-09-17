/**
 * Textes complémentaires à l'écran Budgets, absents pour l'instant du
 * `src/labels.ts` partagé — ce fichier n'est pas dans le périmètre de cette
 * mission (voir la discipline de fichiers du projet). À faire remonter dans
 * `src/labels.ts` par l'agent qui le possède ; même règle en attendant :
 * aucun texte en dur dans les composants de cet écran.
 */
export const BUDGETS_LOCAL = {
  seuilAucunFranchi: 'Aucun seuil franchi par la projection actuelle.',
  seuilsFranchis: (seuils: readonly number[]) =>
    `La projection dépasse déjà ${seuils.map((seuil) => `${seuil} %`).join(', ')} : ${seuils.length} alerte${
      seuils.length > 1 ? 's' : ''
    } partirai${seuils.length > 1 ? 'ent' : 't'} ce cycle.`,
} as const;
