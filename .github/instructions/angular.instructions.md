---
applyTo: "frontend/**/*.ts,frontend/**/*.html,frontend/**/*.css,frontend/**/*.scss"
description: "Angular 21 forbidden patterns (hard constraints) for frontend code."
---

# Angular 21 — Rules: what you MUST NOT do

List of forbidden patterns for all Angular code in this repo. If one of these
shows up in a diff, it's a bug to fix. The corresponding "do this instead" lives
in the `angular-best-practices` skill.

## Architecture & components
- ❌ **No `NgModule`.** **Standalone** components/directives/pipes only.
- ❌ No `ChangeDetectionStrategy.Default` — always **`OnPush`**.
- ❌ No business logic or HTTP call in a component: that goes in a service.
- ❌ No "god object" component with 15 inputs and 500 lines — split it up.

## Injection & component API
- ❌ No **constructor** injection — use **`inject()`**.
- ❌ No **`@Input()` / `@Output()`** decorators — use `input()`,
  `input.required()`, `output()`, `model()`.
- ❌ No `@ViewChild`/`@ContentChild` decorators when the signal variants
  (`viewChild()`, `contentChild()`) exist.

## Reactivity & state
- ❌ No **in-place mutation** of a signal (`arr.push(...)` then re-set the same
  ref) — create a new reference (`set`/`update`).
- ❌ No storing of **derivable** state — use `computed()`.
- ❌ No overuse of `effect()` for what a `computed()` does better.
- ❌ No manual `ChangeDetectorRef.detectChanges()/markForCheck()` to work around
  reactivity.
- ❌ No `subscribe()` without cleanup — prefer `httpResource`, `toSignal`, or
  `takeUntilDestroyed`.

## Zoneless
- ❌ **No `zone.js`** and no `provideZoneChangeDetection()` (except when
  migrating legacy code that genuinely depends on it).

## Templates
- ❌ No `*ngIf` / `*ngFor` / `*ngSwitch` nor `NgIf`/`NgForOf`/`NgSwitch` — use
  native control flow `@if` / `@for` / `@switch`.
- ❌ No `@for` **without `track`**.
- ❌ No `NgClass` / `NgStyle` — use `[class.x]` / `[style.x]` bindings.
- ❌ No direct DOM access (`nativeElement.innerHTML`, manual manipulation).

## Typing
- ❌ **No `any`.** No `@ts-ignore` / `@ts-nocheck` to mask a type error — fix the
  type.
- ❌ No disabling tsconfig `strict` mode.

## Forms
- ❌ No **template-driven** forms for a non-trivial case — Signal Forms (new) or
  Reactive Forms.

## Styling
- ❌ No **hard-coded** colors/spacing/typography — use design-system tokens /
  Tailwind utilities (see `angular-design-system`, `tailwindcss`).
- ❌ No long `class="..."` strings built in TS — bind them in the template.
- ❌ No `tailwind.config.js` (use CSS-first `@theme` config) unless genuinely
  needed.

## Tests
- ❌ No **Karma/Jasmine** — Vitest.
- ❌ No `fixture.detectChanges()` to flush async — `await fixture.whenStable()`.
- ❌ No fragile selectors (CSS classes, text) — `data-test="..."`.
- ❌ No test coupled to private implementation.

## Misc
- ❌ No hard-coded secrets/API keys in the frontend.
- ❌ No second pattern for something already done one way in the repo.
