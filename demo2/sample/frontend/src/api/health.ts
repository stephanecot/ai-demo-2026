import type { Health } from '../types/dto'
import { apiFetch } from './client'

/** GET /api/health — public: answers with or without the X-Demo-User header. */
export function getHealth(): Promise<Health> {
  return apiFetch<Health>('/api/health')
}
