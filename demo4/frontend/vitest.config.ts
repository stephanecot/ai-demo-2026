import { defineConfig, mergeConfig } from 'vitest/config';

import configurationVite from './vite.config';

// On repart de la configuration Vite pour bénéficier du plugin React (le JSX des
// tests passe par la même transformation que celui de l'application).
export default mergeConfig(
  configurationVite,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**'],
        // main.tsx ne fait que monter l'application : rien à couvrir.
        exclude: ['src/main.tsx'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  }),
);
