import type { Resume } from '../types/api';
import { requeteApi, requeteApiTexte } from './client';

/** Bornes de période inclusives ; absentes, le backend retombe sur le cycle en cours. */
export interface ParametresPeriode {
  readonly debut?: string;
  readonly fin?: string;
}

/** `GET /api/resume?debut&fin` — le résumé chiffré d'une période. */
export function recupereResume(periode: ParametresPeriode = {}, signal?: AbortSignal): Promise<Resume> {
  return requeteApi<Resume>('/resume', { debut: periode.debut, fin: periode.fin }, signal);
}

/** `GET /api/export.csv?debut&fin` — l'export CSV brut (séparateur `;`, en-têtes en français). */
export function recupereExportCsv(periode: ParametresPeriode = {}, signal?: AbortSignal): Promise<string> {
  return requeteApiTexte('/export.csv', { debut: periode.debut, fin: periode.fin }, signal);
}
