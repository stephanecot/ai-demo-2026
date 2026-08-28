import type { IsoDate, Mission, MissionCreate, MissionFilters } from '../types/dto'
import { apiFetch } from './client'

/** Builds `?a=1&b=2`, skipping every undefined filter. Returns '' when nothing is set. */
function toQuery(filters: MissionFilters): string {
  const params = new URLSearchParams()
  if (filters.client !== undefined && filters.client !== '') {
    params.set('client', filters.client)
  }
  if (filters.status !== undefined) {
    params.set('status', filters.status)
  }
  if (filters.userId !== undefined) {
    params.set('userId', String(filters.userId))
  }
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}

/** GET /api/missions — every mission for a manager, only their own for a consultant. */
export function listMissions(filters: MissionFilters = {}): Promise<Mission[]> {
  return apiFetch<Mission[]>(`/api/missions${toQuery(filters)}`)
}

/** GET /api/missions/disponibles — what the calling consultant may charge on `date`. */
export function listAvailableMissions(date: IsoDate): Promise<Mission[]> {
  return apiFetch<Mission[]>(`/api/missions/disponibles?date=${encodeURIComponent(date)}`)
}

/** GET /api/missions/{id} */
export function getMission(missionId: number): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}`)
}

/** POST /api/missions — manager only, 201. */
export function createMission(payload: MissionCreate): Promise<Mission> {
  return apiFetch<Mission>('/api/missions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** PUT /api/missions/{id} — manager only. */
export function updateMission(missionId: number, payload: MissionCreate): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** POST /api/missions/{id}/affectations — manager only, idempotent. */
export function assignConsultants(missionId: number, userIds: number[]): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}/affectations`, {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  })
}

/** DELETE /api/missions/{id}/affectations/{userId} — manager only, 204. */
export function detachConsultant(missionId: number, userId: number): Promise<void> {
  return apiFetch<void>(`/api/missions/${missionId}/affectations/${userId}`, {
    method: 'DELETE',
  })
}

/** POST /api/missions/{id}/cloture — manager only, idempotent. */
export function closeMission(missionId: number): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}/cloture`, { method: 'POST' })
}
