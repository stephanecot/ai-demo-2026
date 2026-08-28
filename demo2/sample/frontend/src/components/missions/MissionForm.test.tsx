import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { activeMission } from '../../test/fixtures'
import { MissionForm } from './MissionForm'

describe('MissionForm', () => {
  it('affiche un formulaire vide en création', () => {
    render(<MissionForm onSubmit={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText('Libellé')).toHaveValue('')
    expect(screen.getByLabelText('Client')).toHaveValue('')
    expect(screen.getByRole('button', { name: /créer la mission/i })).toBeInTheDocument()
  })

  it('pré-remplit le formulaire avec la mission à modifier', () => {
    render(<MissionForm mission={activeMission} onSubmit={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText('Libellé')).toHaveValue(activeMission.label)
    expect(screen.getByLabelText('Client')).toHaveValue(activeMission.client)
    expect(
      screen.getByRole('button', { name: /enregistrer les modifications/i }),
    ).toBeInTheDocument()
  })

  it('affiche le message d’erreur du backend', () => {
    render(
      <MissionForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        error="Une mission « Refonte SI » existe déjà pour ce client."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Une mission « Refonte SI » existe déjà pour ce client.',
    )
  })

  it('soumet les valeurs saisies, avec une date de fin vide traitée comme absente', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    render(<MissionForm onSubmit={handleSubmit} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText('Libellé'), 'Support N2')
    await user.type(screen.getByLabelText('Client'), 'ACME')
    await user.type(screen.getByLabelText('Date de début'), '2026-03-01')
    await user.type(screen.getByLabelText('Description'), 'Support de niveau 2.')
    await user.click(screen.getByRole('button', { name: /créer la mission/i }))

    expect(handleSubmit).toHaveBeenCalledWith({
      label: 'Support N2',
      client: 'ACME',
      startDate: '2026-03-01',
      endDate: null,
      description: 'Support de niveau 2.',
    })
  })

  it('appelle onCancel quand on annule', async () => {
    const user = userEvent.setup()
    const handleCancel = vi.fn()
    render(<MissionForm onSubmit={vi.fn()} onCancel={handleCancel} />)

    await user.click(screen.getByRole('button', { name: /annuler/i }))

    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('désactive le bouton de soumission pendant l’enregistrement', () => {
    render(<MissionForm onSubmit={vi.fn()} onCancel={vi.fn()} submitting />)

    expect(screen.getByRole('button', { name: /créer la mission/i })).toBeDisabled()
  })
})
