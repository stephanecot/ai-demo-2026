/**
 * BarresEmpilees — la pièce maîtresse du tableau de bord : coût quotidien
 * empilé par modèle. Le composant ne connaît ni tarif ni token : il reçoit
 * des grandeurs déjà calculées (`valeur`) et des chaînes déjà formatées
 * (`valeurAffichee`) — il ne fait que de la géométrie et de l'interaction.
 *
 * Un seul axe vertical, trois graduations (haut, milieu, 0). Sélection
 * d'une colonne à la souris et au clavier (flèches gauche/droite, Origine/
 * Fin, Entrée/Espace). Infobulle au survol ou au focus donnant la date et
 * le détail par série.
 */
import type { KeyboardEvent } from 'react';

import styles from './BarresEmpilees.module.css';

export interface SegmentBarre {
  readonly cle: string;
  readonly libelle: string;
  /** Couleur de série, littéral hexadécimal fourni par l'écran (voir graphiques.md). */
  readonly couleur: string;
  /** Grandeur brute de ce segment, dans l'unité choisie par l'écran. */
  readonly valeur: number;
  /** Valeur déjà formatée, affichée dans l'infobulle. */
  readonly valeurAffichee: string;
}

export interface ColonneBarres {
  readonly cle: string;
  /** Micro-label sous la colonne, ex. « 01 ». */
  readonly libelleAxe: string;
  /** Ligne d'en-tête de l'infobulle, ex. « 01 sept · 25,7 $ ». */
  readonly libelleEntete: string;
  readonly segments: readonly SegmentBarre[];
}

export interface BarresEmpileesProps {
  readonly colonnes: readonly ColonneBarres[];
  /** Plafond de l'échelle verticale, déjà calculé par l'écran. */
  readonly max: number;
  /** Graduation du haut, déjà formatée. */
  readonly libelleAxeHaut: string;
  /** Graduation du milieu, déjà formatée. */
  readonly libelleAxeMilieu: string;
  /** Clé de la colonne sélectionnée. */
  readonly selection?: string;
  readonly onSelection?: (cle: string) => void;
  /** Porté par `aria-label` du groupe de colonnes. */
  readonly libelleAccessible: string;
}

function hauteurSegment(valeur: number, max: number): string {
  if (max <= 0) {
    return '0%';
  }
  return `${Math.min(100, Math.max(0, (valeur / max) * 100))}%`;
}

export function BarresEmpilees({
  colonnes,
  max,
  libelleAxeHaut,
  libelleAxeMilieu,
  selection,
  onSelection,
  libelleAccessible,
}: BarresEmpileesProps) {
  const indexSelection = Math.max(
    0,
    colonnes.findIndex((colonne) => colonne.cle === selection),
  );
  const legende = colonnes[0]?.segments ?? [];
  const afficherLegende = legende.length >= 2;

  function selectionner(index: number) {
    const colonne = colonnes[index];
    if (colonne === undefined) {
      return;
    }
    onSelection?.(colonne.cle);
  }

  function gererClavier(evenement: KeyboardEvent<HTMLDivElement>) {
    if (colonnes.length === 0) {
      return;
    }
    if (evenement.key === 'ArrowRight') {
      evenement.preventDefault();
      selectionner((indexSelection + 1) % colonnes.length);
    } else if (evenement.key === 'ArrowLeft') {
      evenement.preventDefault();
      selectionner((indexSelection - 1 + colonnes.length) % colonnes.length);
    } else if (evenement.key === 'Home') {
      evenement.preventDefault();
      selectionner(0);
    } else if (evenement.key === 'End') {
      evenement.preventDefault();
      selectionner(colonnes.length - 1);
    }
  }

  return (
    <div className={styles.graphique}>
      {afficherLegende ? (
        <ul className={styles.legende}>
          {legende.map((segment) => (
            <li key={segment.cle} className={styles.legendeItem}>
              <span
                className={styles.pastille}
                style={{ background: segment.couleur }}
                aria-hidden="true"
              />
              <span className={styles.legendeLibelle}>{segment.libelle}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.corps}>
        <div className={styles.axe} aria-hidden="true">
          <div className={styles.axeGraduations}>
            <span className={styles.axeLabel}>{libelleAxeHaut}</span>
            <span className={styles.axeLabel}>{libelleAxeMilieu}</span>
            <span className={styles.axeLabel}>0</span>
          </div>
          <div className={styles.axeSpaceur} />
        </div>

        <div
          className={styles.colonnes}
          role="listbox"
          aria-label={libelleAccessible}
          onKeyDown={gererClavier}
        >
          {colonnes.map((colonne, index) => {
            const estSelectionnee = colonne.cle === selection;
            const estFocusable = selection === undefined ? index === 0 : estSelectionnee;
            return (
              <div
                key={colonne.cle}
                role="option"
                aria-selected={estSelectionnee}
                tabIndex={estFocusable ? 0 : -1}
                className={
                  estSelectionnee ? `${styles.colonne} ${styles.selectionnee}` : styles.colonne
                }
                onClick={() => selectionner(index)}
              >
                <div className={styles.infobulle}>
                  <div className={styles.infobulleEntete}>{colonne.libelleEntete}</div>
                  {colonne.segments.map((segment) => (
                    <div key={segment.cle} className={styles.infobulleLigne}>
                      <span
                        className={styles.infobulleLibelle}
                        style={{ color: segment.couleur }}
                      >
                        {segment.libelle}
                      </span>
                      <span className={styles.infobulleValeur}>{segment.valeurAffichee}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.pile}>
                  {colonne.segments.map((segment, indexSegment) => (
                    <div
                      key={segment.cle}
                      className={
                        indexSegment === 0
                          ? `${styles.segment} ${styles.segmentHaut}`
                          : styles.segment
                      }
                      style={{
                        height: hauteurSegment(segment.valeur, max),
                        background: segment.couleur,
                      }}
                    />
                  ))}
                </div>
                <span className={styles.etiquette}>{colonne.libelleAxe}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
