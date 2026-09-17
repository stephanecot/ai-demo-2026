/**
 * BarreRepartition — barre segmentée locale à l'écran « Modèles & agents » :
 * la part de coût de chaque modèle dans le coût d'un agent, sur une seule
 * ligne de tableau. N'apparaît que sur cet écran : elle reste locale plutôt
 * que de rejoindre `components/ui/` (règle du skill design-system).
 *
 * Purement géométrique : elle reçoit des valeurs déjà calculées par le
 * backend (`LigneAgent.parModele`) et un libellé accessible déjà composé.
 */
import type { ModeleId } from '../../types/api';
import styles from './BarreRepartition.module.css';

export interface SegmentRepartition {
  readonly modele: ModeleId;
  readonly couleur: string;
  readonly valeur: number;
}

export interface BarreRepartitionProps {
  readonly segments: readonly SegmentRepartition[];
  readonly libelleAccessible: string;
}

export function BarreRepartition({ segments, libelleAccessible }: BarreRepartitionProps) {
  const total = segments.reduce((somme, segment) => somme + segment.valeur, 0);
  const visibles = segments.filter((segment) => segment.valeur > 0);

  return (
    <div className={styles.piste} role="img" aria-label={libelleAccessible}>
      {total > 0 &&
        visibles.map((segment) => (
          <span
            key={segment.modele}
            className={styles.segment}
            style={{ width: `${(segment.valeur / total) * 100}%`, background: segment.couleur }}
          />
        ))}
    </div>
  );
}
