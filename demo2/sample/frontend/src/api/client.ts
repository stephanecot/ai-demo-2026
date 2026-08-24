/**
 * The only module allowed to call `fetch`.
 * Every backend route is prefixed `/api`; in development Vite proxies it to
 * http://localhost:8000, so BASE_URL stays empty and there is no CORS.
 */

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

/** Shown only when the backend answered something that is not `{ "detail": string }`. */
const FALLBACK_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.'

/** Shown when the request never reached the server (network down, API stopped). */
const NETWORK_ERROR_MESSAGE = 'Impossible de contacter le serveur.'

/** Carries the HTTP status and the backend's French `detail`, displayable as is. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Demo identity, sent as `X-Demo-User` on every request once a profile is picked
 * (US-001). Until then it is null and the header is omitted — `GET /api/health`
 * is public, so the shell page works without it.
 *
 * Deliberately a module-level value rather than React state: `apiFetch` must stay
 * usable outside a component tree. The price is that changing it triggers no
 * re-render and it can drift from the React context.
 *
 * INVARIANT — the US-001 current-user provider MUST call `setCurrentUserId` in the
 * same effect that sets the current user in the context, and pass `null` when the
 * user is cleared. This module is the single writer of the header; nothing else
 * may set `X-Demo-User`.
 */
let currentUserId: string | null = null

export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId
}

export function getCurrentUserId(): string | null {
  return currentUserId
}

/** Reads `detail` out of an unknown payload without casting to `any`. */
function readDetail(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('detail' in payload)) {
    return null
  }
  const detail: unknown = payload.detail
  return typeof detail === 'string' ? detail : null
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  // Only requests that actually carry a body describe one: a bodyless GET must not
  // announce a JSON payload it does not send.
  if (init?.body !== undefined && init.body !== null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (currentUserId !== null) {
    headers.set('X-Demo-User', currentUserId)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    throw new ApiError(response.status, readDetail(payload) ?? FALLBACK_ERROR_MESSAGE)
  }

  // 204 No Content: nothing to parse — used by deletions and validations.
  if (response.status === 204) {
    return undefined as T
  }

  const data: unknown = await response.json()
  return data as T
}
