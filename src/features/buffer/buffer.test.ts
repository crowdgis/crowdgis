import { area } from '@turf/turf'
import { describe, expect, it } from 'vitest'
import type { FeatureCollection } from 'geojson'
import { bufferFeatureCollection } from './buffer'

const POINT_FC: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [8.5417, 47.3769] },
    },
  ],
}

describe('bufferFeatureCollection', () => {
  it('buffers every feature into a polygon with roughly the expected area', () => {
    const result = bufferFeatureCollection(POINT_FC, 100)
    expect(result.features).toHaveLength(1)
    expect(result.features[0].geometry.type).toBe('Polygon')
    const expectedArea = Math.PI * 100 * 100
    expect(area(result)).toBeGreaterThan(expectedArea * 0.9)
    expect(area(result)).toBeLessThan(expectedArea * 1.1)
  })

  it('leaves the input collection untouched', () => {
    bufferFeatureCollection(POINT_FC, 50)
    expect(POINT_FC.features[0].geometry.type).toBe('Point')
  })

  it('rejects a non-positive distance', () => {
    expect(() => bufferFeatureCollection(POINT_FC, 0)).toThrow()
    expect(() => bufferFeatureCollection(POINT_FC, -10)).toThrow()
    expect(() => bufferFeatureCollection(POINT_FC, NaN)).toThrow()
  })

  it('rejects an empty collection', () => {
    expect(() =>
      bufferFeatureCollection({ type: 'FeatureCollection', features: [] }, 100),
    ).toThrow()
  })
})
