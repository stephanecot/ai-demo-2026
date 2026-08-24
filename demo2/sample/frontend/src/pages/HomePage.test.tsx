import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { getHealth } from '../api/health'
import type { Health } from '../types/dto'
import { HomePage } from './HomePage'

vi.mock('../api/health')

const getHealthMock = vi.mocked(getHealth)

const healthyResponse: Health = {
  status: 'ok',
  version: '0.1.0',
  database: 'ok',
  time: '2026-08-24T09:30:00Z',
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('affiche l’indicateur de chargement avant la réponse de l’API', async () => {
    getHealthMock.mockResolvedValue(healthyResponse)

    render(<HomePage />)

    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    expect(await screen.findByText('API disponible — version 0.1.0')).toBeInTheDocument()
  })

  it('affiche la version et l’état de la base quand l’API répond', async () => {
    getHealthMock.mockResolvedValue(healthyResponse)

    render(<HomePage />)

    expect(await screen.findByText('API disponible — version 0.1.0')).toBeInTheDocument()
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('affiche l’état dégradé quand la base de données est indisponible', async () => {
    getHealthMock.mockResolvedValue({
      ...healthyResponse,
      status: 'degraded',
      database: 'ko',
    })

    render(<HomePage />)

    expect(await screen.findByText('API dégradée — version 0.1.0')).toBeInTheDocument()
    expect(screen.getByText('Indisponible')).toBeInTheDocument()
  })

  it('affiche le message d’erreur du backend quand l’appel échoue', async () => {
    getHealthMock.mockRejectedValue(new ApiError(500, 'Le service est momentanément arrêté.'))

    render(<HomePage />)

    expect(await screen.findByText('API indisponible')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Le service est momentanément arrêté.')
  })

  // The hook's fallback branch: a failure that is not an `ApiError` (a bug in the
  // client, a rejected promise from elsewhere) still has to reach the user in French.
  it('affiche un message français quand l’échec ne vient pas de l’API', async () => {
    getHealthMock.mockRejectedValue(new TypeError('Failed to fetch'))

    render(<HomePage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de contacter l’API.')
  })

  it('relance l’appel quand l’utilisateur clique sur Réessayer', async () => {
    const user = userEvent.setup()
    getHealthMock.mockRejectedValueOnce(new ApiError(0, 'Impossible de contacter le serveur.'))
    getHealthMock.mockResolvedValue(healthyResponse)

    render(<HomePage />)

    await user.click(await screen.findByRole('button', { name: /réessayer/i }))

    expect(await screen.findByText('API disponible — version 0.1.0')).toBeInTheDocument()
    expect(getHealthMock).toHaveBeenCalledTimes(2)
  })
})
