import { createContext, useContext } from 'react'
import type { UserSummary } from '../types/dto'

/**
 * Stubbed authentication ("authentification bouchonnée"): the demo identity is a profile
 * picked in the header, sent as `X-Demo-User` on every request and resolved server-side.
 * Borrowed from US-001 by US-002, which cannot enforce a manager-only rule without it.
 */
export type CurrentUserContextValue = {
  currentUser: UserSummary | null
  users: UserSummary[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
  selectUser: (userId: number | null) => void
}

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

export function useCurrentUser(): CurrentUserContextValue {
  const value = useContext(CurrentUserContext)
  if (value === null) {
    throw new Error('useCurrentUser must be used inside a CurrentUserProvider')
  }
  return value
}
