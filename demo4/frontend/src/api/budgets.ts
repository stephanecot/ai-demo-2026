import type { EtatDuBudget, ReponseBudgets } from '../types/api';
import { requeteApi, requeteApiPatch } from './client';

/**
 * Corps de `PATCH /api/budgets/:id` — seuls les champs modifiés sont envoyés.
 *
 * `canaux` est la liste des **identifiants actifs**, pas la liste des canaux
 * avec leur état : c'est la forme de `Budget.canaux` dans les types de
 * référence du plan (§4.1). La réponse, elle, renvoie des `Canal` complets
 * (libellé, détail, `actif`) — l'aller et le retour n'ont pas la même forme.
 */
export interface CorpsPatchBudget {
  readonly plafond?: number;
  readonly seuils?: readonly number[];
  readonly canaux?: readonly string[];
}

/** `GET /api/budgets` — l'état calculé de chaque budget, plus les alertes récentes. */
export function recupereBudgets(signal?: AbortSignal): Promise<ReponseBudgets> {
  return requeteApi<ReponseBudgets>('/budgets', undefined, signal);
}

/** `PATCH /api/budgets/:id` — persistance en mémoire côté backend. */
export function modifieBudget(id: string, corps: CorpsPatchBudget, signal?: AbortSignal): Promise<EtatDuBudget> {
  return requeteApiPatch<EtatDuBudget>(`/budgets/${encodeURIComponent(id)}`, corps, signal);
}
