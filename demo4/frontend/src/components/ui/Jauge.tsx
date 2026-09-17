/**
 * Jauge horizontale : consommé net, projection fantôme en arrière-plan.
 *
 * Le composant ne connaît ni tarif ni token : il reçoit deux montants déjà
 * calculés (`valeur`, `plafond`) et positionne des barres en pourcentage.
 * Aucune règle métier ici, seulement de la géométrie.
 */
import styles from './Jauge.module.css';

/** Les quatre états de budget, réservés — jamais réutilisés comme couleur de série. */
export type ToneJauge = 'ok' | 'vigilance' | 'limite' | 'depassement';

export interface JaugeProps {
  /** Montant consommé. */
  readonly valeur: number;
  /** Plafond du budget ; sert de dénominateur à la jauge. */
  readonly plafond: number;
  /** Projection fin de cycle, dessinée en arrière-plan à 30 % d'opacité. */
  readonly projection?: number;
  /** Tonalité de l'état, réservée aux quatre états de budget. */
  readonly tonalite: ToneJauge;
  /** Description accessible portée par `aria-valuetext` (ex. « 62 % du plafond »). */
  readonly libelleAccessible: string;
}

// Les classes viennent bien du module CSS ; le « ?? '' » ne sert qu'à satisfaire
// l'index signature de vite/client sous `noUncheckedIndexedAccess`, jamais atteint
// à l'exécution tant que la classe existe dans Jauge.module.css.
const classeTonalite: Record<ToneJauge, string> = {
  ok: styles.tonaliteOk ?? '',
  vigilance: styles.tonaliteVigilance ?? '',
  limite: styles.tonaliteLimite ?? '',
  depassement: styles.tonaliteDepassement ?? '',
};

function pourcentage(valeur: number, plafond: number): number {
  if (plafond <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (valeur / plafond) * 100));
}

export function Jauge({ valeur, plafond, projection, tonalite, libelleAccessible }: JaugeProps) {
  const pctConsomme = pourcentage(valeur, plafond);
  const pctProjection = projection === undefined ? undefined : pourcentage(projection, plafond);

  return (
    <div
      className={styles.piste}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pctConsomme)}
      aria-valuetext={libelleAccessible}
    >
      {pctProjection === undefined ? null : (
        <div
          className={`${styles.remplissage} ${styles.fantome} ${classeTonalite[tonalite]}`}
          style={{ width: `${pctProjection}%` }}
        />
      )}
      <div
        className={`${styles.remplissage} ${classeTonalite[tonalite]}`}
        style={{ width: `${pctConsomme}%` }}
      />
    </div>
  );
}
