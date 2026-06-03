---
description: >-
  Angular 21 forbidden patterns (hard constraints) — the list of things to NEVER
  do in frontend code. Apply when writing or reviewing any Angular/TypeScript
  code in frontend/.
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.html"
  - "frontend/**/*.css"
  - "frontend/**/*.scss"
---

# Angular 21 — Règles : ce qu'il NE FAUT PAS faire

Liste des interdits pour tout code Angular de ce repo. Si une de ces choses
apparaît dans un diff, c'est un bug à corriger. Le « à faire » correspondant est
dans le skill `angular-best-practices`.

## Architecture & composants
- ❌ **Pas de `NgModule`.** Composants/directives/pipes **standalone** uniquement.
- ❌ Pas de `ChangeDetectionStrategy.Default` — toujours **`OnPush`**.
- ❌ Pas de logique métier ni d'appel HTTP dans un composant : ça va dans un service.
- ❌ Pas de composant « god object » avec 15 inputs et 500 lignes — découper.

## Injection & API composant
- ❌ Pas d'injection par **constructeur** — utiliser **`inject()`**.
- ❌ Pas de décorateurs **`@Input()` / `@Output()`** — utiliser `input()`,
  `input.required()`, `output()`, `model()`.
- ❌ Pas de `@ViewChild`/`@ContentChild` décorateurs quand les variantes signal
  (`viewChild()`, `contentChild()`) existent.

## Réactivité & état
- ❌ Pas de **mutation en place** d'un signal (`arr.push(...)` puis re-set la même
  ref) — créer une nouvelle référence (`set`/`update`).
- ❌ Pas de stockage d'un état **dérivable** — utiliser `computed()`.
- ❌ Pas d'abus d'`effect()` pour ce qu'un `computed()` fait mieux.
- ❌ Pas de `ChangeDetectorRef.detectChanges()/markForCheck()` manuel pour
  contourner la réactivité.
- ❌ Pas de `subscribe()` sans nettoyage — préférer `httpResource`, `toSignal`,
  ou `takeUntilDestroyed`.

## Zoneless
- ❌ **Pas de `zone.js`** ni de `provideZoneChangeDetection()` (sauf migration
  d'un code legacy qui en dépend réellement).

## Templates
- ❌ Pas de `*ngIf` / `*ngFor` / `*ngSwitch` ni `NgIf`/`NgForOf`/`NgSwitch` —
  control flow natif `@if` / `@for` / `@switch`.
- ❌ Pas de `@for` **sans `track`**.
- ❌ Pas de `NgClass` / `NgStyle` — bindings `[class.x]` / `[style.x]`.
- ❌ Pas d'accès direct au DOM (`nativeElement.innerHTML`, manipulation manuelle).

## Typage
- ❌ **Pas de `any`.** Pas de `@ts-ignore` / `@ts-nocheck` pour masquer une erreur
  de type — corriger le type.
- ❌ Pas de désactivation du `strict` mode tsconfig.

## Formulaires
- ❌ Pas de formulaires **template-driven** pour un cas non trivial — Signal Forms
  (neuf) ou Reactive Forms.

## Styling
- ❌ Pas de couleurs/espacements/typo **en dur** — tokens du design system /
  utilitaires Tailwind (voir `angular-design-system`, `tailwindcss`).
- ❌ Pas de longues chaînes `class="..."` construites en TS — binder dans le template.
- ❌ Pas de `tailwind.config.js` (config CSS-first `@theme`) sauf nécessité réelle.

## Tests
- ❌ Pas de **Karma/Jasmine** — Vitest.
- ❌ Pas de `fixture.detectChanges()` pour flusher l'async — `await fixture.whenStable()`.
- ❌ Pas de sélecteurs fragiles (classes CSS, texte) — `data-test="..."`.
- ❌ Pas de test couplé à l'implémentation privée.

## Divers
- ❌ Pas de secrets/clé d'API en dur dans le front.
- ❌ Pas de second pattern pour une chose déjà faite d'une façon dans le repo.
