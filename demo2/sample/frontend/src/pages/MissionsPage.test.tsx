import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import {
  assignConsultants,
  closeMission,
  createMission,
  detachConsultant,
  listMissions,
} from '../api/missions'
import { listUsers } from '../api/users'
import { CurrentUserContext } from '../hooks/currentUserContext'
import type { CurrentUserContextValue } from '../hooks/currentUserContext'
import { activeMission, closedMission, consultant, manager, otherConsultant } from '../test/fixtures'
import { renderWithCurrentUser } from '../test/renderWithCurrentUser'
import type { UserSummary } from '../types/dto'
import { MissionsPage } from './MissionsPage'

/** Same identity role (`MANAGER`) as `manager`, but a different person — used to prove
 * that switching between two managers still resets the filter card (fix 1). */
const otherManager: UserSummary = { id: 5, name: 'Paul Manager', role: 'MANAGER' }

function contextValue(currentUser: UserSummary | null): CurrentUserContextValue {
  return {
    currentUser,
    users: currentUser === null ? [] : [currentUser],
    status: 'ready',
    error: null,
    selectUser: () => {
      // Not exercised — these tests read the identity, never change it through the menu.
    },
  }
}

vi.mock('../api/missions')
vi.mock('../api/users')

const listMissionsMock = vi.mocked(listMissions)
const createMissionMock = vi.mocked(createMission)
const closeMissionMock = vi.mocked(closeMission)
const assignConsultantsMock = vi.mocked(assignConsultants)
const detachConsultantMock = vi.mocked(detachConsultant)
const listUsersMock = vi.mocked(listUsers)

describe('MissionsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listUsersMock.mockResolvedValue([consultant, otherConsultant])
  })

  it('affiche un indicateur de chargement avant la réponse de l’API', async () => {
    listMissionsMock.mockReturnValue(new Promise(() => {}))

    renderWithCurrentUser(<MissionsPage />, manager)

    expect(screen.getByRole('status')).toHaveTextContent('Chargement des missions…')
  })

  it('affiche les missions retournées par l’API à un manager', async () => {
    listMissionsMock.mockResolvedValue([activeMission])

    renderWithCurrentUser(<MissionsPage />, manager)

    expect(await screen.findByRole('cell', { name: activeMission.label })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nouvelle mission/i })).toBeInTheDocument()
  })

  it('affiche un message vide expliqué à un manager sans mission', async () => {
    listMissionsMock.mockResolvedValue([])

    renderWithCurrentUser(<MissionsPage />, manager)

    expect(await screen.findByText(/aucune mission ne correspond à ces filtres/i)).toBeInTheDocument()
  })

  it('affiche un message vide expliqué à un consultant sans affectation', async () => {
    listMissionsMock.mockResolvedValue([])

    renderWithCurrentUser(<MissionsPage />, consultant)

    expect(
      await screen.findByText(/vous n’êtes affecté à aucune mission pour le moment/i),
    ).toBeInTheDocument()
  })

  it('affiche le message d’erreur du backend', async () => {
    listMissionsMock.mockRejectedValue(new ApiError(500, 'Le service est momentanément arrêté.'))

    renderWithCurrentUser(<MissionsPage />, manager)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le service est momentanément arrêté.',
    )
  })

  it('crée une mission depuis le formulaire et rafraîchit la liste', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([])
    createMissionMock.mockResolvedValue(activeMission)

    renderWithCurrentUser(<MissionsPage />, manager)

    await user.click(await screen.findByRole('button', { name: /nouvelle mission/i }))
    const form = within(screen.getByRole('form', { name: 'Nouvelle mission' }))
    await user.type(form.getByLabelText('Libellé'), 'Refonte SI')
    await user.type(form.getByLabelText('Client'), 'ACME')
    await user.type(form.getByLabelText('Date de début'), '2026-01-01')
    await user.click(form.getByRole('button', { name: /créer la mission/i }))

    await waitFor(() => {
      expect(createMissionMock).toHaveBeenCalledWith({
        label: 'Refonte SI',
        client: 'ACME',
        startDate: '2026-01-01',
        endDate: null,
        description: '',
      })
    })
    expect(listMissionsMock).toHaveBeenCalledTimes(2)
  })

  it('ne propose aucun contrôle de gestion à un consultant', async () => {
    listMissionsMock.mockResolvedValue([activeMission])

    renderWithCurrentUser(<MissionsPage />, consultant)

    await screen.findByRole('cell', { name: activeMission.label })

    expect(screen.queryByRole('button', { name: /nouvelle mission/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /modifier/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /affecter/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /clôturer/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Statut')).not.toBeInTheDocument()
  })

  it('clôture une mission depuis le catalogue', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([activeMission])
    closeMissionMock.mockResolvedValue({ ...activeMission, status: 'CLOSED' })

    renderWithCurrentUser(<MissionsPage />, manager)

    await user.click(await screen.findByRole('button', { name: /clôturer\s*refonte si/i }))

    expect(closeMissionMock).toHaveBeenCalledWith(activeMission.id)
    await waitFor(() => expect(listMissionsMock).toHaveBeenCalledTimes(2))
  })

  it('affecte un consultant depuis le panneau d’affectation', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([activeMission])
    assignConsultantsMock.mockResolvedValue({
      ...activeMission,
      assignees: [consultant, otherConsultant],
    })

    renderWithCurrentUser(<MissionsPage />, manager)

    await user.click(
      await screen.findByRole('button', { name: /affecter\s*des consultants à refonte si/i }),
    )
    await user.click(await screen.findByRole('checkbox', { name: otherConsultant.name }))
    await user.click(screen.getByRole('button', { name: /^affecter$/i }))

    expect(assignConsultantsMock).toHaveBeenCalledWith(activeMission.id, [otherConsultant.id])
  })

  it('détache un consultant depuis le panneau d’affectation', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([activeMission])
    detachConsultantMock.mockResolvedValue(undefined)

    renderWithCurrentUser(<MissionsPage />, manager)

    await user.click(
      await screen.findByRole('button', { name: /affecter\s*des consultants à refonte si/i }),
    )
    await user.click(
      await screen.findByRole('button', { name: new RegExp(`détacher\\s*${consultant.name}`, 'i') }),
    )

    expect(detachConsultantMock).toHaveBeenCalledWith(activeMission.id, consultant.id)
  })

  it('filtre le catalogue par statut sans filtrage côté client', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValueOnce([activeMission, closedMission])
    listMissionsMock.mockResolvedValueOnce([closedMission])

    renderWithCurrentUser(<MissionsPage />, manager)

    await screen.findByRole('cell', { name: activeMission.label })

    await user.selectOptions(screen.getByLabelText('Statut'), 'CLOSED')

    await waitFor(() => {
      expect(listMissionsMock).toHaveBeenLastCalledWith({
        client: undefined,
        status: 'CLOSED',
        userId: undefined,
      })
    })
  })

  // Regression pin for fix 2: the very first render, before any profile is chosen,
  // must not fire a doomed 401 request — the guard belongs inside `useMissions`.
  it('n’interroge jamais l’API tant qu’aucun profil n’est sélectionné', async () => {
    renderWithCurrentUser(<MissionsPage />, null)

    expect(
      await screen.findByText(/choisissez un profil de démonstration/i),
    ).toBeInTheDocument()
    expect(listMissionsMock).not.toHaveBeenCalled()
  })

  // Regression pin for fix 1 (page half): the filter card stays hidden for a
  // consultant, so a filter left over from a previous manager profile would be
  // invisible and impossible to clear — it must reset itself on every identity change.
  it('réinitialise les filtres quand l’identité change de profil', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([activeMission, closedMission])

    const { rerender } = render(
      <CurrentUserContext.Provider value={contextValue(manager)}>
        <MissionsPage />
      </CurrentUserContext.Provider>,
    )

    await screen.findByRole('cell', { name: activeMission.label })
    await user.selectOptions(screen.getByLabelText('Statut'), 'Clôturée')
    expect(screen.getByLabelText('Statut')).toHaveValue('CLOSED')

    rerender(
      <CurrentUserContext.Provider value={contextValue(otherManager)}>
        <MissionsPage />
      </CurrentUserContext.Provider>,
    )

    await waitFor(() => expect(screen.getByLabelText('Statut')).toHaveValue(''))
  })

  // Regression pin for fix 5: closing the form after a failed mutation must not leave
  // the stale validation error floating above the (now empty) catalogue.
  it('efface l’erreur de mutation quand le formulaire est annulé', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([])
    createMissionMock.mockRejectedValue(new ApiError(422, 'Le libellé est obligatoire.'))

    renderWithCurrentUser(<MissionsPage />, manager)

    await user.click(await screen.findByRole('button', { name: /nouvelle mission/i }))
    const form = within(screen.getByRole('form', { name: 'Nouvelle mission' }))
    await user.type(form.getByLabelText('Client'), 'ACME')
    await user.type(form.getByLabelText('Date de début'), '2026-01-01')
    await user.click(form.getByRole('button', { name: /créer la mission/i }))

    await screen.findByText('Le libellé est obligatoire.')

    await user.click(form.getByRole('button', { name: /annuler/i }))

    expect(screen.queryByText('Le libellé est obligatoire.')).not.toBeInTheDocument()
  })

  // Regression pin for fix 5: closing the assignee panel after a failed mutation must
  // not leave the stale error floating above the catalogue either.
  it('efface l’erreur de mutation quand le panneau d’affectation est fermé', async () => {
    const user = userEvent.setup()
    listMissionsMock.mockResolvedValue([activeMission])
    assignConsultantsMock.mockRejectedValue(new ApiError(409, 'Ce consultant est déjà affecté.'))

    renderWithCurrentUser(<MissionsPage />, manager)

    await user.click(
      await screen.findByRole('button', { name: /affecter\s*des consultants à refonte si/i }),
    )
    await user.click(await screen.findByRole('checkbox', { name: otherConsultant.name }))
    await user.click(screen.getByRole('button', { name: /^affecter$/i }))

    await screen.findByText('Ce consultant est déjà affecté.')

    await user.click(screen.getByRole('button', { name: /fermer/i }))

    expect(screen.queryByText('Ce consultant est déjà affecté.')).not.toBeInTheDocument()
  })
})
