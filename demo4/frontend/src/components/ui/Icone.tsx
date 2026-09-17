/**
 * Icone — le petit registre d'icônes SVG en ligne du produit.
 *
 * Aucune librairie d'icônes : chaque tracé vient des maquettes et vit ici,
 * une fois. Trait 1,8 px, grille 24, taille d'affichage par défaut 16 px
 * (16/20/24 admis). Décorative par défaut (`aria-hidden`) ; devient un
 * élément porteur de sens dès qu'un `titre` est fourni.
 */
import type { ReactNode } from 'react';

import styles from './Icone.module.css';

/** Le registre fermé des icônes du produit — pas d'ajout au coup par coup. */
export type NomIcone =
  | 'tableau-de-bord'
  | 'sessions'
  | 'budgets'
  | 'modeles-agents'
  | 'reglages'
  | 'logo'
  | 'fleche-haut'
  | 'fleche-bas'
  | 'alerte'
  | 'coche'
  | 'plus'
  | 'moins'
  | 'export'
  | 'cercle-erreur'
  | 'menu';

export interface IconeProps {
  readonly nom: NomIcone;
  /** Côté du carré, en px. 16 par défaut ; 20 ou 24 pour les grandes icônes. */
  readonly taille?: number;
  /** Quand elle est fournie, l'icône porte du sens et devient accessible. */
  readonly titre?: string;
}

function trace(nom: NomIcone): ReactNode {
  switch (nom) {
    case 'tableau-de-bord':
      return (
        <>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="3" y="16" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
        </>
      );
    case 'sessions':
      return <path d="M4 6h16M4 12h16M4 18h10" />;
    case 'budgets':
      return (
        <>
          <path d="M3 17l5-6 4 4 5-8" />
          <path d="M3 21h18" />
        </>
      );
    case 'modeles-agents':
      return (
        <>
          <circle cx="7" cy="7" r="3" />
          <circle cx="17" cy="17" r="3" />
          <path d="M10 7h7v7" />
        </>
      );
    case 'reglages':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </>
      );
    case 'logo':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 12 L12 5" />
          <path d="M12 12 L17.5 15" />
        </>
      );
    case 'fleche-haut':
      return (
        <>
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </>
      );
    case 'fleche-bas':
      return (
        <>
          <path d="M12 5v14" />
          <path d="M18 13l-6 6-6-6" />
        </>
      );
    case 'alerte':
      return (
        <>
          <path d="M12 8v5M12 16.5v.5" />
          <path d="M10.3 4.2L2.8 17.5a1.8 1.8 0 001.6 2.7h15.2a1.8 1.8 0 001.6-2.7L13.7 4.2a1.9 1.9 0 00-3.4 0z" />
        </>
      );
    case 'coche':
      return <path d="M20 6L9 17l-5-5" />;
    case 'plus':
      return <path d="M12 5v14M5 12h14" />;
    case 'moins':
      return <path d="M5 12h14" />;
    case 'export':
      return (
        <>
          <path d="M12 3v12" />
          <path d="M7 11l5 5 5-5" />
          <path d="M4 21h16" />
        </>
      );
    case 'cercle-erreur':
      return (
        <>
          <path d="M12 7v6M12 16.5v.5" />
          <path d="M3 12a9 9 0 1018 0 9 9 0 10-18 0" />
        </>
      );
    case 'menu':
      return <path d="M4 6h16M4 12h16M4 18h16" />;
  }
}

export function Icone({ nom, taille = 16, titre }: IconeProps) {
  return (
    <svg
      className={styles.icone}
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titre ? 'img' : undefined}
      aria-hidden={titre ? undefined : true}
      aria-label={titre}
    >
      {trace(nom)}
    </svg>
  );
}
