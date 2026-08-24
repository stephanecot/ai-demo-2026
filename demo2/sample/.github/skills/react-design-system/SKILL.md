---
name: react-design-system
description: Use when styling the CRA frontend or building shared UI components — design tokens, colours per CRA status and absence type, base components, interaction states, accessibility, responsive layout.
---

# CRA design system

One visual language for the whole demo. Components live in `src/components/ui/`,
tokens in `src/styles/tokens.css`. Never hard-code a colour or a spacing in a screen.

## Tokens

```css
:root {
  /* neutrals */
  --color-bg: #f7f8fa;
  --color-surface: #ffffff;
  --color-border: #e2e5ea;
  --color-text: #1a1d23;
  --color-text-muted: #5d6470;

  /* brand */
  --color-primary: #2f5bea;
  --color-primary-hover: #2448c4;

  /* feedback */
  --color-success: #1a7f52;
  --color-warning: #b06a00;
  --color-danger: #c0392b;

  /* spacing — 4px scale */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;

  --radius: 8px;
  --shadow-card: 0 1px 3px rgb(16 24 40 / 8%);
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

Type scale: 12 / 14 / 16 / 20 / 28 px. Body is 14 px, screen titles 28 px.

## Domain colours

CRA status:

| Status | Label | Token |
|---|---|---|
| `DRAFT` | Brouillon | `--color-text-muted` |
| `SUBMITTED` | Soumis | `--color-warning` |
| `APPROVED` | Validé | `--color-success` |
| `REJECTED` | Refusé | `--color-danger` |

Calendar day types — each has a colour **and** a short label, never colour alone:

| Type | Label | Background |
|---|---|---|
| `MISSION` | mission (client name) | `#e7edfd` |
| `PAID_LEAVE` | CP | `#e3f6ec` |
| `RTT` | RTT | `#e8f4f8` |
| `SICK_LEAVE` | Maladie | `#fdeaea` |
| `UNPAID_LEAVE` | Sans solde | `#f2f0f5` |
| `TRAINING` | Formation | `#fff4e0` |
| non-working day | — | `#eff1f4`, muted text |

## Base components

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'danger'`, `loading`, `disabled` | shows a spinner and stays disabled while `loading` |
| `StatusBadge` | `status: CraStatus` | colour + French label from `src/labels.ts` |
| `Card` | `title`, `actions`, `children` | white surface, `--radius`, `--shadow-card` |
| `Modal` | `open`, `title`, `onClose` | focus trap, closes on `Escape`, restores focus |
| `DataTable` | `columns`, `rows`, `emptyMessage` | never renders an empty body without a message |
| `Toast` | `kind: 'success' \| 'error'`, `message` | auto-dismiss after 5 s, dismissible |
| `Spinner` / `EmptyState` / `ErrorBanner` | `label` / `message` / `message` + `onRetry` | the three remote states |

## Interaction states

Every interactive element defines `hover`, `focus-visible`, `active` and `disabled`.

```css
.button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.button:disabled { opacity: .5; cursor: not-allowed; }
```

Never remove the focus outline.

## Accessibility

- Contrast ratio ≥ 4.5:1 for text; the domain backgrounds above are tuned for dark text.
- Every input has a `<label>`; icon-only buttons have `aria-label` in French.
- The calendar is a `<table>` with day headers; each cell is a `<button>` when editable.
- Modals set `role="dialog"` and `aria-modal="true"`.
- Everything reachable and operable with the keyboard alone (Tab, Enter, Escape).

## Layout

- App shell: fixed header (app name, current user, notification bell) + content, max-width 1200 px.
- Grid with `gap: var(--space-4)`; one column below 768 px.
- The month calendar scrolls horizontally on small screens rather than shrinking cells.

## Checklist

- [ ] No colour, size or spacing literal outside `tokens.css`.
- [ ] Status and day type shown with colour **and** text.
- [ ] `hover` / `focus-visible` / `disabled` defined for interactive elements.
- [ ] Labels and `aria-label`s in French.
- [ ] Keyboard-only navigation works on the screen.
- [ ] Readable at 1280 px and at 375 px.
