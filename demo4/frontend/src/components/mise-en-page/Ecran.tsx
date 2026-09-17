/**
 * Ecran — la colonne de contenu à droite de la barre latérale : marges
 * d'écran (22/26 px), empilement vertical par `gap`, et `min-width: 0` pour
 * que les tableaux internes puissent se réduire sans déborder.
 */
import type { ReactNode } from 'react';

import styles from './Ecran.module.css';

export interface EcranProps {
  readonly children: ReactNode;
}

export function Ecran({ children }: EcranProps) {
  return <div className={styles.ecran}>{children}</div>;
}
