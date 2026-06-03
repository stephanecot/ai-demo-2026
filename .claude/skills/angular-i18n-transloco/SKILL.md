---
name: angular-i18n-transloco
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  How to add and use runtime internationalization (i18n / multilingue) in the
  Angular 21 app in this repo with Transloco — install/setup, JSON translation
  files, the transloco pipe & structural directive, params/dates/numbers,
  lazy-loaded scopes, runtime language switching wired to a signal, and testing.
  Use when adding translations, a language switcher, or making any UI text
  translatable.
---

# Internationalization with Transloco (Angular 21)

Goal: all user-facing text is **translatable at runtime** (switch language
without a rebuild), with type-safe keys and lazy-loaded translation files.
Transloco fits this repo's standalone / signals / zoneless setup. Pairs with
`angular-best-practices` (providers, signals) and `angular-a11y-responsive`
(set `lang` on `<html>`).

> Rule: **no hard-coded UI strings** in templates or TS. Every label, button,
> message, and error goes through a translation key.

## Install (one-time)

```bash
npm install @jsverse/transloco
```

Create translation files under `src/assets/i18n/` — one JSON per language:

```
src/assets/i18n/
  en.json
  fr.json
```

```json
// fr.json
{
  "stock": {
    "title": "Gestion de stock",
    "lowStock": "Stock faible : {{ count }} article(s)",
    "addProduct": "Ajouter un produit"
  }
}
```

## Provide Transloco (standalone, `app.config.ts`)

Use `provideTransloco` with an HTTP loader. No `NgModule`.

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco, TranslocoLoader, Translation } from '@jsverse/transloco';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['fr', 'en'],
        defaultLang: 'fr',
        fallbackLang: 'en',
        reRenderOnLangChange: true,        // required for runtime switching
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
```

## Use in templates

Prefer the **structural directive** (`*transloco`) — it reads the active
language reactively and gives you a local `t` function, so one subscription
covers the whole block:

```html
<ng-container *transloco="let t">
  <h1>{{ t('stock.title') }}</h1>
  <p>{{ t('stock.lowStock', { count: lowStockCount() }) }}</p>
  <button type="button">{{ t('stock.addProduct') }}</button>
</ng-container>
```

The **pipe** is fine for one-offs: `{{ 'stock.title' | transloco }}` (with
params: `{{ 'stock.lowStock' | transloco: { count: n } }}`). Don't mix both in
the same block — the directive is the default here.

## In TypeScript

Inject `TranslocoService`; use `translate()` for one-shot strings (e.g. a toast),
or `selectTranslate()` (Observable) bridged to a signal for reactive text.

```ts
private readonly transloco = inject(TranslocoService);

readonly addLabel = toSignal(
  this.transloco.selectTranslate('stock.addProduct'),
  { initialValue: '' },
);

notifySaved() {
  this.toast.show(this.transloco.translate('stock.saved'));
}
```

## Lazy-loaded scopes (per feature)

Split translations by feature so each lazy route loads only its keys. Put files
in `feature/i18n/{lang}.json` and provide a scope on the route/component:

```ts
providers: [provideTranslocoScope('products')]
```

```html
<ng-container *transloco="let t; scope: 'products'">
  {{ t('products.list.empty') }}
</ng-container>
```

## Runtime language switching (signal-driven)

Expose a small service that flips the active lang, persists it, and updates the
document `lang` (for accessibility — see `angular-a11y-responsive`).

```ts
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  readonly active = signal(this.transloco.getActiveLang());

  use(lang: string) {
    this.transloco.setActiveLang(lang);
    this.active.set(lang);
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }
}
```

```html
<!-- a switcher; use real <button>s, label them (a11y) -->
@for (lang of langs(); track lang) {
  <button type="button" [class.active]="lang === language.active()"
          [attr.aria-pressed]="lang === language.active()"
          (click)="language.use(lang)">{{ lang | uppercase }}</button>
}
```

## Dates, numbers & plurals

- Use Transloco's locale add-ons (`@jsverse/transloco-locale`) for
  locale-aware dates/numbers/currency rather than hard-coding formats.
- For pluralization use ICU-style messages via `transloco-messageformat`
  (`{count, plural, ...}`) instead of branching in the template.

## Conventions

- Namespace keys by feature/domain (`stock.*`, `products.*`) — no flat dumping.
- Keep **all** languages in sync: every key exists in every file. A missing key
  should fall back, never crash.
- No string concatenation to build sentences — use params (`{{ name }}`); word
  order differs per language.
- Keep `availableLangs` and the language switcher driven by one source.

## Testing

In tests, provide `TranslocoTestingModule` (or the testing providers) with inline
translations so component specs render real text; assert on the translated output
via Testing Library role/name queries, not raw keys. See `angular-testing`.

```ts
TestBed.configureTestingModule({
  providers: [
    provideTranslocoTesting({ langs: { fr: { stock: { title: 'Gestion de stock' } } } }),
  ],
});
```
