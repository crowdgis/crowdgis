import { describe, expect, it } from 'vitest'
import type { FeatureCollection } from 'geojson'
import type { GeoRasterData } from 'georaster'
import { rasterBounds, vectorBounds } from './geo'

const points: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [8.5, 47.4] },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [7.4, 46.9] },
    },
  ],
}

describe('vectorBounds', () => {
  it('computes the envelope of a FeatureCollection', () => {
    expect(vectorBounds(points)).toEqual([
      [46.9, 7.4],
      [47.4, 8.5],
    ])
  })

  it('returns null for an empty collection', () => {
    expect(vectorBounds({ type: 'FeatureCollection', features: [] })).toBeNull()
  })
})

function fakeRaster(partial: Partial<GeoRasterData>): GeoRasterData {
  return {
    width: 10,
    height: 10,
    pixelWidth: 1,
    pixelHeight: 1,
    numberOfRasters: 1,
    noDataValue: null,
    values: [],
    xmin: 0,
    xmax: 1,
    ymin: 0,
    ymax: 1,
    projection: 4326,
    ...partial,
  }
}

describe('rasterBounds', () => {
  it('passes WGS84 bounds through', () => {
    const r = fakeRaster({ xmin: 7, xmax: 8, ymin: 46, ymax: 47 })
    expect(rasterBounds(r)).toEqual([
      [46, 7],
      [47, 8],
    ])
  })

  it('transforms LV95 bounds to WGS84', () => {
    // 1 km box around the LV95 origin (Bern)
    const r = fakeRaster({
      projection: 2056,
      xmin: 2_599_500,
      xmax: 2_600_500,
      ymin: 1_199_500,
      ymax: 1_200_500,
    })
    const b = rasterBounds(r)
    expect(b).not.toBeNull()
    const [[south, west], [north, east]] = b!
    expect((south + north) / 2).toBeCloseTo(46.95108, 3)
    expect((west + east) / 2).toBeCloseTo(7.438637, 3)
    expect(north).toBeGreaterThan(south)
    expect(east).toBeGreaterThan(west)
  })

  it('returns null for unsupported projections', () => {
    expect(rasterBounds(fakeRaster({ projection: 31467 }))).toBeNull()
  })
})
