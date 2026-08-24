---
applyTo: "frontend/**"
---

# React / TypeScript — Do

## Components

- Write function components with hooks; one component per file, named like the file.
- Split a screen into a `pages/` component (routing + data) and `components/` (presentation).
- Keep presentational components pure: props in, JSX out, no fetch, no router access.
- Extract a component as soon as it is reused twice or exceeds ~120 lines.

## Data and API

- Call the API only through `src/api/` modules, never with `fetch` inside a component.
- Wrap each resource in a hook: `useMissions()`, `useCra(year, month)`.
- Type every payload with a DTO in `src/types/`, mirroring the backend schemas.
- Handle the three states of every remote call explicitly: loading, error, empty.
- Send the demo identity header (`X-Demo-User`) from the shared HTTP client, once.

## State

- Keep state as local as possible; lift it only when two siblings need it.
- Use `useState` and `useReducer`; a single React context is enough for the current user.
- Derive values during render instead of storing them in state (monthly totals, counters).
- Give every list item a stable `key` taken from its business identifier.

## TypeScript

- Enable and respect `strict`; type props with an explicit `type Props = { ... }`.
- Model closed value sets as union types: `type CraStatus = 'DRAFT' | 'SUBMITTED' | ...`.
- Prefer `unknown` plus narrowing over a cast when a value's shape is uncertain.

## UI

- Write every user-visible label in French; keep code identifiers in English.
- Reuse the design-system components (`Button`, `StatusBadge`, `Card`, `Modal`, `Toast`).
- Give interactive elements an accessible name and a visible focus state.
- Show backend error messages to the user instead of a generic "une erreur est survenue".

## Tests

- Test through the user's eyes: query by role and label, not by CSS class or test id.
- Cover per screen: successful render, error state, and the main interaction.
- Mock the `src/api/` module, not `fetch`.
