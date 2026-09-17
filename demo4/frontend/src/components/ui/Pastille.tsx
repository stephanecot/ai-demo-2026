/**
 * Pastille — petit carré de couleur porteur d'identité (un modèle, une
 * série) à côté d'un texte neutre. Ne porte jamais de texte elle-même.
 */
import styles from './Pastille.module.css';

export interface PastilleProps {
  /** Couleur CSS — toujours une référence à un token, ex. `var(--modele-opus)`. */
  readonly couleur: string;
  /** Côté du carré, en px. 8 par défaut (8-9 px admis). */
  readonly taille?: number;
}

export function Pastille({ couleur, taille = 8 }: PastilleProps) {
  return (
    <span
      className={styles.pastille}
      style={{ width: taille, height: taille, backgroundColor: couleur }}
      aria-hidden="true"
    />
  );
}
