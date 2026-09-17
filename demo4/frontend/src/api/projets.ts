import type { LigneProjet } from '../types/api';
import { requeteApi } from './client';
import type { ParametresPeriode } from './resume';

interface ReponseProjets {
  readonly projets: readonly LigneProjet[];
}

/** `GET /api/projets?debut&fin` — le coût par projet sur la période. */
export async function recupereProjets(
  periode: ParametresPeriode = {},
  signal?: AbortSignal,
): Promise<readonly LigneProjet[]> {
  const reponse = await requeteApi<ReponseProjets>('/projets', { debut: periode.debut, fin: periode.fin }, signal);
  return reponse.projets;
}
