# React / TypeScript — Don't

## Components

- Don't write class components.
- Don't call `fetch` or `axios` directly inside a component or a page.
- Don't mix data fetching and presentation in the same component.
- Don't build a component that takes more than ~7 props; pass an object or split it.
- Don't render a list without a stable `key`, and never use the array index as key.

## State

- Don't introduce Redux, Zustand or any global state library for this demo.
- Don't duplicate server data into state that then drifts; re-read it from the hook.
- Don't store derived values (totals, filtered lists) in `useState`.
- Don't mutate state objects or arrays in place; create a new value.
- Don't use `useEffect` to compute something that can be computed during render.

## TypeScript

- Don't use `any`, `as any`, or `@ts-ignore`.
- Don't use non-null assertions (`!`) to silence a possible `undefined`.
- Don't type an API response as `object` or leave it implicit.
- Don't duplicate a DTO definition in two files.

## UI and UX

- Don't leave a remote call without a loading indicator and an error branch.
- Don't render `null` on error — tell the user what happened, in French.
- Don't hard-code colours or spacing in a component; use the design tokens.
- Don't use an English label, a raw enum value (`SUBMITTED`), or an ISO date in the UI.
- Don't rely on colour alone to convey a status; add a label or an icon.
- Don't use a `div` with `onClick` where a `button` or a link belongs.

## Tests

- Don't assert on CSS classes, DOM structure, or implementation details.
- Don't mock a component you are testing.
- Don't leave a screen shipped without at least one test.
