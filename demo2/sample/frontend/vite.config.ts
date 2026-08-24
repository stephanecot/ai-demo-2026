import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy: the app always calls "/api/...", same origin, so no CORS in the demo path.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Test files and their harness carry no product behaviour.
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        // Bootstrap: mounts the real DOM root, never exercised under jsdom.
        'src/main.tsx',
        // Type-only module: erased at compile time, nothing to execute.
        'src/types/dto.ts',
      ],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
})
