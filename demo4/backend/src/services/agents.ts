import { parAgent, parOutil, toursDe } from '../domain/agregation.js';
import { sessions } from './depot.js';
import { bornesPeriode } from './periodes.js';
import { sessionsDansLaPeriode } from './filtre.js';
import type { LigneAgent, LigneOutil } from '../types.js';

export interface ReponseAgents {
  readonly agents: readonly LigneAgent[];
  readonly outils: readonly LigneOutil[];
}

export async function obtientAgents(
  debutParam: string | undefined,
  finParam: string | undefined,
): Promise<ReponseAgents> {
  const { debut, fin } = bornesPeriode(debutParam, finParam);
  const toutes = await sessions();
  const tours = toursDe(sessionsDansLaPeriode(toutes, debut, fin));
  return { agents: parAgent(tours), outils: parOutil(tours) };
}
