/**
 * Badge — couleur ET libellé, toujours. Sert à désigner un modèle ou l'état
 * d'un budget dans un petit chip mono 10 px. Jamais la couleur seule.
 */
import type { ReactNode } from 'react';

import { Icone } from './Icone';
import type { NomIcone } from './Icone';
import styles from './Badge.module.css';

/**
 * Trois familles de tonalité (modèle, état, neutre — voir le skill design-system) ;
 * chaque valeur concrète pointe vers la teinte de token correspondante.
 */
export type ToneBadge =
  | 'modele-opus'
  | 'modele-sonnet'
  | 'modele-haiku'
  | 'modele-autres'
  | 'etat-ok'
  | 'etat-vigilance'
  | 'etat-limite'
  | 'etat-depassement'
  | 'neutre';

export interface BadgeProps {
  readonly tonalite: ToneBadge;
  readonly icone?: NomIcone;
  readonly children: ReactNode;
}

// Le « ?? '' » ne sert qu'à satisfaire l'index signature de vite/client sous
// `noUncheckedIndexedAccess` ; jamais atteint tant que la classe existe dans
// Badge.module.css.
const classeTonalite: Record<ToneBadge, string> = {
  'modele-opus': styles.modeleOpus ?? '',
  'modele-sonnet': styles.modeleSonnet ?? '',
  'modele-haiku': styles.modeleHaiku ?? '',
  'modele-autres': styles.modeleAutres ?? '',
  'etat-ok': styles.etatOk ?? '',
  'etat-vigilance': styles.etatVigilance ?? '',
  'etat-limite': styles.etatLimite ?? '',
  'etat-depassement': styles.etatDepassement ?? '',
  neutre: styles.neutre ?? '',
};

export function Badge({ tonalite, icone, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${classeTonalite[tonalite]}`}>
      {icone && <Icone nom={icone} taille={11} />}
      <span className={styles.texte}>{children}</span>
    </span>
  );
}
