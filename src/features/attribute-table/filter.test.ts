import { describe, expect, it } from 'vitest'
import type { Feature } from 'geojson'
import { applyFilter } from './filter'

function makeFeature(props: Record<string, unknown>): Feature {
  return {
    type: 'Feature',
    properties: props,
    geometry: { type: 'Point', coordinates: [8.5, 47.4] },
  }
}

const features = [
  makeFeature({ name: 'Zürich', bewohner: 447_082, jahr: 2020 }),
  makeFeature({ name: 'Winterthur', bewohner: 114_220, jahr: 2019 }),
  makeFeature({ name: 'Uster', bewohner: 35_000, jahr: 2020 }),
]

describe('applyFilter', () => {
  it('returns all features unchanged for an empty expression', () => {
    expect(applyFilter(features, '')).toEqual({ features, error: null })
    expect(applyFilter(features, '   ')).toEqual({ features, error: null })
  })

  it('filters with a single numeric comparison', () => {
    const { features: result, error } = applyFilter(features, 'bewohner > 100000')
    expect(error).toBeNull()
    expect(result.map((f) => f.properties?.name)).toEqual(['Zürich', 'Winterthur'])
  })

  it('combines conditions with AND', () => {
    const { features: result } = applyFilter(features, 'bewohner > 100000 AND jahr = 2020')
    expect(result.map((f) => f.properties?.name)).toEqual(['Zürich'])
  })

  it('combines conditions with OR', () => {
    const { features: result } = applyFilter(features, "name = 'Uster' OR name = 'Zürich'")
    expect(result.map((f) => f.properties?.name)).toEqual(['Zürich', 'Uster'])
  })

  it('respects parentheses for grouping', () => {
    const { features: result } = applyFilter(
      features,
      "jahr = 2020 AND (name = 'Uster' OR name = 'Winterthur')",
    )
    expect(result.map((f) => f.properties?.name)).toEqual(['Uster'])
  })

  it('supports string equality and inequality', () => {
    expect(applyFilter(features, "name != 'Uster'").features).toHaveLength(2)
  })

  it('returns no features that lack a numeric value for ordering comparisons', () => {
    const { features: result } = applyFilter(
      [makeFeature({ name: 'Ohne Zahl' })],
      'bewohner > 10',
    )
    expect(result).toHaveLength(0)
  })

  it('reports a German error message for invalid syntax and returns no rows', () => {
    const { features: result, error } = applyFilter(features, 'bewohner >')
    expect(result).toHaveLength(0)
    expect(error).toBeTruthy()
  })

  it('reports an error for unknown characters', () => {
    const { error } = applyFilter(features, 'bewohner ~ 5')
    expect(error).toBeTruthy()
  })
})
