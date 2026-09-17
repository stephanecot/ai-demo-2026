import type { LigneAgent, LigneOutil } from '../types/api';
import { requeteApi } from './client';
import type { ParametresPeriode } from './resume';

export interface ReponseAgents {
  readonly agents: readonly LigneAgent[];
  readonly outils: readonly LigneOutil[];
}

/** `GET /api/agents?debut&fin` — le coût par agent et par outil sur la période. */
export function recupereAgents(periode: ParametresPeriode = {}, signal?: AbortSignal): Promise<ReponseAgents> {
  return requeteApi<ReponseAgents>('/agents', { debut: periode.debut, fin: periode.fin }, signal);
}
