---
name: react-screen
description: Use when building or changing a screen in the CRA React frontend — page structure, typed API client, data hook, loading/error/empty states, forms and validation, French labels.
---

# React screen

Follow `.claude/rules/react-do.md` and `react-dont.md`. Example: the missions list (US-002).

## Layers

```
src/types/dto.ts            types mirroring the backend schemas
src/api/client.ts           shared fetch wrapper, X-Demo-User header, error mapping
src/api/missions.ts         one function per endpoint
src/hooks/useMissions.ts    data + loading + error
src/components/...          presentation, no fetch
src/pages/MissionsPage.tsx  routing, composition, states
```

## Types

```ts
export type CraStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type Mission = {
  id: number
  name: string
  client: string
  startDate: string
  endDate: string | null
  isClosed: boolean
}
```

## HTTP client

```ts
export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Demo-User': currentUserId(), ...init?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Une erreur est survenue.' }))
    throw new ApiError(response.status, body.detail)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}
```

The backend `detail` is already in French — show it to the user as is.

## Hook

```ts
export function useMissions(filters: MissionFilters) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setStatus('loading')
    listMissions(filters)
      .then((data) => { setMissions(data); setStatus('ready') })
      .catch((e: ApiError) => { setError(e.message); setStatus('error') })
  }, [filters])

  useEffect(() => { reload() }, [reload])

  return { missions, status, error, reload }
}
```

## Page — the three states are mandatory

```tsx
export function MissionsPage() {
  const [filters, setFilters] = useState<MissionFilters>({})
  const { missions, status, error, reload } = useMissions(filters)

  if (status === 'loading') return <Spinner label="Chargement des missions…" />
  if (status === 'error') return <ErrorBanner message={error} onRetry={reload} />
  if (missions.length === 0) return <EmptyState message="Aucune mission ne correspond à ces filtres." />

  return (
    <Card title="Missions">
      <MissionFiltersBar value={filters} onChange={setFilters} />
      <MissionTable missions={missions} />
    </Card>
  )
}
```

Never skip the empty state: an empty table with no message reads as a bug during a demo.

## Forms

- Controlled inputs, one `useState` per form object.
- Validate client-side for immediate feedback, but treat the backend as the authority.
- Disable the submit button while the request is in flight; re-enable it on error.
- On `409`, display the backend message next to the field or in a toast — do not swallow it.

## Labels

| Code value | French label shown |
|---|---|
| `DRAFT` | Brouillon |
| `SUBMITTED` | Soumis |
| `APPROVED` | Validé |
| `REJECTED` | Refusé |
| `PAID_LEAVE` | Congé payé |
| `SICK_LEAVE` | Maladie |

Keep those mappings in one module (`src/labels.ts`), never inline in a component.
Format dates with `Intl.DateTimeFormat('fr-FR')`; never render an ISO string.

## Checklist

- [ ] No `fetch` outside `src/api/`.
- [ ] DTO typed, no `any`.
- [ ] Loading, error and empty states all handled.
- [ ] Backend error message displayed to the user.
- [ ] All visible text in French; dates formatted `fr-FR`.
- [ ] Design-system components reused, no hard-coded colours.
- [ ] At least one test for the screen.
