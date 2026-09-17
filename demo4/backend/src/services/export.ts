import { additionne, coutUsage, tarifDe, totalTokens, usageVide } from '../domain/tarifs.js';
import { jourDe, partCache as partCacheDe, toursDe } from '../domain/agregation.js';
import { sessions } from './depot.js';
import { bornesPeriode } from './periodes.js';
import { sessionsDansLaPeriode } from './filtre.js';
import type { ModeleId, Usage } from '../types.js';

/** Une ligne de l'export CSV : un jour, un modèle. */
export interface LigneExportCsv {
  readonly date: string;
  readonly modele: ModeleId;
  readonly libelleModele: string;
  readonly cout: number;
  readonly tokens: number;
  readonly partCache: number;
}

export async function obtientLignesExport(
  debutParam: string | undefined,
  finParam: string | undefined,
): Promise<readonly LigneExportCsv[]> {
  const { debut, fin } = bornesPeriode(debutParam, finParam);
  const toutes = await sessions();
  const dansLaPeriode = sessionsDansLaPeriode(toutes, debut, fin);

  const parCle = new Map<string, { date: string; modele: ModeleId; usage: Usage }>();
  for (const tour of toursDe(dansLaPeriode)) {
    const date = jourDe(tour.horodatage);
    const cle = `${date}|${tour.modele}`;
    const existant = parCle.get(cle) ?? { date, modele: tour.modele, usage: usageVide() };
    existant.usage = additionne(existant.usage, tour.usage);
    parCle.set(cle, existant);
  }

  return [...parCle.values()]
    .map((ligne) => ({
      date: ligne.date,
      modele: ligne.modele,
      libelleModele: tarifDe(ligne.modele).libelle,
      cout: coutUsage(ligne.usage, ligne.modele),
      tokens: totalTokens(ligne.usage),
      partCache: partCacheDe(ligne.usage),
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.modele.localeCompare(b.modele));
}
