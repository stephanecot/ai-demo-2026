import { recupereBudgets } from '../api/budgets';
import type { ReponseBudgets } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** L'état de tous les budgets et les alertes récentes. « Vide » : aucun budget configuré. */
export function useBudgets(): EtatRessource<ReponseBudgets> {
  return useRessource<ReponseBudgets>(
    (signal) => recupereBudgets(signal),
    [],
    { estVide: (reponse) => reponse.budgets.length === 0 },
  );
}
