import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { getHealth } from '../api/health'
import type { Health } from '../types/dto'

vi.mock('../api/health')

const getHealthMock = vi.mocked(getHealth)

const healthyResponse: Health = {
  status: 'ok',
  version: '0.1.0',
  database: 'ok',
  time: '2026-08-24T09:30:00Z',
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getHealthMock.mockResolvedValue(healthyResponse)
  })

  it('affiche la page introuvable sur une URL inconnue', () => {
    renderAt('/inconnu')

    expect(screen.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeInTheDocument()
    expect(screen.getByText('Cette page n’existe pas ou a été déplacée.')).toBeInTheDocument()
  })

  it('propose un lien de retour vers l’accueil', async () => {
    const user = userEvent.setup()
    renderAt('/inconnu')

    const backLink = screen.getByRole('link', { name: 'Revenir à l’accueil' })
    expect(backLink).toHaveAttribute('href', '/')

    await user.click(backLink)

    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument()
  })

  it('rend le bandeau applicatif autour de la page', () => {
    renderAt('/inconnu')

    expect(screen.getByRole('banner')).toHaveTextContent('Compte rendu d’activité')
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
