import type { Sante } from '../types/api';
import { requeteApi } from './client';

/** `GET /api/sante` — diagnostic de démarrage : source active, cycle, synchro. */
export function recupereSante(signal?: AbortSignal): Promise<Sante> {
  return requeteApi<Sante>('/sante', undefined, signal);
}
