import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activeMission } from '../test/fixtures'
import type { MissionCreate } from '../types/dto'
import { ApiError, apiFetch } from './client'
import {
  assignConsultants,
  closeMission,
  createMission,
  detachConsultant,
  getMission,
  listAvailableMissions,
  listMissions,
  updateMission,
} from './missions'

// Only the transport is mocked — every route this module actually calls is
// asserted here, since every screen mocks this module away in its own tests.
vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)

const payload: MissionCreate = {
  label: 'Refonte SI',
  client: 'ACME',
  startDate: '2026-01-01',
  endDate: null,
  description: 'Refonte du SI de gestion.',
}

describe('api/missions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('liste les missions sans filtre', async () => {
    apiFetchMock.mockResolvedValue([activeMission])

    await expect(listMissions()).resolves.toEqual([activeMission])
    expect(apiFetchMock).toHaveBeenCalledWith('/api/missions')
  })

  it('combine les filtres client, statut et consultant en query string', async () => {
    apiFetchMock.mockResolvedValue([])

    await listMissions({ client: 'ACME', status: 'ACTIVE', userId: 2 })

    expect(apiFetchMock).toHaveBeenCalledWith('/api/missions?client=ACME&status=ACTIVE&userId=2')
  })

  it('ignore les filtres absents ou vides', async () => {
    apiFetchMock.mockResolvedValue([])

    await listMissions({ client: '' })

    expect(apiFetchMock).toHaveBeenCalledWith('/api/missions')
  })

  it('interroge /api/missions/disponibles avec la date encodée', async () => {
    apiFetchMock.mockResolvedValue([activeMission])

    await listAvailableMissions('2026-01-15')

    expect(apiFetchMock).toHaveBeenCalledWith('/api/missions/disponibles?date=2026-01-15')
  })

  it('récupère une mission par id', async () => {
    apiFetchMock.mockResolvedValue(activeMission)

    await expect(getMission(activeMission.id)).resolves.toEqual(activeMission)
    expect(apiFetchMock).toHaveBeenCalledWith(`/api/missions/${activeMission.id}`)
  })

  it('crée une mission en POST avec le payload sérialisé', async () => {
    apiFetchMock.mockResolvedValue(activeMission)

    await createMission(payload)

    expect(apiFetchMock).toHaveBeenCalledWith('/api/missions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('modifie une mission en PUT', async () => {
    apiFetchMock.mockResolvedValue(activeMission)

    await updateMission(activeMission.id, payload)

    expect(apiFetchMock).toHaveBeenCalledWith(`/api/missions/${activeMission.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('affecte des consultants en POST', async () => {
    apiFetchMock.mockResolvedValue(activeMission)

    await assignConsultants(activeMission.id, [2, 3])

    expect(apiFetchMock).toHaveBeenCalledWith(`/api/missions/${activeMission.id}/affectations`, {
      method: 'POST',
      body: JSON.stringify({ userIds: [2, 3] }),
    })
  })

  it('détache un consultant en DELETE', async () => {
    apiFetchMock.mockResolvedValue(undefined)

    await detachConsultant(activeMission.id, 2)

    expect(apiFetchMock).toHaveBeenCalledWith(`/api/missions/${activeMission.id}/affectations/2`, {
      method: 'DELETE',
    })
  })

  it('clôture une mission en POST', async () => {
    apiFetchMock.mockResolvedValue({ ...activeMission, status: 'CLOSED' })

    await closeMission(activeMission.id)

    expect(apiFetchMock).toHaveBeenCalledWith(`/api/missions/${activeMission.id}/cloture`, {
      method: 'POST',
    })
  })

  // The backend `detail` must reach the caller untouched — this module never wraps it.
  it('propage l’ApiError du client sans la réécrire', async () => {
    apiFetchMock.mockRejectedValue(
      new ApiError(409, 'Une mission « Refonte SI » existe déjà pour ce client.'),
    )

    const error = await createMission(payload).catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 409,
      message: 'Une mission « Refonte SI » existe déjà pour ce client.',
    })
  })
})
