---
name: angular-best-practices
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Canonical Angular 21 conventions for this repo — standalone components,
  signals, zoneless change detection, inject(), built-in control flow, modern
  HTTP/state, and project structure. Use when writing or reviewing ANY Angular
  code (components, services, routing, state, forms, HTTP).
---

# Angular 21 best practices

Angular 21 (Nov 2025) is **standalone-only, signals-first, and zoneless**
(zone.js is no longer shipped). Write code accordingly.

## Components

- **Standalone always.** No `NgModule`. Declare deps in `imports: [...]`.
- **`changeDetection: ChangeDetectionStrategy.OnPush`** on every component — it
  is the correct default under zoneless and signals make it ergonomic.
- One component per file. Co-locate `*.component.ts`, `.html`, `.css`.
- Keep components thin: presentation + wiring. Push logic into services.

```ts
@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {
  private readonly store = inject(ProductStore);
  protected readonly products = this.store.products;        // Signal<Product[]>
  protected readonly lowStock = computed(() =>
    this.products().filter(p => p.quantity < p.reorderThreshold));
}
```

## Dependency injection

- Use the **`inject()` function**, not constructor parameters.
- Mark injected fields `private readonly` unless the template needs them
  (`protected readonly`).

## Inputs / outputs / two-way

- `input()`, `input.required<T>()`, `output<T>()`, `model<T>()`.
- Never use `@Input()` / `@Output()` decorators in new code.

```ts
readonly product = input.required<Product>();
readonly reorder = output<string>();          // emits productId
readonly selected = model<boolean>(false);    // two-way [(selected)]
```

## State & reactivity

- State is `signal()`; derived state is `computed()`; side effects are
  `effect()` (use sparingly — prefer `computed`).
- **Never mutate** signal values in place; set/`update` with new references.
- Don't store what you can derive. No manual `ChangeDetectorRef` juggling.

## Templates

- **Built-in control flow only**: `@if`, `@for` (always with `track`),
  `@switch`, `@let`. No `*ngIf`/`*ngFor`/`NgIf`/`NgForOf`.
- Bind classes/styles with `[class.x]="..."` / `[style.x]="..."` — not
  `NgClass`/`NgStyle`.
- Lazy-load heavy/below-the-fold UI with `@defer` (e.g.
  `@defer (on viewport)` / `@defer (on interaction)`).

```html
@if (products().length) {
  @for (p of products(); track p.id) {
    <app-product-card [product]="p" (reorder)="onReorder($event)" />
  }
} @else {
  <p>Aucun produit en stock.</p>
}
```

## Server data & HTTP

- `provideHttpClient()` in app config (HttpClient is root-provided in v21).
- Prefer **`httpResource()`** for read endpoints — it returns signals
  (`.value()`, `.isLoading()`, `.error()`) and reacts to signal inputs.
- For commands (POST/PUT/DELETE) use a typed service method returning a
  `Promise`/`Observable`; convert to signals at the edge.
- Model every DTO as a TypeScript `interface`. **No `any`.**

```ts
@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/products';

  readonly all = httpResource<Product[]>(() => this.base);

  create(body: CreateProduct): Observable<Product> {
    return this.http.post<Product>(this.base, body);
  }
}
```

## Forms

- New screens: prefer **Signal Forms** (`@angular/forms/signals`) — `form()`
  over a `signal()` model with `required`, `email`, `minLength`, etc.
- Reactive forms remain acceptable where the codebase already uses them.
- Avoid template-driven forms for anything non-trivial.

## Routing

- Standalone routes via `provideRouter(routes)`; lazy-load with
  `loadComponent: () => import(...)`.
- Use functional route guards/resolvers (`CanActivateFn`).

## Project structure (this repo)

```
frontend/src/app/
  core/         # singletons: api services, interceptors, guards, models
  shared/       # reusable UI components, pipes, directives, design-system
  features/<name>/   # one folder per feature (components + feature service)
  app.config.ts app.routes.ts
```

## Tooling

- **Vitest** is the test runner (Karma is gone). See `angular-testing`.
- Run `npm test`, `npm run lint`, `ng build` and trust the actual output.
- Keep `strict: true` in tsconfig; fix type errors, don't suppress them.

## Don't

- Don't add zone.js or `provideZoneChangeDetection()` unless migrating legacy
  code that truly needs it.
- Don't subscribe in components without unsubscribing (prefer `httpResource`,
  `toSignal`, or the `async` pattern via signals).
- Don't reach into the DOM directly; use signals + bindings.
