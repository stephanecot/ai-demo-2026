---
name: tailwindcss
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  How to install and use Tailwind CSS v4 in the Angular 21 app in this repo —
  CSS-first config (@import "tailwindcss" + @theme, no tailwind.config.js),
  PostCSS setup, utility-first conventions, reconciling Tailwind tokens with the
  design system, and when to use @apply vs utilities. Use when styling Angular
  components with Tailwind or setting Tailwind up.
---

# Tailwind CSS v4 in Angular 21

Tailwind **v4** is CSS-first: configuration lives in CSS via `@theme`, there is
**no `tailwind.config.js`** by default, and the engine is much faster. This
skill pairs with `angular-design-system` — Tailwind is *how* we apply the design
tokens, not a second, competing system.

## Install (manual, one-time)

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

Create `.postcssrc.json` at the project root:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

Import Tailwind in `src/styles.css` (the single global stylesheet):

```css
@import "tailwindcss";
```

That's it — the Angular CLI build (esbuild) picks up PostCSS automatically. No
`content` globbing config needed; v4 auto-detects sources.

## CSS-first config & design tokens (`@theme`)

Define the design system's tokens **once** in `@theme`. Each token becomes both
a CSS variable *and* a Tailwind utility — so `--color-primary-500` gives you
`bg-primary-500`, `text-primary-500`, etc. This is the bridge to
`angular-design-system`: keep a single source of truth here.

```css
@import "tailwindcss";

@theme {
  --color-primary-500: #2563eb;
  --color-danger-500:  #dc2626;
  --color-success-500: #16a34a;
  --color-surface:     #ffffff;

  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --radius-md: 0.5rem;
  --spacing: 0.25rem;        /* base step; spacing-4 = 1rem, etc. */
}
```

Dark mode / theming: keep using `[data-theme="dark"]` overrides of the same
variables (see `angular-design-system`). Tailwind utilities read the variables,
so theme switches "just work".

## Utility-first conventions

- Style in the **template** with utilities; that's the default.
- Compose with the standard scale (`p-4`, `gap-2`, `text-sm`, `rounded-md`,
  `shadow-sm`) — don't reach for arbitrary values (`p-[13px]`) unless truly
  one-off.
- Conditional classes use Angular bindings, not string concatenation:

```html
<button
  class="rounded-md px-4 py-2 font-medium text-white"
  [class.bg-primary-500]="variant() === 'primary'"
  [class.bg-danger-500]="variant() === 'danger'"
  [class.opacity-50]="disabled()">
  <ng-content />
</button>
```

- Use state variants (`hover:`, `focus-visible:`, `disabled:`) and responsive
  prefixes (`md:`, `lg:`) directly. Always keep a visible `focus-visible:` ring
  for accessibility.

## @apply — use sparingly

Reach for `@apply` only inside a shared `shared/ui` component's CSS to package a
repeated utility cluster behind a semantic class. Don't `@apply` everywhere — it
recreates the very abstraction utilities exist to avoid.

```css
/* button.component.css */
.ds-btn { @apply rounded-md px-4 py-2 font-medium transition-colors; }
```

## How Tailwind and the design system coexist

- **Tokens** (`@theme`) = single source of truth for color/spacing/typography.
- **Tailwind utilities** = how feature components apply those tokens inline.
- **`shared/ui` components** = encapsulate complex/repeated patterns (Button,
  Card, Input) so features stay clean; internally they may use `@apply`.
- Feature components never invent raw colors/sizes — only theme-backed
  utilities. This keeps Tailwind, the tokens, and the component library aligned.

## Don't

- Don't add a `tailwind.config.js` unless you hit a v4 limitation that requires
  JS config; prefer `@theme`.
- Don't duplicate the token palette in both `@theme` and a separate
  `tokens.css` — pick `@theme` as the home and reference it.
- Don't build giant `class="..."` strings in TS; bind classes in the template.
- Don't ship arbitrary hex values via `bg-[#abc]`; extend `@theme` instead.
