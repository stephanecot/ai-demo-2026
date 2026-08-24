import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  // The rule under test: an empty screen always explains itself in French —
  // a blank panel reads as a bug during a demo.
  it('affiche le message expliquant pourquoi l’écran est vide', () => {
    render(<EmptyState message="Aucune mission ne vous est affectée." />)

    expect(screen.getByText('Aucune mission ne vous est affectée.')).toBeInTheDocument()
  })

  it('n’ajoute pas de zone d’action quand aucune action n’est fournie', () => {
    render(<EmptyState message="Aucune mission ne vous est affectée." />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('affiche l’appel à l’action quand il est fourni', () => {
    render(
      <EmptyState
        message="Aucune mission ne vous est affectée."
        action={<button type="button">Créer une mission</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Créer une mission' })).toBeInTheDocument()
  })
})
