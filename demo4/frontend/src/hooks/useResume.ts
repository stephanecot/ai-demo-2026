import type { ParametresPeriode } from '../api/resume';
import { recupereResume } from '../api/resume';
import type { Resume } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** Le résumé chiffré d'une période. « Vide » : aucun coût ni token sur la période. */
export function useResume(periode: ParametresPeriode = {}): EtatRessource<Resume> {
  return useRessource<Resume>(
    (signal) => recupereResume(periode, signal),
    [periode.debut, periode.fin],
    { estVide: (resume) => resume.cout === 0 && resume.tokens === 0 && resume.sessions === 0 },
  );
}
