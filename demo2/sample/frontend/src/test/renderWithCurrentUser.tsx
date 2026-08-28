import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { CurrentUserContext } from '../hooks/currentUserContext'
import type { CurrentUserContextValue } from '../hooks/currentUserContext'
import type { UserSummary } from '../types/dto'

/**
 * Renders `ui` under a `CurrentUserContext` set directly to `currentUser`, bypassing
 * `CurrentUserProvider` (which calls `GET /api/users`) — screens under test only need
 * the resolved identity, never the profile-picker's own loading behaviour.
 */
export function renderWithCurrentUser(
  ui: ReactElement,
  currentUser: UserSummary | null,
): RenderResult {
  const value: CurrentUserContextValue = {
    currentUser,
    users: currentUser === null ? [] : [currentUser],
    status: 'ready',
    error: null,
    selectUser: () => {
      // Not exercised by screens under test — they read the identity, never change it.
    },
  }
  return render(<CurrentUserContext.Provider value={value}>{ui}</CurrentUserContext.Provider>)
}
