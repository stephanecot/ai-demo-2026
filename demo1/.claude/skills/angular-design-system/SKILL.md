---
name: angular-design-system
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  How to set up and use a design system for the Angular 21 app in this repo —
  design tokens (CSS custom properties), light/dark theming, a typed shared
  component library (Button, Card, Input, Badge, etc.), spacing/typography
  scales, and accessibility. Use when establishing styling foundations or
  building/using shared UI components.
---

# Design system for the Angular 21 app

Goal: a consistent, themeable, accessible UI driven by **design tokens** and a
small set of reusable standalone components under `shared/`. No ad-hoc colors or
spacing in feature components.

## 1. Tokens as CSS custom properties

Define one source of truth in `src/styles/tokens.css`, themeable via
`[data-theme]`. Components consume `var(--…)` — never hard-coded hex/px.

```css
:root {
  /* color primitives */
  --color-primary-500: #2563eb;
  --color-danger-500:  #dc2626;
  --color-success-500: #16a34a;
  --color-surface:     #ffffff;
  --color-text:        #0f172a;
  --color-border:      #e2e8f0;

  /* spacing scale (4px base) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-6: 1.5rem; --space-8: 2rem;

  /* radius, typography, elevation */
  --radius-md: 0.5rem;
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.25rem;
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.1);
}

[data-theme="dark"] {
  --color-surface: #0f172a;
  --color-text:    #f1f5f9;
  --color-border:  #1e293b;
}
```

Wire global styles in `angular.json` `styles: ["src/styles/tokens.css", "src/styles.css"]`
and toggle theme by setting `document.documentElement.dataset.theme`.

## 2. Component library structure

```
shared/ui/
  button/   button.component.ts(.html/.css)
  card/
  input/
  badge/
  icon/
  index.ts   # re-exports
```

Each is a **standalone, OnPush** component with **signal inputs**, styling from
tokens, and a stable API. Keep them presentational (no business logic, no HTTP).

```ts
@Component({
  selector: 'ds-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
      class="ds-btn"
      [class.ds-btn--primary]="variant() === 'primary'"
      [class.ds-btn--danger]="variant() === 'danger'"
      [disabled]="disabled()">
      <ng-content />
    </button>`,
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly disabled = input(false);
}
```

```css
.ds-btn {
  font: var(--text-base)/1.2 var(--font-sans);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
}
.ds-btn--primary { background: var(--color-primary-500); color: #fff; border-color: transparent; }
.ds-btn--danger  { background: var(--color-danger-500);  color: #fff; border-color: transparent; }
.ds-btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

## 3. Variants via typed inputs

Express variants/sizes as **union-typed signal inputs** (`'sm' | 'md' | 'lg'`),
mapped to `[class.x]` bindings. Don't accept arbitrary class strings.

## 4. Accessibility (non-negotiable)

- Use semantic elements (`<button>`, `<nav>`, `<label for>`); add ARIA only to
  fill gaps. Consider the **Angular Aria** library (v21 dev preview) for complex
  patterns (menus, listbox, dialog).
- Visible focus styles (`:focus-visible`), sufficient color contrast (WCAG AA),
  keyboard operability for every interactive control.
- Inputs always paired with a `<label>`; error text linked via `aria-describedby`.

## 5. Theming & dark mode

Provide a small `ThemeService` (signal-based) that flips `data-theme` and
persists the choice. Components stay theme-agnostic because they only read
tokens.

## 6. Usage rules

- Feature components import from `shared/ui` — never restyle primitives inline.
- No raw colors, font sizes, or spacing literals in feature CSS; use tokens.
- New shared component? Co-locate, export from `shared/ui/index.ts`, give it a
  `data-test` hook, and add a Vitest render test (see `angular-testing`).
- Keep the surface small and composable; resist one mega-component with 20 flags.
