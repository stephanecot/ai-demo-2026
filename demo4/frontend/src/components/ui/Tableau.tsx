/**
 * Tableau — grille CSS pilotée par la définition des colonnes. En-têtes en
 * micro-label, nombres alignés à droite en mono. Une ligne cliquable est un
 * vrai bouton au clavier (rôle, tabulation, Entrée et Espace). Jamais de
 * corps vide sans `messageVide`.
 */
import type { KeyboardEvent, ReactNode } from 'react';

import styles from './Tableau.module.css';

export interface ColonneTableau<Ligne> {
  /** Clé stable de la colonne (react key, pas un texte affiché). */
  readonly cle: string;
  readonly libelle: string;
  /** Largeur de piste CSS grid, ex. `'1.7fr'` ou `'96px'`. `1fr` par défaut. */
  readonly largeur?: string;
  readonly alignement?: 'gauche' | 'droite';
  /** Cellule numérique : mono tabulaire, alignée à droite par défaut. */
  readonly numerique?: boolean;
  /** La cellule reçoit la ligne et rend le contenu déjà formaté. */
  readonly rendu: (ligne: Ligne) => ReactNode;
}

export interface TableauProps<Ligne> {
  readonly colonnes: readonly ColonneTableau<Ligne>[];
  readonly lignes: readonly Ligne[];
  readonly cleLigne: (ligne: Ligne) => string;
  /** Phrase affichée à la place du corps quand `lignes` est vide. */
  readonly messageVide: string;
  /** Identifiant (voir `cleLigne`) de la ligne sélectionnée, s'il y en a une. */
  readonly ligneSelectionneeId?: string;
  readonly onLigneClic?: (ligne: Ligne) => void;
}

function alignementEffectif<Ligne>(colonne: ColonneTableau<Ligne>): 'gauche' | 'droite' {
  return colonne.alignement ?? (colonne.numerique ? 'droite' : 'gauche');
}

export function Tableau<Ligne>({
  colonnes,
  lignes,
  cleLigne,
  messageVide,
  ligneSelectionneeId,
  onLigneClic,
}: TableauProps<Ligne>) {
  const gabarit = colonnes.map((colonne) => colonne.largeur ?? '1fr').join(' ');

  return (
    <div className={styles.tableau} role="table">
      <div className={styles.entete} role="row" style={{ gridTemplateColumns: gabarit }}>
        {colonnes.map((colonne) => (
          <span
            key={colonne.cle}
            role="columnheader"
            className={styles.enTeteColonne}
            style={{ textAlign: alignementEffectif(colonne) === 'droite' ? 'right' : 'left' }}
          >
            {colonne.libelle}
          </span>
        ))}
      </div>

      <div className={styles.corps} role="rowgroup">
        {lignes.length === 0 ? (
          <p className={styles.vide}>{messageVide}</p>
        ) : (
          lignes.map((ligne) => {
            const id = cleLigne(ligne);
            const clicable = Boolean(onLigneClic);
            const gererClic = onLigneClic ? () => onLigneClic(ligne) : undefined;
            const gererClavier = gererClic
              ? (evenement: KeyboardEvent<HTMLDivElement>) => {
                  if (evenement.key === 'Enter' || evenement.key === ' ') {
                    evenement.preventDefault();
                    gererClic();
                  }
                }
              : undefined;
            const estSelectionnee = id === ligneSelectionneeId;

            return (
              <div
                key={id}
                role={clicable ? 'button' : 'row'}
                tabIndex={clicable ? 0 : undefined}
                onClick={gererClic}
                onKeyDown={gererClavier}
                className={[styles.ligne, clicable ? styles.clicable : '', estSelectionnee ? styles.selectionnee : '']
                  .filter(Boolean)
                  .join(' ')}
                style={{ gridTemplateColumns: gabarit }}
              >
                {colonnes.map((colonne) => (
                  <span
                    key={colonne.cle}
                    role="cell"
                    className={colonne.numerique ? styles.celluleNumerique : styles.cellule}
                    style={{ textAlign: alignementEffectif(colonne) === 'droite' ? 'right' : 'left' }}
                  >
                    {colonne.rendu(ligne)}
                  </span>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
