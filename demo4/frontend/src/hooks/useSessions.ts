import type { FiltreSessions } from '../api/sessions';
import { recupereSessions } from '../api/sessions';
import type { ResumeSession } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** La liste des sessions d'une période, filtrable par projet. « Vide » : aucune session. */
export function useSessions(filtre: FiltreSessions = {}): EtatRessource<readonly ResumeSession[]> {
  return useRessource<readonly ResumeSession[]>(
    (signal) => recupereSessions(filtre, signal),
    [filtre.debut, filtre.fin, filtre.projet],
    { estVide: (sessions) => sessions.length === 0 },
  );
}
