import { parProjet } from '../domain/agregation.js';
import { sessions } from './depot.js';
import { bornesPeriode } from './periodes.js';
import { sessionsDansLaPeriode } from './filtre.js';
import type { LigneProjet } from '../types.js';

export async function obtientProjets(
  debutParam: string | undefined,
  finParam: string | undefined,
): Promise<readonly LigneProjet[]> {
  const { debut, fin } = bornesPeriode(debutParam, finParam);
  const toutes = await sessions();
  return parProjet(sessionsDansLaPeriode(toutes, debut, fin));
}
