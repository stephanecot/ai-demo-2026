import type { Reglages } from '../types/api';
import { requeteApi } from './client';

/** `GET /api/reglages` — réglages en lecture seule (source, cycle, tarifs). */
export function recupereReglages(signal?: AbortSignal): Promise<Reglages> {
  return requeteApi<Reglages>('/reglages', undefined, signal);
}
