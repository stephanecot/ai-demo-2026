---
name: angular-testing
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  How to write tests for the Angular 21 frontend in this repo — Vitest (Karma is
  gone), TestBed component tests with signals/zoneless, async via
  fixture.whenStable(), service tests with HttpTestingController, and harness/
  query conventions. Use when adding or fixing Angular tests.
---

# Writing Angular 21 tests

Angular 21 uses **Vitest** (Karma/Jasmine are removed) and **zoneless** change
detection. Tests reflect that: drive updates explicitly and await stability.

## Setup

The Angular builder wires Vitest with minimal config:

```jsonc
// angular.json → test target
"test": { "builder": "@angular/build:unit-test" }
```

Run with `npm test`. Test files are `*.spec.ts` next to the code under test.
APIs (`describe`, `it`, `expect`, `vi`) come from Vitest.

## Component test (signals + zoneless)

Under zoneless you no longer call `fixture.detectChanges()` to flush async — set
inputs/signals, then `await fixture.whenStable()` before asserting the DOM.

```ts
import { TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  it('renders the product name and emits reorder', async () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', { id: '1', name: 'Widget', quantity: 2 });
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h3')?.textContent).toContain('Widget');

    let emitted: string | undefined;
    fixture.componentInstance.reorder.subscribe(id => (emitted = id));
    el.querySelector<HTMLButtonElement>('[data-test="reorder"]')!.click();
    await fixture.whenStable();
    expect(emitted).toBe('1');
  });
});
```

- Set inputs with `componentRef.setInput('name', value)` (signal inputs).
- Query by a stable `data-test="..."` hook, not by CSS classes or text position.
- Assert rendered output and emitted outputs — the user-visible contract.

## Service test with HTTP

Use `provideHttpClient()` + `provideHttpClientTesting()` and assert requests via
`HttpTestingController`.

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('ProductApi', () => {
  let api: ProductApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts a new product', () => {
    api.create({ sku: 'SKU-9', name: 'New', quantity: 5 }).subscribe();
    const req = httpMock.expectOne('/api/products');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '9', sku: 'SKU-9', name: 'New', quantity: 5 });
  });
});
```

## Testing signals & computed

Pure signal logic can be tested without TestBed — call the function/store and
read signals directly. For `computed`, set the source signal then assert the
derived value. Wrap `effect()`-dependent assertions in `TestBed.runInInjectionContext`
and `await fixture.whenStable()`.

## Mocking

- Use Vitest `vi.fn()` / `vi.spyOn()` for spies and stubs.
- Provide fake services via `TestBed` providers (`{ provide: X, useValue: stub }`).

## Principles

- Test the **user-visible behavior**: rendered DOM, emitted outputs, navigation,
  HTTP calls — not private fields or internal method calls.
- Always `await fixture.whenStable()` after changing state before asserting.
- Cover happy path + empty/error/loading states (esp. for `httpResource`).
- Keep tests isolated and deterministic; `httpMock.verify()` in `afterEach`.
- Use `data-test` attributes as query hooks so refactors don't break selectors.
- Run `npm test` and report the real result.
