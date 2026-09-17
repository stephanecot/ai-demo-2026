import { detailSession, resumeSession } from '../domain/agregation.js';
import { sessions as sessionsDuDepot } from './depot.js';
import { bornesPeriode } from './periodes.js';
import { Introuvable } from '../erreurs.js';
import type { DetailSession, ResumeSession } from '../types.js';

/**
 * Liste des sessions actives sur la période : une session est retenue si son
 * intervalle `[debut, fin]` recoupe `[debut, fin]` de la période demandée
 * (contrairement aux agrégations, on garde ici la session entière — c'est une
 * liste, pas un total qui doit retomber sur les autres écrans).
 */
export async function listeSessions(
  debutParam: string | undefined,
  finParam: string | undefined,
  projet: string | undefined,
): Promise<readonly ResumeSession[]> {
  const { debut, fin } = bornesPeriode(debutParam, finParam);
  const toutes = await sessionsDuDepot();
  const filtrees = toutes.filter(
    (s) => s.fin >= debut && s.debut <= fin && (projet === undefined || s.projet === projet),
  );
  return filtrees.map(resumeSession).sort((a, b) => b.debut.localeCompare(a.debut));
}

export async function obtientDetailSession(id: string): Promise<DetailSession> {
  const toutes = await sessionsDuDepot();
  const trouvee = toutes.find((s) => s.id === id);
  if (trouvee === undefined) {
    throw new Introuvable(`Aucune session ne correspond à l'identifiant « ${id} ».`);
  }
  return detailSession(trouvee);
}
