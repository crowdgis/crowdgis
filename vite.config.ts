/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // SPIKE EXPERIMENT: serve ol unbundled to isolate a rolldown issue.
  optimizeDeps: { exclude: ['ol'] },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // e2e/ holds Playwright specs — run those via `npm run test:e2e`, not vitest.
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
    server: {
      deps: {
        // Ships directory-style ESM imports Node cannot resolve natively.
        inline: ['georaster-layer-for-leaflet'],
      },
    },
  },
})
