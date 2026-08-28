import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { listUsers } from '../api/users'
import type { UserSummary } from '../types/dto'
import type { RemoteStatus } from './useMissions'

export type UseConsultantsResult = {
  consultants: UserSummary[]
  status: RemoteStatus
  error: string | null
  reload: () => void
}

const UNEXPECTED_ERROR_MESSAGE = 'Impossible de contacter l’API.'

/**
 * The consultant pool, used by the assignment picker and the manager-only filters.
 * A separate hook from `useMissions` because it reads a different resource
 * (`GET /api/users?role=CONSULTANT`).
 */
export function useConsultants(): UseConsultantsResult {
  const [consultants, setConsultants] = useState<UserSummary[]>([])
  const [status, setStatus] = useState<RemoteStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listUsers('CONSULTANT')
      .then((data) => {
        setConsultants(data)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : UNEXPECTED_ERROR_MESSAGE)
        setStatus('error')
      })
  }, [])

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    load()
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  return { consultants, status, error, reload }
}
