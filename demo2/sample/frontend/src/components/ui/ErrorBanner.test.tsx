import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBanner } from './ErrorBanner'

describe('ErrorBanner', () => {
  // The rule under test: the backend `detail` is shown verbatim, never replaced
  // by a generic sentence — and announced, since it appears after the render.
  it('affiche le message du backend tel quel dans une alerte', () => {
    render(<ErrorBanner message="Ce CRA est déjà soumis." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Ce CRA est déjà soumis.')
  })

  it('ne propose pas de reprise quand aucune action de reprise n’est fournie', () => {
    render(<ErrorBanner message="Action réservée aux managers." />)

    expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument()
  })

  it('relance l’appel au clic sur Réessayer', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorBanner message="Impossible de contacter le serveur." onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Réessayer' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
