/**
 * CourbeCumulee — le coût cumulé au fil des tours d'une session : trois
 * lignes de repère horizontales, un point par tour, le tour sélectionné
 * plus gros et relié par une ligne repère pointillée. Local à l'écran
 * Session (§ procédure « créer un composant de base » du skill
 * design-system : pas de deuxième écran qui en a besoin pour l'instant).
 *
 * Le composant ne connaît aucun tarif : il reçoit des coûts cumulés déjà
 * calculés par le backend (`DetailTour.coutCumule`) et ne fait que de la
 * géométrie et de l'interaction (clic et clavier, flèches/Origine/Fin).
 */
import type { KeyboardEvent } from 'react';

import styles from './CourbeCumulee.module.css';

export interface CourbeCumuleeProps {
  /** Coût cumulé après chaque tour, dans l'ordre des tours. */
  readonly valeurs: readonly number[];
  /** Index (position dans `valeurs`) du tour sélectionné. */
  readonly selection: number;
  readonly onSelection: (index: number) => void;
  /** Libellé accessible de chaque point, ex. « tour 5, 12,30 $ cumulés ». */
  readonly libellesPoints: readonly string[];
  readonly libelleAccessible: string;
}

const LARGEUR = 1080;
const HAUTEUR = 130;
const MARGE_HAUTE = 8;
const MARGE_BASSE = 20;
const HAUTEUR_UTILE = HAUTEUR - MARGE_HAUTE - MARGE_BASSE;

interface PointGeometrie {
  readonly x: number;
  readonly y: number;
}

function calculePoints(valeurs: readonly number[]): readonly PointGeometrie[] {
  const max = Math.max(...valeurs, 1);
  return valeurs.map((valeur, index) => {
    const x = valeurs.length <= 1 ? LARGEUR / 2 : (index * LARGEUR) / (valeurs.length - 1);
    const y = HAUTEUR - MARGE_BASSE - (valeur / max) * HAUTEUR_UTILE;
    return { x, y };
  });
}

export function CourbeCumulee({ valeurs, selection, onSelection, libellesPoints, libelleAccessible }: CourbeCumuleeProps) {
  const points = calculePoints(valeurs);
  const trace = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const pointSelectionne = points[selection];

  function selectionner(index: number) {
    if (index < 0 || index >= valeurs.length) {
      return;
    }
    onSelection(index);
  }

  function gererClavier(evenement: KeyboardEvent<HTMLDivElement>) {
    if (evenement.key === 'ArrowRight') {
      evenement.preventDefault();
      selectionner(Math.min(valeurs.length - 1, selection + 1));
    } else if (evenement.key === 'ArrowLeft') {
      evenement.preventDefault();
      selectionner(Math.max(0, selection - 1));
    } else if (evenement.key === 'Home') {
      evenement.preventDefault();
      selectionner(0);
    } else if (evenement.key === 'End') {
      evenement.preventDefault();
      selectionner(valeurs.length - 1);
    }
  }

  return (
    <div className={styles.zone} role="listbox" aria-label={libelleAccessible} onKeyDown={gererClavier}>
      <svg className={styles.svg} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} preserveAspectRatio="none" aria-hidden="true">
        <line x1={0} y1={MARGE_HAUTE} x2={LARGEUR} y2={MARGE_HAUTE} className={styles.repere} />
        <line
          x1={0}
          y1={MARGE_HAUTE + HAUTEUR_UTILE / 2}
          x2={LARGEUR}
          y2={MARGE_HAUTE + HAUTEUR_UTILE / 2}
          className={styles.repere}
        />
        <line x1={0} y1={HAUTEUR - MARGE_BASSE} x2={LARGEUR} y2={HAUTEUR - MARGE_BASSE} className={styles.repereBas} />
        {pointSelectionne && (
          <line
            x1={pointSelectionne.x}
            y1={0}
            x2={pointSelectionne.x}
            y2={HAUTEUR - MARGE_BASSE}
            className={styles.repereSelection}
          />
        )}
        <polyline points={trace} fill="none" className={styles.trait} />
        {points.map((point, index) => (
          <circle
            key={libellesPoints[index] ?? index}
            cx={point.x}
            cy={point.y}
            r={index === selection ? 5 : 3.5}
            className={index === selection ? styles.pointSelectionne : styles.point}
          />
        ))}
      </svg>

      <div className={styles.cibles}>
        {points.map((_point, index) => (
          <button
            key={libellesPoints[index] ?? index}
            type="button"
            role="option"
            aria-selected={index === selection}
            aria-label={libellesPoints[index]}
            tabIndex={index === selection ? 0 : -1}
            className={styles.cible}
            onClick={() => selectionner(index)}
          />
        ))}
      </div>
    </div>
  );
}
