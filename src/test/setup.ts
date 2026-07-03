import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Auto-cleanup does not register without vitest globals; do it explicitly.
afterEach(() => {
  cleanup()
})
