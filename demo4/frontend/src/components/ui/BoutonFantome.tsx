/**
 * BoutonFantome — action secondaire, transparente, bordée.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './BoutonFantome.module.css';

export interface BoutonFantomeProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'> {
  readonly children: ReactNode;
  readonly icone?: ReactNode;
}

export function BoutonFantome({ children, icone, disabled, ...reste }: BoutonFantomeProps) {
  return (
    <button type="button" className={styles.bouton} disabled={disabled} {...reste}>
      {icone === undefined ? null : (
        <span className={styles.icone} aria-hidden="true">
          {icone}
        </span>
      )}
      {children}
    </button>
  );
}
