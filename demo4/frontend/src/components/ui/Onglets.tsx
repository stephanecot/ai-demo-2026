/**
 * Onglets — navigation par soulignement, un onglet actif à la fois.
 *
 * Rôle ARIA `tablist` / `tab`, flèches gauche/droite pour naviguer
 * (roving tabindex). Le contenu de l'onglet est géré par l'appelant.
 */
import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

import styles from './Onglets.module.css';

export interface OptionOnglet<T extends string> {
  readonly valeur: T;
  readonly libelle: string;
}

export interface OngletsProps<T extends string> {
  readonly options: readonly OptionOnglet<T>[];
  readonly valeur: T;
  readonly onChange: (valeur: T) => void;
  /** Libellé du groupe d'onglets, porté par `aria-label`. */
  readonly libelleAccessible: string;
}

export function Onglets<T extends string>({
  options,
  valeur,
  onChange,
  libelleAccessible,
}: OngletsProps<T>) {
  const onglets = useRef<Array<HTMLButtonElement | null>>([]);

  function activer(index: number) {
    const option = options[index];
    if (option === undefined) {
      return;
    }
    onChange(option.valeur);
    onglets.current[index]?.focus();
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
      className={styles.liste}
      role="tablist"
      aria-label={libelleAccessible}
      onKeyDown={gererClavier}
    >
      {options.map((option, index) => {
        const estActif = option.valeur === valeur;
        return (
          <button
            key={option.valeur}
            ref={(element) => {
              onglets.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={estActif}
            tabIndex={estActif ? 0 : -1}
            className={estActif ? `${styles.onglet} ${styles.actif}` : styles.onglet}
            onClick={() => activer(index)}
          >
            {option.libelle}
          </button>
        );
      })}
    </div>
  );
}
