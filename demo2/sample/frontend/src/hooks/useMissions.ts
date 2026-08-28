import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import {
  assignConsultants,
  closeMission,
  createMission,
  detachConsultant,
  listMissions,
  updateMission,
} from '../api/missions'
import { useCurrentUser } from './currentUserContext'
import type { Mission, MissionCreate, MissionFilters } from '../types/dto'

export type RemoteStatus = 'loading' | 'ready' | 'error'

export type UseMissionsResult = {
  missions: Mission[]
  status: RemoteStatus
  /** Error of the list itself — the screen cannot render without it. */
  error: string | null
  /** Error of the last mutation — the screen still renders. */
  actionError: string | null
  saving: boolean
  reload: () => void
  create: (payload: MissionCreate) => Promise<boolean>
  update: (missionId: number, payload: MissionCreate) => Promise<boolean>
  assign: (missionId: number, userIds: number[]) => Promise<boolean>
  detach: (missionId: number, userId: number) => Promise<boolean>
  close: (missionId: number) => Promise<boolean>
  clearActionError: () => void
}

const UNEXPECTED_ERROR_MESSAGE = 'Impossible de contacter l’API.'

function messageOf(cause: unknown): string {
  // The backend `detail` is French and displayable as is (ADR-0002).
  return cause instanceof ApiError ? cause.message : UNEXPECTED_ERROR_MESSAGE
}

/**
 * One hook per resource. `filters` is passed to the server rather than applied here, so
 * a consultant never receives missions they may not see in the first place.
 */
export function useMissions(filters: MissionFilters = {}): UseMissionsResult {
  const { client, status: statusFilter, userId } = filters
  const { currentUser } = useCurrentUser()
  // The server filters by role from `X-Demo-User` (FR-025): the exact same query
  // string returns a different list for a manager and for a consultant. The header
  // itself is a module-level value in `api/client.ts` and triggers no re-render, so
  // the identity must be tracked here as a primitive to force a reload when it changes.
  const identityId = currentUser === null ? null : currentUser.id
  const [missions, setMissions] = useState<Mission[]>([])
  const [status, setStatus] = useState<RemoteStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Depend on the primitive filter values, not on the object: a caller passing an
  // inline `{}` would otherwise re-run the effect on every render.
  const load = useCallback(() => {
    // No demo identity yet: `X-Demo-User` would be omitted and the backend would
    // answer 401. Wait for a profile instead of firing a request bound to fail.
    if (identityId === null) {
      return
    }
    listMissions({ client, status: statusFilter, userId })
      .then((data) => {
        setMissions(data)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        setError(messageOf(cause))
        setStatus('error')
      })
  }, [client, statusFilter, userId, identityId])

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    load()
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  /** Runs a mutation, surfaces its French error, and re-reads the list on success. */
  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      setSaving(true)
      setActionError(null)
      try {
        await action()
        load()
        return true
      } catch (cause: unknown) {
        setActionError(messageOf(cause))
        return false
      } finally {
        setSaving(false)
      }
    },
    [load],
  )

  return {
    missions,
    status,
    error,
    actionError,
    saving,
    reload,
    create: useCallback((payload) => run(() => createMission(payload)), [run]),
    update: useCallback((id, payload) => run(() => updateMission(id, payload)), [run]),
    assign: useCallback((id, userIds) => run(() => assignConsultants(id, userIds)), [run]),
    detach: useCallback((id, userId) => run(() => detachConsultant(id, userId)), [run]),
    close: useCallback((id) => run(() => closeMission(id)), [run]),
    clearActionError: useCallback(() => setActionError(null), []),
  }
}
