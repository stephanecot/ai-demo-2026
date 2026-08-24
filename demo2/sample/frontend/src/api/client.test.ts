import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, getCurrentUserId, setCurrentUserId } from './client'

/** Minimal Response builders — jsdom provides the real `Response`/`Headers`. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function htmlResponse(status: number): Response {
  return new Response('<html><body>502 Bad Gateway</body></html>', {
    status,
    headers: { 'Content-Type': 'text/html' },
  })
}

/** The `Headers` of the single recorded call. */
function requestHeaders(fetchMock: ReturnType<typeof vi.fn>): Headers {
  const call: unknown = fetchMock.mock.calls[0]?.[1]
  if (typeof call !== 'object' || call === null || !('headers' in call)) {
    throw new Error('fetch was called without an init object')
  }
  const headers: unknown = call.headers
  if (!(headers instanceof Headers)) {
    throw new Error('fetch was called without a Headers instance')
  }
  return headers
}

describe('apiFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    setCurrentUserId(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setCurrentUserId(null)
  })

  it('envoie l’en-tête X-Demo-User quand un utilisateur est sélectionné', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }))
    setCurrentUserId('1')

    await apiFetch('/api/health')

    expect(getCurrentUserId()).toBe('1')
    expect(requestHeaders(fetchMock).get('X-Demo-User')).toBe('1')
  })

  it('omet l’en-tête X-Demo-User quand aucun utilisateur n’est sélectionné', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }))
    setCurrentUserId('1')
    setCurrentUserId(null)

    await apiFetch('/api/health')

    expect(requestHeaders(fetchMock).has('X-Demo-User')).toBe(false)
  })

  it('ne déclare pas de Content-Type sur une requête sans corps', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }))

    await apiFetch('/api/health')

    expect(requestHeaders(fetchMock).has('Content-Type')).toBe(false)
  })

  it('déclare Content-Type: application/json quand la requête a un corps', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }, 201))

    await apiFetch('/api/missions', { method: 'POST', body: JSON.stringify({ name: 'Alpha' }) })

    expect(requestHeaders(fetchMock).get('Content-Type')).toBe('application/json')
  })

  it('retourne le corps JSON désérialisé quand la réponse est un succès', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok', version: '0.1.0' }))

    const data = await apiFetch<{ status: string; version: string }>('/api/health')

    expect(data).toEqual({ status: 'ok', version: '0.1.0' })
  })

  it('lève une ApiError portant le statut et le detail du backend sur un 409', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Ce CRA est déjà soumis.' }, 409))

    const error = await apiFetch('/api/cra/1/submit', { method: 'POST' }).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'Ce CRA est déjà soumis.' })
  })

  it('retombe sur le message par défaut quand le corps d’erreur n’est pas du JSON', async () => {
    fetchMock.mockResolvedValue(htmlResponse(502))

    const error = await apiFetch('/api/health').catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 502,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    })
  })

  it('retombe sur le message par défaut quand le JSON d’erreur n’a pas de detail', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ erreur: 'inattendue' }, 500))

    const error = await apiFetch('/api/health').catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({
      status: 500,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    })
  })

  // FastAPI answers a 422 with `detail` as a LIST of validation objects, not a
  // string. Rendering it as is would put "[object Object]" in front of the user.
  it('retombe sur le message par défaut quand detail n’est pas une chaîne', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: [{ loc: ['body', 'name'], msg: 'field required' }] }, 422),
    )

    const error = await apiFetch('/api/missions', { method: 'POST', body: '{}' }).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toMatchObject({
      status: 422,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    })
  })

  it('lève une ApiError de statut 0 quand la requête n’atteint jamais le serveur', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await apiFetch('/api/health').catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, message: 'Impossible de contacter le serveur.' })
  })

  it('ne tente pas de désérialiser un 204 No Content', async () => {
    const response = new Response(null, { status: 204 })
    const jsonSpy = vi.spyOn(response, 'json')
    fetchMock.mockResolvedValue(response)

    const data = await apiFetch('/api/cra/1', { method: 'DELETE' })

    expect(data).toBeUndefined()
    expect(jsonSpy).not.toHaveBeenCalled()
  })
})
