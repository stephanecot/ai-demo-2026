/**
 * Encart — verdict ou avertissement, fond et bordure sourds de l'état.
 */
import type { ReactNode } from 'react';

import styles from './Encart.module.css';

/** Les quatre états de budget, réservés — jamais réutilisés comme couleur de série. */
export type ToneEncart = 'ok' | 'vigilance' | 'limite' | 'depassement';

export interface EncartProps {
  readonly tonalite: ToneEncart;
  readonly icone: ReactNode;
  readonly children: ReactNode;
}

const classeTonalite: Record<ToneEncart, string> = {
  ok: styles.tonaliteOk ?? '',
  vigilance: styles.tonaliteVigilance ?? '',
  limite: styles.tonaliteLimite ?? '',
  depassement: styles.tonaliteDepassement ?? '',
};

export function Encart({ tonalite, icone, children }: EncartProps) {
  return (
    <div className={`${styles.encart} ${classeTonalite[tonalite]}`} role="note">
      <span className={styles.icone} aria-hidden="true">
        {icone}
      </span>
      <div className={styles.texte}>{children}</div>
    </div>
  );
}
