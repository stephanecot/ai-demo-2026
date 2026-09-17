/**
 * Correspondance entre les énumérations du backend (état d'un budget,
 * sévérité d'une alerte) et les tonalités/icônes du design system. Centralisé
 * ici pour que `CarteBudget`, `PanneauAlertes` et `ReglageBudget` portent
 * exactement la même icône et la même couleur pour un même état — jamais la
 * couleur seule (voir le skill design-system).
 */
import type { NomIcone, ToneBadge, ToneEncart, ToneJauge } from '../../components/ui';
import type { EtatBudget, SeveriteAlerte } from '../../types/api';

export interface VisuelEtat {
  readonly tone: ToneJauge & ToneEncart;
  readonly badge: ToneBadge;
  readonly icone: NomIcone;
}

const VISUELS_ETAT: Record<EtatBudget, VisuelEtat> = {
  'dans-le-budget': { tone: 'ok', badge: 'etat-ok', icone: 'coche' },
  'a-surveiller': { tone: 'vigilance', badge: 'etat-vigilance', icone: 'alerte' },
  'limite-atteinte': { tone: 'limite', badge: 'etat-limite', icone: 'alerte' },
  'depassement-prevu': { tone: 'depassement', badge: 'etat-depassement', icone: 'cercle-erreur' },
};

/** Icône et tonalité (badge, jauge, encart) associées à l'état d'un budget. */
export function visuelEtat(etat: EtatBudget): VisuelEtat {
  return VISUELS_ETAT[etat];
}

export interface VisuelSeverite {
  readonly tone: ToneEncart;
  readonly icone: NomIcone;
}

const VISUELS_SEVERITE: Record<SeveriteAlerte, VisuelSeverite> = {
  critique: { tone: 'depassement', icone: 'cercle-erreur' },
  limite: { tone: 'limite', icone: 'alerte' },
  info: { tone: 'vigilance', icone: 'alerte' },
  reglage: { tone: 'ok', icone: 'coche' },
};

/** Icône et tonalité associées à la sévérité d'une alerte. */
export function visuelSeverite(severite: SeveriteAlerte): VisuelSeverite {
  return VISUELS_SEVERITE[severite];
}
