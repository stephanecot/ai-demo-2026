---
name: angular-a11y-responsive
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  How to make the Angular 21 app in this repo accessible (WCAG 2.2 AA) and
  responsive — semantic HTML + ARIA, keyboard operability, focus management,
  screen-reader support, color contrast, and a mobile-first responsive layout
  with Tailwind v4 breakpoints, fluid grids, and container queries. Use when
  building or reviewing UI for accessibility or adapting layouts across screen
  sizes.
---

# Accessibility & responsive design for the Angular 21 app

Goal: every screen is **usable by keyboard and screen reader**, meets **WCAG 2.2
AA**, and **adapts cleanly from mobile to desktop**. This skill pairs with
`angular-design-system` (tokens, focus styles) and `tailwindcss` (breakpoints,
utilities). Accessibility and responsiveness are part of "done", not a polish
pass.

## 1. Semantic HTML first, ARIA second

The first rule of ARIA is: don't use ARIA when a native element does the job.

- Use real elements for their behavior: `<button>` (actions), `<a href>`
  (navigation), `<nav>`, `<main>`, `<header>`, `<footer>`, `<ul>/<li>` (lists),
  `<table>` (tabular data), `<dialog>` (modals).
- One `<main>` per page; landmark regions (`<nav>`, `<aside>`, `<header>`) wrap
  the right content. Headings (`<h1>`…`<h6>`) form a logical, non-skipping outline.
- Add ARIA only to fill gaps native HTML can't (e.g. `aria-expanded`,
  `aria-current`, `aria-live`). Wrong/excess ARIA is worse than none.
- For complex widgets (menu, listbox, combobox, dialog, tabs), reach for the
  **Angular Aria** primitives (`@angular/aria`, v21 dev preview) instead of
  hand-rolling roles + keyboard handlers.

```html
<!-- ✅ native: focusable, Enter/Space, disabled all free -->
<button type="button" (click)="addToCart()">Ajouter au panier</button>

<!-- ❌ a div pretending to be a button: no focus, no keyboard, no role -->
<div class="btn" (click)="addToCart()">Ajouter au panier</div>
```

## 2. Names, labels & descriptions

Every interactive control needs an **accessible name**.

- Form fields: always a real `<label for="id">`. Link help/error text with
  `aria-describedby`; mark invalid fields with `[attr.aria-invalid]`.
- Icon-only buttons: give an `aria-label` (and hide the glyph with
  `aria-hidden="true"`).
- Images: meaningful `alt`; decorative images get `alt=""`.

```html
<label for="qty">Quantité</label>
<input id="qty" type="number" [attr.aria-invalid]="qtyInvalid()"
       aria-describedby="qty-err" [value]="qty()" (input)="onQty($event)" />
@if (qtyInvalid()) {
  <p id="qty-err" role="alert">La quantité doit être positive.</p>
}

<button type="button" aria-label="Supprimer l'article" (click)="remove()">
  <svg aria-hidden="true">…</svg>
</button>
```

## 3. Keyboard operability

Everything you can do with a mouse must work with a keyboard.

- All interactive controls are reachable in a logical **tab order** and operable
  with Enter/Space (Esc to dismiss overlays). Don't add `tabindex` > 0.
- Never remove focus outlines without replacing them — see focus styles below.
- For custom widgets, implement the expected keys (arrows for menus/tabs/listbox)
  or use Angular Aria, which ships them.
- Provide a **skip link** (`<a href="#main">` first in the DOM) to jump past nav.

## 4. Focus management (SPA-critical)

Single-page navigation doesn't move focus the way full page loads do — handle it.

- On route change, move focus to the new view's `<h1>` (or a focusable container)
  and update the document title, so screen-reader users know they moved.
- Dialogs/drawers: **trap focus** inside while open, return focus to the trigger
  on close, and close on Esc. Prefer native `<dialog>` or Angular Aria/CDK.
- Use `:focus-visible` so focus rings show for keyboard users without flashing on
  mouse click.

```ts
// focus the heading after navigation (zoneless, signal-friendly)
private readonly heading = viewChild<ElementRef<HTMLElement>>('pageHeading');
constructor() {
  effect(() => { this.route(); this.heading()?.nativeElement.focus(); });
}
```

```html
<h1 #pageHeading tabindex="-1">Stock — Produits</h1>
```

## 5. Live regions & dynamic content

Screen readers don't announce silent DOM changes.

- Status/toasts/async results: a polite live region
  (`<div aria-live="polite">` / `role="status"`); use `role="alert"` /
  `aria-live="assertive"` only for urgent errors.
- Reflect loading/empty/error states in the markup (not just a spinner glyph) so
  they're announced; pair with `aria-busy` where relevant.

## 6. Color, contrast & motion

- Text contrast **≥ 4.5:1** (≥ 3:1 for large text and UI components/borders) —
  enforced through design tokens, not per-component hex.
- Never convey meaning by **color alone** (add an icon, label, or pattern).
- Respect `prefers-reduced-motion`: gate non-essential transitions/animations.

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { animation: none !important; transition: none !important; }
}
:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
```

## 7. Responsive: mobile-first with Tailwind v4

Design for the smallest screen first; add complexity at larger breakpoints with
**min-width** prefixes (`sm: md: lg: xl: 2xl:`). See `tailwindcss` for setup.

- Base classes target mobile; layer breakpoint variants up. Don't write
  desktop-first with max-width overrides.
- Fluid layouts: CSS grid / flex with `gap-*`, `min-w-0`, `flex-wrap`. Avoid
  fixed pixel widths that overflow on small screens.
- Type & spacing scale with the design tokens; use `clamp()` for fluid type.
- Touch targets **≥ 44×44px**; spacing comfortable on touch.

```html
<!-- 1 col on mobile → 2 → 3; gap from spacing scale -->
<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  @for (p of products(); track p.id) {
    <li class="min-w-0"><ds-product-card [product]="p" /></li>
  }
</ul>
```

## 8. Container queries & responsive patterns

- Prefer **container queries** (`@container`) for reusable components that must
  adapt to *their slot*, not the viewport (a card in a sidebar vs. main grid).
- Make data tables responsive: horizontal scroll wrapper (`overflow-x-auto`) on
  small screens, or a stacked card layout; keep `<th scope>` for a11y.
- Off-canvas nav on mobile (`<dialog>`/drawer with focus trap), inline nav on
  desktop — one component, breakpoint-driven.
- Test at 320px width and at 200% zoom: no horizontal scroll, no clipped content.

```css
.card-host { container-type: inline-size; }
@container (min-width: 24rem) {
  .card { grid-template-columns: auto 1fr; }
}
```

## 9. Verify (don't assume)

- Tab through every new screen — order logical, focus always visible, no traps.
- Check names/roles: each control announces a sensible name (Angular Aria,
  DevTools accessibility tree, or VoiceOver/NVDA spot-check).
- Add render tests asserting accessible names/roles via Testing Library queries
  (`getByRole('button', { name: … })`) over CSS selectors — see `angular-testing`.
- Eyeball at 320px / 768px / 1280px and at 200% zoom.

## Checklist

- [ ] Native semantic element used; ARIA only to fill real gaps.
- [ ] Every control has an accessible name; inputs have `<label>`; errors linked.
- [ ] Fully keyboard-operable; visible `:focus-visible`; skip link present.
- [ ] Focus moved & title updated on route change; dialogs trap + restore focus.
- [ ] Dynamic updates announced via live regions; states reflected in markup.
- [ ] Contrast ≥ AA via tokens; meaning not by color alone; reduced-motion honored.
- [ ] Mobile-first layout; fluid grid; touch targets ≥ 44px; no overflow at 320px/200%.
