import { describe, expect, it } from 'vitest'
import {
  detectImportKind,
  layerNameFromFilename,
  toFeatureCollection,
} from './parse'

describe('detectImportKind', () => {
  it('maps known extensions', () => {
    expect(detectImportKind('rivers.geojson')).toBe('geojson')
    expect(detectImportKind('data.JSON')).toBe('geojson')
    expect(detectImportKind('swiss.gpkg')).toBe('gpkg')
    expect(detectImportKind('dem.tif')).toBe('geotiff')
    expect(detectImportKind('ortho.TIFF')).toBe('geotiff')
  })

  it('returns null for unsupported files', () => {
    expect(detectImportKind('style.css')).toBeNull()
    expect(detectImportKind('no-extension')).toBeNull()
  })
})

describe('layerNameFromFilename', () => {
  it('strips the extension', () => {
    expect(layerNameFromFilename('gemeinden.geojson')).toBe('gemeinden')
  })

  it('strips directories and keeps inner dots', () => {
    expect(layerNameFromFilename('C:\\data\\zh.gewaesser.gpkg')).toBe(
      'zh.gewaesser',
    )
  })
})

describe('toFeatureCollection', () => {
  it('passes a FeatureCollection through', () => {
    const fc = { type: 'FeatureCollection', features: [] }
    expect(toFeatureCollection(fc).type).toBe('FeatureCollection')
  })

  it('wraps a single Feature', () => {
    const f = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [8, 47] },
    }
    expect(toFeatureCollection(f).features).toHaveLength(1)
  })

  it('rejects non-GeoJSON with a German message', () => {
    expect(() => toFeatureCollection({ foo: 1 })).toThrow(/kein gültiges GeoJSON/)
    expect(() => toFeatureCollection({ type: 'Point' })).toThrow(
      /FeatureCollection/,
    )
  })
})
