import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Health } from '../types/dto'
import { ApiError, apiFetch } from './client'
import { getHealth } from './health'

// Only the transport is mocked: `ApiError` stays the real class so `instanceof`
// keeps meaning something for the callers that branch on it.
vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)

const healthyResponse: Health = {
  status: 'ok',
  version: '0.1.0',
  database: 'ok',
  time: '2026-08-24T09:30:00Z',
}

describe('getHealth', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // Every screen mocks this module away, so the route it actually calls is
  // asserted nowhere else: a typo here breaks the app with a green suite.
  it('interroge la route /api/health et retourne la charge utile', async () => {
    apiFetchMock.mockResolvedValue(healthyResponse)

    await expect(getHealth()).resolves.toEqual(healthyResponse)
    expect(apiFetchMock).toHaveBeenCalledWith('/api/health')
  })

  // The screens display `ApiError.message` verbatim; wrapping the failure here
  // would replace the backend's French detail with a generic sentence.
  it('propage l’ApiError du client sans la réécrire', async () => {
    apiFetchMock.mockRejectedValue(new ApiError(503, 'Le service est momentanément arrêté.'))

    const error = await getHealth().catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 503, message: 'Le service est momentanément arrêté.' })
  })
})
