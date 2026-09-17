/**
 * Tuile — le chiffre héros d'un écran : micro-label, valeur mono tabulaire
 * 30 px, unité collée, delta signé avec flèche. Le composant ne formate
 * rien : il reçoit des chaînes déjà mises en forme par `format.ts`.
 */
import type { ReactNode } from 'react';

import { Icone } from './Icone';
import styles from './Tuile.module.css';

/** Teinte du chiffre principal — le neutre et l'accent, plus les quatre états de budget. */
export type ToneTuile = 'neutre' | 'accent' | 'etat-ok' | 'etat-vigilance' | 'etat-limite' | 'etat-depassement';

export interface DeltaTuile {
  /** Texte déjà signé et formaté, ex. « +18,4 % vs période précédente ». */
  readonly texte: string;
  readonly sens: 'hausse' | 'baisse';
  /** Teinte du delta ; neutre par défaut (une hausse n'est pas toujours une mauvaise nouvelle). */
  readonly tonalite?: ToneTuile;
}

export interface TuileProps {
  readonly libelle: string;
  readonly valeur: string;
  readonly unite?: string;
  readonly delta?: DeltaTuile;
  readonly tonalite?: ToneTuile;
  /** Jauge ou micro-courbe affichée sous le chiffre. */
  readonly children?: ReactNode;
}

// Le « ?? '' » ne sert qu'à satisfaire l'index signature de vite/client sous
// `noUncheckedIndexedAccess` ; jamais atteint tant que la classe existe dans
// Tuile.module.css.
const classeTonalite: Record<ToneTuile, string> = {
  neutre: styles.toneNeutre ?? '',
  accent: styles.toneAccent ?? '',
  'etat-ok': styles.toneOk ?? '',
  'etat-vigilance': styles.toneVigilance ?? '',
  'etat-limite': styles.toneLimite ?? '',
  'etat-depassement': styles.toneDepassement ?? '',
};

export function Tuile({ libelle, valeur, unite, delta, tonalite = 'neutre', children }: TuileProps) {
  return (
    <div className={styles.tuile}>
      <div className={styles.libelle}>{libelle}</div>
      <div className={styles.ligneValeur}>
        <span className={`${styles.valeur} ${classeTonalite[tonalite]}`}>{valeur}</span>
        {unite && <span className={styles.unite}>{unite}</span>}
      </div>
      {delta && (
        <div
          className={`${styles.delta} ${delta.tonalite && delta.tonalite !== 'neutre' ? classeTonalite[delta.tonalite] : ''}`}
        >
          <Icone nom={delta.sens === 'hausse' ? 'fleche-haut' : 'fleche-bas'} taille={12} />
          <span className={styles.deltaTexte}>{delta.texte}</span>
        </div>
      )}
      {children && <div className={styles.zoneEnfant}>{children}</div>}
    </div>
  );
}
