import { describe, expect, it } from 'vitest'
import { features } from './registry'

describe('feature registry', () => {
  it('contains at least the base features', () => {
    const ids = features.map((f) => f.id)
    expect(ids).toContain('basemaps')
    expect(ids).toContain('coordinates')
  })

  it('has unique ids', () => {
    const ids = features.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses kebab-case ids and non-empty labels', () => {
    for (const f of features) {
      expect(f.id).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(f.label.length).toBeGreaterThan(0)
    }
  })
})
