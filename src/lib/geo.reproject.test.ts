import { describe, expect, it } from 'vitest'
import type { Polygon } from 'geojson'
import { isSupportedVectorProjection, reprojectGeometryToWgs84 } from './geo'

describe('reprojectGeometryToWgs84', () => {
  it('reprojects an LV95 (EPSG:2056) polygon to WGS84 near Chur', () => {
    // Native LV95 ring around Chur (from the Quartiereinteilung.gpkg).
    const lv95: Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [2757674.756, 1190479.295],
          [2757668.446, 1190483.12],
          [2757604.17, 1190517.491],
          [2757674.756, 1190479.295],
        ],
      ],
    }
    const wgs = reprojectGeometryToWgs84(lv95, 2056) as Polygon
    const [lng, lat] = wgs.coordinates[0][0]
    // Chur is at roughly 9.53°E / 46.85°N.
    expect(lng).toBeCloseTo(9.5061, 2)
    expect(lat).toBeCloseTo(46.8468, 2)
  })

  it('leaves WGS84 geometry unchanged', () => {
    const p: Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [8.5, 47.4],
          [8.6, 47.4],
          [8.6, 47.5],
          [8.5, 47.4],
        ],
      ],
    }
    expect(reprojectGeometryToWgs84(p, 4326)).toEqual(p)
  })

  it('knows which projections it supports', () => {
    expect(isSupportedVectorProjection(2056)).toBe(true)
    expect(isSupportedVectorProjection(21781)).toBe(true)
    expect(isSupportedVectorProjection(4326)).toBe(true)
    expect(isSupportedVectorProjection(31467)).toBe(false)
  })
})
