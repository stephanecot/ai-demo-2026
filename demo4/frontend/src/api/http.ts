export type FieldError = { field: string; message: string }

/** RFC 9457 body produced by the backend's GlobalExceptionHandler. */
export type ProblemDetail = {
  type?: string
  title?: string
  status: number
  detail?: string
  errors?: FieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetail

  constructor(problem: ProblemDetail) {
    super(problem.title ?? `HTTP ${problem.status}`)
    this.name = 'ApiError'
    this.status = problem.status
    this.problem = problem
  }
}

async function readProblem(response: Response): Promise<ProblemDetail> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    try {
      const body = (await response.json()) as Partial<ProblemDetail>
      return { ...body, status: body.status ?? response.status }
    } catch {
      // fall through to a bare problem
    }
  }
  return { status: response.status, title: response.statusText }
}

/**
 * fetch wrapper for /api: JSON in, JSON out. Non-2xx responses throw an ApiError carrying the
 * parsed ProblemDetail; network failures propagate as-is (TypeError from fetch).
 */
export async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const response = await fetch(path, {
    ...rest,
    headers: {
      Accept: 'application/json, application/problem+json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (!response.ok) {
    throw new ApiError(await readProblem(response))
  }
  return (await response.json()) as T
}
