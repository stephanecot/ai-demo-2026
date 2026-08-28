import type { UserRole, UserSummary } from '../types/dto'
import { apiFetch } from './client'

/**
 * GET /api/users — public, like /api/health, and for the same reason: it is what the
 * profile picker reads before anyone is identified.
 */
export function listUsers(role?: UserRole): Promise<UserSummary[]> {
  const query = role === undefined ? '' : `?role=${encodeURIComponent(role)}`
  return apiFetch<UserSummary[]>(`/api/users${query}`)
}
