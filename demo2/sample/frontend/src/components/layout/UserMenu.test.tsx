import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CurrentUserContext } from '../../hooks/currentUserContext'
import type { CurrentUserContextValue } from '../../hooks/currentUserContext'
import { consultant, manager } from '../../test/fixtures'
import { UserMenu } from './UserMenu'

function renderWithContext(value: CurrentUserContextValue) {
  return render(
    <CurrentUserContext.Provider value={value}>
      <UserMenu />
    </CurrentUserContext.Provider>,
  )
}

describe('UserMenu', () => {
  it('affiche un message de chargement pendant la récupération des profils', () => {
    renderWithContext({
      currentUser: null,
      users: [],
      status: 'loading',
      error: null,
      selectUser: vi.fn(),
    })

    expect(screen.getByText('Chargement des profils…')).toBeInTheDocument()
  })

  // Fix 4: the menu must relay the provider's own French message (FR-028), never a
  // generic label that hides why the profile picker is unavailable.
  it('affiche le message d’erreur réel du provider, pas un libellé générique', () => {
    renderWithContext({
      currentUser: null,
      users: [],
      status: 'error',
      error: 'Impossible de charger les profils de démonstration.',
      selectUser: vi.fn(),
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Impossible de charger les profils de démonstration.',
    )
  })

  it('liste les profils avec leur rôle en français', () => {
    renderWithContext({
      currentUser: null,
      users: [manager, consultant],
      status: 'ready',
      error: null,
      selectUser: vi.fn(),
    })

    expect(screen.getByRole('option', { name: `${manager.name} — Manager` })).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: `${consultant.name} — Consultant` }),
    ).toBeInTheDocument()
  })

  it('sélectionne un profil et le transmet au provider', async () => {
    const user = userEvent.setup()
    const selectUser = vi.fn()
    renderWithContext({
      currentUser: null,
      users: [manager, consultant],
      status: 'ready',
      error: null,
      selectUser,
    })

    await user.selectOptions(screen.getByLabelText('Profil'), String(consultant.id))

    expect(selectUser).toHaveBeenCalledWith(consultant.id)
  })

  it('efface le profil sélectionné en revenant au choix vide', async () => {
    const user = userEvent.setup()
    const selectUser = vi.fn()
    renderWithContext({
      currentUser: manager,
      users: [manager, consultant],
      status: 'ready',
      error: null,
      selectUser,
    })

    await user.selectOptions(screen.getByLabelText('Profil'), '')

    expect(selectUser).toHaveBeenCalledWith(null)
  })
})
