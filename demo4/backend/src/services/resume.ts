import { resume as resumeDomaine } from '../domain/agregation.js';
import { budgets, sessions } from './depot.js';
import { bornesPeriode, cycleEnCours, dureeEnJours, periodePrecedente } from './periodes.js';
import { sessionsDansLaPeriode } from './filtre.js';
import type { Resume } from '../types.js';

/** Plafond du budget d'organisation, ou 0 s'il n'y en a pas (portée = « organisation »). */
async function plafondGlobal(): Promise<number> {
  const tous = await budgets();
  const organisation = tous.find((b) => b.portee.startsWith('organisation'));
  return organisation?.plafond ?? 0;
}

export async function obtientResume(
  debutParam: string | undefined,
  finParam: string | undefined,
): Promise<Resume> {
  const { debut, fin } = bornesPeriode(debutParam, finParam);
  const toutes = await sessions();
  const dansLaPeriode = sessionsDansLaPeriode(toutes, debut, fin);

  const precedente = periodePrecedente(debut, fin);
  const sessionsPrecedentes = sessionsDansLaPeriode(toutes, precedente.debut, precedente.fin);
  // On n'a besoin que du coût de la période précédente ; `joursDuCycle` n'affecte
  // pas ce champ, donc sa durée propre suffit ici.
  const coutPeriodePrecedente = resumeDomaine(sessionsPrecedentes, {
    debut: precedente.debut,
    fin: precedente.fin,
    joursDuCycle: dureeEnJours(precedente.debut, precedente.fin),
  }).cout;

  const cycle = cycleEnCours();
  const plafond = await plafondGlobal();

  return resumeDomaine(dansLaPeriode, {
    debut,
    fin,
    joursDuCycle: cycle.jours,
    coutPeriodePrecedente,
    plafondGlobal: plafond,
  });
}
