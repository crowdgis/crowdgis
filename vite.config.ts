/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // e2e/ holds Playwright specs — run those via `npm run test:e2e`, not vitest.
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  },
})
