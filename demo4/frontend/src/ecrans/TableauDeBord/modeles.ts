/**
 * Ordre et couleurs des trois modèles, réservés au Tableau de bord.
 *
 * L'ordre (Opus, Sonnet, Haiku) reprend celui de `backend/src/domain/tarifs.ts`
 * (`MODELES = Object.keys(TARIFS)`), repris ici tel quel pour empiler les
 * barres et les répartitions toujours dans le même sens — ce n'est pas un
 * calcul, juste une constante de présentation.
 *
 * Les couleurs suivent `references/graphiques.md` : les trois teintes de
 * série restent des littéraux hexadécimaux (pas `var(--…)`) pour rester
 * validables telles quelles par l'outil de contrôle du design system.
 * Hors graphique (pastille de légende, teinte de ligne du tableau des
 * projets), on référence le token correspondant.
 */
import type { ModeleId } from '../../types/api';

export const ORDRE_MODELES: readonly ModeleId[] = [
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-haiku-4-5',
];

/** Couleurs de série littérales — voir `graphiques.md` §2. N'utiliser que dans un graphique. */
export const COULEUR_MODELE_HEX: Readonly<Record<ModeleId, string>> = {
  'claude-opus-5': '#d95926',
  'claude-sonnet-5': '#3987e5',
  'claude-haiku-4-5': '#199e70',
};

/** Référence de token CSS — à utiliser partout ailleurs qu'un tracé de graphique. */
export const COULEUR_MODELE_VAR: Readonly<Record<ModeleId, string>> = {
  'claude-opus-5': 'var(--modele-opus)',
  'claude-sonnet-5': 'var(--modele-sonnet)',
  'claude-haiku-4-5': 'var(--modele-haiku)',
};
