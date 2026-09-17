/**
 * MicroCourbe — tendance décorative dans une tuile. Sans axe ni point ni
 * infobulle : la valeur chiffrée qui porte le sens est à côté, dans la tuile.
 * `aria-hidden` : rien ici n'est lisible par un lecteur d'écran.
 */
import styles from './MicroCourbe.module.css';

export interface MicroCourbeProps {
  readonly valeurs: readonly number[];
  /**
   * Couleur du trait. Littéral hexadécimal accepté ici uniquement : c'est soit
   * `--texte-3` par défaut, soit une des trois couleurs de modèle fournies par
   * l'écran (voir `graphiques.md`) — jamais une couleur inventée par l'appelant.
   */
  readonly couleur?: string;
}

const LARGEUR = 160;
const HAUTEUR = 26;
const MARGE = 2;

export function MicroCourbe({ valeurs, couleur }: MicroCourbeProps) {
  if (valeurs.length < 2) {
    return (
      <svg
        className={styles.courbe}
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      />
    );
  }

  const max = Math.max(...valeurs);
  const min = Math.min(...valeurs);
  const etendue = max - min || 1;
  const points = valeurs
    .map((valeur, index) => {
      const x = (index * (LARGEUR - MARGE * 2)) / (valeurs.length - 1) + MARGE;
      const y = HAUTEUR - MARGE - ((valeur - min) / etendue) * (HAUTEUR - MARGE * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      className={styles.courbe}
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={couleur ?? 'var(--texte-3)'}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={styles.trait}
      />
    </svg>
  );
}
