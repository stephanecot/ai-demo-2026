/**
 * EtatVide — l'état « rien à afficher » d'un écran ou d'un panneau. Toujours
 * une phrase utile, jamais un tiret ni « aucune donnée ».
 */
import type { ReactNode } from 'react';

import styles from './EtatVide.module.css';

export interface EtatVideProps {
  readonly titre: string;
  readonly detail?: string;
  /** Action de reprise, ex. un `BoutonFantome` déjà composé par l'écran. */
  readonly action?: ReactNode;
}

export function EtatVide({ titre, detail, action }: EtatVideProps) {
  return (
    <div className={styles.etatVide} role="status">
      <p className={styles.titre}>{titre}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
