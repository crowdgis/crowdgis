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
    server: {
      deps: {
        // Ships directory-style ESM imports Node cannot resolve natively.
        inline: ['georaster-layer-for-leaflet'],
      },
    },
  },
})
