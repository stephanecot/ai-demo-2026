import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { createMission, listMissions } from '../api/missions'
import { activeMission, closedMission, consultant, manager } from '../test/fixtures'
import { CurrentUserContext } from './currentUserContext'
import type { CurrentUserContextValue } from './currentUserContext'
import type { UserSummary } from '../types/dto'
import { useMissions } from './useMissions'

vi.mock('../api/missions')

const listMissionsMock = vi.mocked(listMissions)
const createMissionMock = vi.mocked(createMission)

/**
 * A `CurrentUserContext.Provider` whose identity can be swapped between renders by
 * mutating `currentUser.value` and calling `rerender()` — the whole point of these
 * tests is to prove `useMissions` reacts to that change (fix 1) and refuses to fetch
 * before it happens at all (fix 2).
 */
function makeWrapper(currentUser: { value: UserSummary | null }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const value: CurrentUserContextValue = {
      currentUser: currentUser.value,
      users: currentUser.value === null ? [] : [currentUser.value],
      status: 'ready',
      error: null,
      selectUser: () => {
        // Not exercised here — `useMissions` only reads the identity, never sets it.
      },
    }
    return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  }
}

describe('useMissions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('ne déclenche aucune requête tant qu’aucune identité n’est sélectionnée', async () => {
    const currentUser = { value: null }
    const { result } = renderHook(() => useMissions(), { wrapper: makeWrapper(currentUser) })

    // Give any accidental effect a chance to fire before asserting its absence.
    await Promise.resolve()

    expect(listMissionsMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe('loading')
  })

  it('charge le catalogue dès qu’une identité est sélectionnée', async () => {
    listMissionsMock.mockResolvedValue([activeMission])
    const currentUser = { value: manager }

    const { result } = renderHook(() => useMissions(), { wrapper: makeWrapper(currentUser) })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.missions).toEqual([activeMission])
    expect(listMissionsMock).toHaveBeenCalledWith({
      client: undefined,
      status: undefined,
      userId: undefined,
    })
  })

  // Regression pin for fix 1: a manager viewing "Audit sécurité" who switches to a
  // consultant must stop seeing it — the list must be re-read under the new identity,
  // not left stale from the previous one.
  it('recharge le catalogue quand l’utilisateur courant change de profil', async () => {
    const currentUser = { value: manager }
    listMissionsMock.mockResolvedValueOnce([activeMission])

    const { result, rerender } = renderHook(() => useMissions(), {
      wrapper: makeWrapper(currentUser),
    })

    await waitFor(() => expect(result.current.missions).toEqual([activeMission]))
    expect(listMissionsMock).toHaveBeenCalledTimes(1)

    listMissionsMock.mockResolvedValueOnce([closedMission])
    currentUser.value = consultant
    rerender()

    await waitFor(() => expect(listMissionsMock).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.missions).toEqual([closedMission]))
  })

  it('expose le message français du backend quand le chargement échoue', async () => {
    const currentUser = { value: manager }
    listMissionsMock.mockRejectedValue(new ApiError(500, 'Le service est momentanément arrêté.'))

    const { result } = renderHook(() => useMissions(), { wrapper: makeWrapper(currentUser) })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Le service est momentanément arrêté.')
  })

  it('relance le chargement via reload', async () => {
    const currentUser = { value: manager }
    listMissionsMock.mockResolvedValueOnce([activeMission])

    const { result } = renderHook(() => useMissions(), { wrapper: makeWrapper(currentUser) })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    listMissionsMock.mockResolvedValueOnce([activeMission, closedMission])
    act(() => {
      result.current.reload()
    })

    await waitFor(() =>
      expect(result.current.missions).toEqual([activeMission, closedMission]),
    )
    expect(listMissionsMock).toHaveBeenCalledTimes(2)
  })

  it('expose l’erreur d’une mutation sans effacer la liste déjà affichée', async () => {
    const currentUser = { value: manager }
    listMissionsMock.mockResolvedValue([activeMission])
    createMissionMock.mockRejectedValue(new ApiError(422, 'Le libellé est obligatoire.'))

    const { result } = renderHook(() => useMissions(), { wrapper: makeWrapper(currentUser) })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let succeeded: boolean | undefined
    await act(async () => {
      succeeded = await result.current.create({
        label: '',
        client: 'ACME',
        startDate: '2026-01-01',
        endDate: null,
        description: '',
      })
    })

    expect(succeeded).toBe(false)
    expect(result.current.actionError).toBe('Le libellé est obligatoire.')
    expect(result.current.missions).toEqual([activeMission])
  })

  it('efface l’erreur de mutation via clearActionError', async () => {
    const currentUser = { value: manager }
    listMissionsMock.mockResolvedValue([activeMission])
    createMissionMock.mockRejectedValue(new ApiError(422, 'Le libellé est obligatoire.'))

    const { result } = renderHook(() => useMissions(), { wrapper: makeWrapper(currentUser) })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await result.current.create({
        label: '',
        client: 'ACME',
        startDate: '2026-01-01',
        endDate: null,
        description: '',
      })
    })
    expect(result.current.actionError).not.toBeNull()

    act(() => {
      result.current.clearActionError()
    })

    expect(result.current.actionError).toBeNull()
  })
})
