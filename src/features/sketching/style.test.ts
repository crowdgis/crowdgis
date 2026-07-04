import { describe, expect, it } from 'vitest'
import type { Feature } from 'geojson'
import { styleOf } from './style'

const featureWith = (properties: Record<string, unknown> | null): Feature => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Point', coordinates: [0, 0] },
})

describe('styleOf', () => {
  it('reads a valid style from feature properties', () => {
    expect(styleOf(featureWith({ style: { color: '#123456', weight: 4 } }))).toEqual({
      color: '#123456',
      weight: 4,
    })
  })

  it('returns null when there is no style', () => {
    expect(styleOf(featureWith({}))).toBeNull()
    expect(styleOf(featureWith(null))).toBeNull()
    expect(styleOf(undefined)).toBeNull()
  })

  it('returns null for a malformed style', () => {
    expect(styleOf(featureWith({ style: { color: '#123456' } }))).toBeNull()
    expect(styleOf(featureWith({ style: 'red' }))).toBeNull()
  })
})
