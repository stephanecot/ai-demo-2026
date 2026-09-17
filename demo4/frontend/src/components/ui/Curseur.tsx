/**
 * Curseur — réglage numérique par glissière, toujours doublé de boutons
 * −/+ et de la valeur chiffrée : un curseur seul n'est pas réglable au
 * clavier de façon évidente (règle non négociable du design system).
 */
import styles from './Curseur.module.css';

export interface CurseurProps {
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly valeur: number;
  readonly onChange: (valeur: number) => void;
  /** Valeur déjà formatée par `format.ts`, affichée à côté de la glissière. */
  readonly valeurAffichee: string;
  /** Porté par `aria-label` de l'`input[type=range]`. */
  readonly libelleAccessible: string;
  /** Libellé du bouton de décrément (ex. « Diminuer le plafond »). */
  readonly libelleDiminuer: string;
  /** Libellé du bouton d'incrément (ex. « Augmenter le plafond »). */
  readonly libelleAugmenter: string;
}

function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}

export function Curseur({
  min,
  max,
  pas,
  valeur,
  onChange,
  valeurAffichee,
  libelleAccessible,
  libelleDiminuer,
  libelleAugmenter,
}: CurseurProps) {
  return (
    <div className={styles.curseur}>
      <div className={styles.rangee}>
        <button
          type="button"
          className={styles.pas}
          aria-label={libelleDiminuer}
          disabled={valeur <= min}
          onClick={() => onChange(borner(valeur - pas, min, max))}
        >
          −
        </button>
        <input
          type="range"
          className={styles.plage}
          min={min}
          max={max}
          step={pas}
          value={valeur}
          aria-label={libelleAccessible}
          onChange={(evenement) => onChange(borner(Number(evenement.target.value), min, max))}
        />
        <button
          type="button"
          className={styles.pas}
          aria-label={libelleAugmenter}
          disabled={valeur >= max}
          onClick={() => onChange(borner(valeur + pas, min, max))}
        >
          +
        </button>
      </div>
      <div className={styles.valeur}>{valeurAffichee}</div>
    </div>
  );
}
