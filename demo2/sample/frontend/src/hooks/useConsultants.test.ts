import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listUsers } from '../api/users'
import { ApiError } from '../api/client'
import { consultant, otherConsultant } from '../test/fixtures'
import { useConsultants } from './useConsultants'

vi.mock('../api/users')

const listUsersMock = vi.mocked(listUsers)

describe('useConsultants', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('charge les consultants au montage', async () => {
    listUsersMock.mockResolvedValue([consultant, otherConsultant])

    const { result } = renderHook(() => useConsultants())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.consultants).toEqual([consultant, otherConsultant])
    expect(listUsersMock).toHaveBeenCalledWith('CONSULTANT')
  })

  it('expose le message français du backend en cas d’échec', async () => {
    listUsersMock.mockRejectedValue(new ApiError(403, 'Action réservée aux managers.'))

    const { result } = renderHook(() => useConsultants())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Action réservée aux managers.')
  })

  it('retombe sur un message français quand l’échec ne vient pas de l’API', async () => {
    listUsersMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useConsultants())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Impossible de contacter l’API.')
  })

  it('relance le chargement via reload', async () => {
    listUsersMock.mockResolvedValue([consultant])

    const { result } = renderHook(() => useConsultants())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    listUsersMock.mockResolvedValue([consultant, otherConsultant])
    result.current.reload()

    await waitFor(() => expect(result.current.consultants).toEqual([consultant, otherConsultant]))
  })
})
