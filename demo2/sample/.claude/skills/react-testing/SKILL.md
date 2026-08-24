---
name: react-testing
description: Use when writing or fixing Vitest + Testing Library tests for the CRA frontend — setup, rendering with providers, accessible queries, user interactions, mocking the API module, testing loading/error/empty states.
---

# React testing

Follow `.claude/rules/react-do.md`. Test what the user sees and does, never the
implementation.

## Setup

`vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  globals: true,
}
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)
```

## Render helper

```tsx
export function renderWithProviders(ui: ReactNode, user: DemoUser = jean) {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter>
        <CurrentUserProvider value={user}>{ui}</CurrentUserProvider>
      </MemoryRouter>,
    ),
  }
}
```

## Queries — in this order

1. `getByRole('button', { name: /soumettre/i })` — role + accessible name
2. `getByLabelText(/commentaire/i)` — form fields
3. `getByText(/aucune mission/i)` — static content
4. `getByTestId` — last resort only

Never query by CSS class or DOM structure. Use `findBy*` for anything asynchronous;
never `waitFor` with an arbitrary timeout.

## Mock the API module, not `fetch`

```tsx
vi.mock('../api/missions')
const listMissionsMock = vi.mocked(listMissions)

beforeEach(() => vi.resetAllMocks())
```

## 1. Simple component

```tsx
it('affiche le libellé français du statut', () => {
  render(<StatusBadge status="SUBMITTED" />)
  expect(screen.getByText('Soumis')).toBeInTheDocument()
})
```

## 2. Screen with an API call — cover the three states

```tsx
it('affiche les missions retournées par l’API', async () => {
  listMissionsMock.mockResolvedValue([
    { id: 1, name: 'Refonte portail', client: 'ACME', startDate: '2026-01-05',
      endDate: null, isClosed: false },
  ])

  renderWithProviders(<MissionsPage />)

  expect(await screen.findByText('Refonte portail')).toBeInTheDocument()
})

it('affiche un message vide quand aucune mission ne correspond', async () => {
  listMissionsMock.mockResolvedValue([])
  renderWithProviders(<MissionsPage />)
  expect(await screen.findByText(/aucune mission/i)).toBeInTheDocument()
})

it('affiche le message d’erreur du backend', async () => {
  listMissionsMock.mockRejectedValue(new ApiError(403, 'Action réservée aux managers.'))
  renderWithProviders(<MissionsPage />)
  expect(await screen.findByText('Action réservée aux managers.')).toBeInTheDocument()
})
```

## 3. Form and interaction

```tsx
it('exige un commentaire avant de refuser un CRA', async () => {
  const { user } = renderWithProviders(<RejectCraModal open craId={7} />, paul)

  await user.click(screen.getByRole('button', { name: /refuser/i }))

  expect(await screen.findByText(/commentaire obligatoire/i)).toBeInTheDocument()
  expect(rejectCraMock).not.toHaveBeenCalled()
})
```

Assert both the visible feedback and the fact that the API was (or was not) called.

## What to test per screen

- renders the data returned by the API
- empty state
- error state, showing the backend message
- the main interaction of the story (submit, validate, reject, add an entry)
- role-dependent UI when the story defines one (a consultant sees no "Valider" button)

## Coverage

The floor is **70%**, enforced by the runner:

```ts
// vite.config.ts
test: {
  coverage: {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
  },
}
```

```bash
npm test -- --coverage
```

Cover the modules that carry behaviour first — `src/api/client.ts`, the hooks, the
screens' three states. A screen at 100% whose error branch is never rendered is not
tested; the floor is a floor, not a goal.

## Checklist

- [ ] Coverage ≥ 70%, gaps deliberate rather than unnoticed.
- [ ] Queries by role/label, none by class or structure.
- [ ] The `src/api/` module is mocked, not `fetch`.
- [ ] `findBy*` used for async, no arbitrary `waitFor` timeout.
- [ ] Loading, empty and error states covered.
- [ ] Interactions driven with `userEvent`, not `fireEvent`.
- [ ] `npm test` green before finishing.
