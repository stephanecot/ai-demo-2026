/**
 * EnTeteEcran — micro-label + titre 25 px + zone d'actions à droite, la même
 * en-tête sur les trois maquettes.
 */
import type { ReactNode } from 'react';

import styles from './EnTeteEcran.module.css';

export interface EnTeteEcranProps {
  /** Micro-label au-dessus du titre : période affichée, compteur, statut court. */
  readonly microLabel: string;
  readonly titre: string;
  /** Segments de période, export, bouton principal… alignés à droite. */
  readonly actions?: ReactNode;
}

export function EnTeteEcran({ microLabel, titre, actions }: EnTeteEcranProps) {
  return (
    <div className={styles.entete}>
      <div>
        <div className={styles.microLabel}>{microLabel}</div>
        <h1 className={styles.titre}>{titre}</h1>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
