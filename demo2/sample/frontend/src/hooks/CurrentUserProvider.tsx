import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { setCurrentUserId } from '../api/client'
import { listUsers } from '../api/users'
import type { UserSummary } from '../types/dto'
import { CurrentUserContext } from './currentUserContext'

const LOAD_ERROR_MESSAGE = 'Impossible de charger les profils de démonstration.'

/** Loads the demo profiles and owns the selected one. Single writer of `X-Demo-User`. */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listUsers()
      .then((loaded) => {
        setUsers(loaded)
        setStatus('ready')
      })
      .catch(() => {
        setError(LOAD_ERROR_MESSAGE)
        setStatus('error')
      })
  }, [])

  /**
   * INVARIANT (see `src/api/client.ts`): this is the only writer of the header, and it
   * sets it in the same call that sets the context value — never one without the other.
   */
  const selectUser = useCallback(
    (userId: number | null) => {
      const selected = userId === null ? null : (users.find((u) => u.id === userId) ?? null)
      setCurrentUser(selected)
      setCurrentUserId(selected === null ? null : String(selected.id))
    },
    [users],
  )

  return (
    <CurrentUserContext.Provider value={{ currentUser, users, status, error, selectUser }}>
      {children}
    </CurrentUserContext.Provider>
  )
}
