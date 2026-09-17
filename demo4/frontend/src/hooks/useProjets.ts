import { recupereProjets } from '../api/projets';
import type { ParametresPeriode } from '../api/resume';
import type { LigneProjet } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** Le coût par projet sur une période. « Vide » : aucun projet actif. */
export function useProjets(periode: ParametresPeriode = {}): EtatRessource<readonly LigneProjet[]> {
  return useRessource<readonly LigneProjet[]>(
    (signal) => recupereProjets(periode, signal),
    [periode.debut, periode.fin],
    { estVide: (projets) => projets.length === 0 },
  );
}
