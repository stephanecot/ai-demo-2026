import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { activeMission, closedMission, consultant, otherConsultant } from '../../test/fixtures'
import { AssigneePicker } from './AssigneePicker'

describe('AssigneePicker', () => {
  it('liste les consultants déjà affectés avec un bouton Détacher', () => {
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [consultant], status: 'ready', error: null }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('listitem')).toHaveTextContent(consultant.name)
    expect(
      screen.getByRole('button', { name: new RegExp(`détacher\\s*${consultant.name}`, 'i') }),
    ).toBeInTheDocument()
  })

  it('affiche un message quand aucun consultant n’est affecté', () => {
    render(
      <AssigneePicker
        mission={closedMission}
        consultants={{ data: [], status: 'ready', error: null }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Aucun consultant affecté pour le moment.')).toBeInTheDocument()
  })

  it('affiche le chargement puis les candidats disponibles', () => {
    const { rerender } = render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [], status: 'loading', error: null }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Chargement des consultants…')

    rerender(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [consultant, otherConsultant], status: 'ready', error: null }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('checkbox', { name: otherConsultant.name })).toBeInTheDocument()
    // Already assigned to this mission — must not be offered again.
    expect(screen.queryByRole('checkbox', { name: consultant.name })).not.toBeInTheDocument()
  })

  it('affiche l’erreur du backend quand les consultants sont indisponibles', () => {
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [], status: 'error', error: 'Action réservée aux managers.' }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Action réservée aux managers.')
  })

  it('affiche un message quand tous les consultants sont déjà affectés', () => {
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [consultant], status: 'ready', error: null }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Tous les consultants disponibles sont déjà affectés à cette mission.'),
    ).toBeInTheDocument()
  })

  it('affecte les consultants sélectionnés et vide la sélection', async () => {
    const user = userEvent.setup()
    const onAssign = vi.fn()
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [consultant, otherConsultant], status: 'ready', error: null }}
        onAssign={onAssign}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    const checkbox = screen.getByRole('checkbox', { name: otherConsultant.name })
    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: /^affecter$/i }))

    expect(onAssign).toHaveBeenCalledWith([otherConsultant.id])
    expect(checkbox).not.toBeChecked()
  })

  it('n’affecte rien si aucun consultant n’est sélectionné', () => {
    const onAssign = vi.fn()
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [consultant, otherConsultant], status: 'ready', error: null }}
        onAssign={onAssign}
        onDetach={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /^affecter$/i })).toBeDisabled()
    expect(onAssign).not.toHaveBeenCalled()
  })

  it('détache un consultant affecté', async () => {
    const user = userEvent.setup()
    const onDetach = vi.fn()
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [consultant], status: 'ready', error: null }}
        onAssign={vi.fn()}
        onDetach={onDetach}
        onClose={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: new RegExp(`détacher\\s*${consultant.name}`, 'i') }),
    )

    expect(onDetach).toHaveBeenCalledWith(consultant.id)
  })

  it('appelle onClose quand on ferme le panneau', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <AssigneePicker
        mission={activeMission}
        consultants={{ data: [], status: 'ready', error: null }}
        onAssign={vi.fn()}
        onDetach={vi.fn()}
        onClose={onClose}
      />,
    )

    await user.click(screen.getByRole('button', { name: /fermer/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
