import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getCurrentUserId, setCurrentUserId } from '../api/client'
import { listUsers } from '../api/users'
import { consultant, manager } from '../test/fixtures'
import { CurrentUserProvider } from './CurrentUserProvider'
import { useCurrentUser } from './currentUserContext'

vi.mock('../api/users')

const listUsersMock = vi.mocked(listUsers)

/** Minimal consumer, queried the way a real screen would be: by role and text. */
function Consumer() {
  const { currentUser, users, status, error, selectUser } = useCurrentUser()

  if (status === 'loading') {
    return <p>Chargement…</p>
  }
  if (status === 'error') {
    return (
      <p role="alert">{error}</p>
    )
  }

  return (
    <div>
      <p>Utilisateur actuel : {currentUser === null ? 'aucun' : currentUser.name}</p>
      {users.map((user) => (
        <button key={user.id} type="button" onClick={() => selectUser(user.id)}>
          {user.name}
        </button>
      ))}
      <button type="button" onClick={() => selectUser(999)}>
        Choisir un profil inconnu
      </button>
      <button type="button" onClick={() => selectUser(null)}>
        Se déconnecter
      </button>
    </div>
  )
}

describe('CurrentUserProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setCurrentUserId(null)
  })

  afterEach(() => {
    setCurrentUserId(null)
  })

  it('charge les profils au montage et les expose', async () => {
    listUsersMock.mockResolvedValue([manager, consultant])

    render(
      <CurrentUserProvider>
        <Consumer />
      </CurrentUserProvider>,
    )

    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: manager.name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: consultant.name })).toBeInTheDocument()
    expect(screen.getByText('Utilisateur actuel : aucun')).toBeInTheDocument()
  })

  it('expose le message français du provider quand le chargement échoue', async () => {
    listUsersMock.mockRejectedValue(new Error('boom'))

    render(
      <CurrentUserProvider>
        <Consumer />
      </CurrentUserProvider>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les profils de démonstration.',
    )
  })

  // Pins the INVARIANT documented in `src/api/client.ts`: `selectUser` MUST call
  // `setCurrentUserId` in the very same gesture that sets the context's `currentUser`.
  // Removing that call breaks no assertion on the context value alone — only reading
  // the header's backing store, as done here, catches it.
  it('pousse l’identité choisie vers X-Demo-User en même temps que le contexte', async () => {
    const user = userEvent.setup()
    listUsersMock.mockResolvedValue([manager, consultant])

    render(
      <CurrentUserProvider>
        <Consumer />
      </CurrentUserProvider>,
    )

    await user.click(await screen.findByRole('button', { name: manager.name }))

    expect(await screen.findByText(`Utilisateur actuel : ${manager.name}`)).toBeInTheDocument()
    expect(getCurrentUserId()).toBe(String(manager.id))

    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }))

    expect(await screen.findByText('Utilisateur actuel : aucun')).toBeInTheDocument()
    expect(getCurrentUserId()).toBeNull()
  })

  it('ignore un identifiant qui ne correspond à aucun profil chargé', async () => {
    const user = userEvent.setup()
    listUsersMock.mockResolvedValue([manager, consultant])

    render(
      <CurrentUserProvider>
        <Consumer />
      </CurrentUserProvider>,
    )

    await user.click(await screen.findByRole('button', { name: 'Choisir un profil inconnu' }))

    expect(await screen.findByText('Utilisateur actuel : aucun')).toBeInTheDocument()
    expect(getCurrentUserId()).toBeNull()
  })
})
