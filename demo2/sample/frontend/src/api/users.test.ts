import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { listUsers } from './users'
import { consultant, manager } from '../test/fixtures'

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)

describe('listUsers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('appelle GET /api/users sans filtre quand aucun rôle n’est fourni', async () => {
    apiFetchMock.mockResolvedValue([manager, consultant])

    const users = await listUsers()

    expect(apiFetchMock).toHaveBeenCalledWith('/api/users')
    expect(users).toEqual([manager, consultant])
  })

  it('filtre par rôle, encodé dans la query string', async () => {
    apiFetchMock.mockResolvedValue([consultant])

    await listUsers('CONSULTANT')

    expect(apiFetchMock).toHaveBeenCalledWith('/api/users?role=CONSULTANT')
  })
})
