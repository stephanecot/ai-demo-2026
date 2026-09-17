/**
 * Panneau — le conteneur de base du système : surface `--surface`, bordure
 * `--ligne`, rayon `--rayon`, jamais d'ombre. En-tête optionnelle (titre +
 * sous-titre + actions) ; tout le reste vient de `children`.
 */
import type { ReactNode } from 'react';

import styles from './Panneau.module.css';

export interface PanneauProps {
  readonly titre?: string;
  /** Phrase courte sous le titre, ex. une aide au survol du graphique. */
  readonly sousTitre?: string;
  /** Boutons ou contrôles alignés à droite de l'en-tête. */
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function Panneau({ titre, sousTitre, actions, children }: PanneauProps) {
  const aUneEntete = Boolean(titre) || Boolean(actions);

  return (
    <section className={styles.panneau}>
      {aUneEntete && (
        <header className={styles.entete}>
          <div className={styles.titres}>
            {titre && <h2 className={styles.titre}>{titre}</h2>}
            {sousTitre && <p className={styles.sousTitre}>{sousTitre}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.corps}>{children}</div>
    </section>
  );
}
