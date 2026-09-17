import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Le frontend ne connaît que `/api` : c'est le backend (port 3001) qui détient les
// tarifs et calcule tous les coûts. Le proxy évite CORS et garde la même origine
// entre le développement et la production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
