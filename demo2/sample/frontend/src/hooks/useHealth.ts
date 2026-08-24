import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { getHealth } from '../api/health'
import type { Health } from '../types/dto'

/** The three states every remote call must expose. */
export type RemoteStatus = 'loading' | 'ready' | 'error'

export type UseHealthResult = {
  health: Health | null
  status: RemoteStatus
  error: string | null
  reload: () => void
}

const UNEXPECTED_ERROR_MESSAGE = 'Impossible de contacter l’API.'

export function useHealth(): UseHealthResult {
  const [health, setHealth] = useState<Health | null>(null)
  const [status, setStatus] = useState<RemoteStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  // State is only written from the promise callbacks, never synchronously in the effect.
  const load = useCallback(() => {
    getHealth()
      .then((data) => {
        setHealth(data)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        // The backend detail is French and displayable as is.
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

  return { health, status, error, reload }
}
