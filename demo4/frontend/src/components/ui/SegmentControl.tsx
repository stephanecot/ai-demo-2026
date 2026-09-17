/**
 * SegmentControl — un choix exclusif parmi des boutons joints.
 *
 * Rôle ARIA `radiogroup` / `radio`, navigation clavier aux flèches
 * gauche/droite (roving tabindex). Purement présentationnel : la valeur et
 * les libellés viennent de l'appelant.
 */
import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

import styles from './SegmentControl.module.css';

export interface OptionSegment<T extends string> {
  readonly valeur: T;
  readonly libelle: string;
}

export interface SegmentControlProps<T extends string> {
  readonly options: readonly OptionSegment<T>[];
  readonly valeur: T;
  readonly onChange: (valeur: T) => void;
  /** Libellé du groupe, porté par `aria-label` (ex. « Période »). */
  readonly libelleAccessible: string;
}

export function SegmentControl<T extends string>({
  options,
  valeur,
  onChange,
  libelleAccessible,
}: SegmentControlProps<T>) {
  const boutons = useRef<Array<HTMLButtonElement | null>>([]);

  function activer(index: number) {
    const option = options[index];
    if (option === undefined) {
      return;
    }
    onChange(option.valeur);
    boutons.current[index]?.focus();
  }

  function gererClavier(evenement: KeyboardEvent<HTMLDivElement>) {
    const indexActuel = options.findIndex((option) => option.valeur === valeur);
    if (evenement.key === 'ArrowRight') {
      evenement.preventDefault();
      activer((indexActuel + 1 + options.length) % options.length);
    } else if (evenement.key === 'ArrowLeft') {
      evenement.preventDefault();
      activer((indexActuel - 1 + options.length) % options.length);
    } else if (evenement.key === 'Home') {
      evenement.preventDefault();
      activer(0);
    } else if (evenement.key === 'End') {
      evenement.preventDefault();
      activer(options.length - 1);
    }
  }

  return (
    <div
      className={styles.groupe}
      role="radiogroup"
      aria-label={libelleAccessible}
      onKeyDown={gererClavier}
    >
      {options.map((option, index) => {
        const estActif = option.valeur === valeur;
        return (
          <button
            key={option.valeur}
            ref={(element) => {
              boutons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={estActif}
            tabIndex={estActif ? 0 : -1}
            className={estActif ? `${styles.segment} ${styles.actif}` : styles.segment}
            onClick={() => activer(index)}
          >
            {option.libelle}
          </button>
        );
      })}
    </div>
  );
}
