/**
 * BoutonPrincipal — l'action principale d'un écran. Un seul par écran.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './BoutonPrincipal.module.css';

export interface BoutonPrincipalProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'> {
  readonly children: ReactNode;
  readonly icone?: ReactNode;
}

export function BoutonPrincipal({ children, icone, disabled, ...reste }: BoutonPrincipalProps) {
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
