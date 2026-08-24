---
name: npm-wrapper
allowed-tools: Bash, Read, Glob, Grep
description: >-
  The canonical npm command reference for the Angular 21 frontend in this repo —
  install, serve, build, test (Vitest), lint, and docs scripts. Use whenever you
  need to run a frontend task so the right command/flags are used consistently.
  Run npm commands from the frontend project directory.
---

# npm wrapper (frontend commands)

Single source of truth for how we drive the Angular frontend with npm. Always
run these **from the frontend project directory** (where `package.json` lives,
e.g. `frontend/`). Never invent ad-hoc flags — use the scripts below.

## Everyday commands

| Task | Command |
|------|---------|
| Install deps (respect lockfile) | `npm ci` |
| Add a dependency | `npm install <pkg>` / dev: `npm install -D <pkg>` |
| Start dev server | `npm start` (alias for `ng serve`) |
| Production build | `npm run build` |
| Run unit/component tests | `npm test` (Vitest) |
| Tests once, no watch (CI) | `npm test -- --run` |
| Lint | `npm run lint` |
| Generate backend doc PDF | `npm run docs:backend` |
| Generate frontend doc PDF | `npm run docs:frontend` |

## Rules

- Use **`npm ci`** for clean/reproducible installs (CI and fresh checkouts);
  `npm install` only when adding/updating a dependency. Commit the updated
  `package-lock.json`.
- Pass flags to the underlying tool after `--`, e.g. `npm test -- --run`,
  `npm run build -- --configuration production`.
- After changing code, run `npm test` (and `npm run lint` / `npm run build` when
  relevant) and **report the real output**. Don't claim success on a red run.
- Prefer `ng generate` via the Angular CLI for scaffolding components/services so
  the standalone, OnPush conventions are applied:
  `npx ng generate component features/products/product-list`.
- Don't add global installs; keep tooling in `devDependencies` and call via
  `npm run`/`npx`.
- Don't commit `node_modules/` or `build/` artifacts.

## Expected scripts (package.json)

Keep `package.json` scripts aligned with this table; if a script is missing, add
it rather than running a long raw command:

```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "docs:backend": "mmdc -i docs/backend.md -o build/backend.md && md-to-pdf build/backend.md && mv build/backend.pdf docs/backend.pdf",
    "docs:frontend": "mmdc -i docs/frontend.md -o build/frontend.md && md-to-pdf build/frontend.md && mv build/frontend.pdf docs/frontend.pdf"
  }
}
```
