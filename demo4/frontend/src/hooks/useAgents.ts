import type { ReponseAgents } from '../api/agents';
import { recupereAgents } from '../api/agents';
import type { ParametresPeriode } from '../api/resume';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** Le coût par agent et par outil sur une période. « Vide » : aucune activité. */
export function useAgents(periode: ParametresPeriode = {}): EtatRessource<ReponseAgents> {
  return useRessource<ReponseAgents>(
    (signal) => recupereAgents(periode, signal),
    [periode.debut, periode.fin],
    { estVide: (reponse) => reponse.agents.length === 0 && reponse.outils.length === 0 },
  );
}
