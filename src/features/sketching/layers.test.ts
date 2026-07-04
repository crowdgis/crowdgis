import { describe, expect, it, vi } from 'vitest'
import * as L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import type { Feature } from 'geojson'
import { createLayerFromFeature, rebuildLayers, readFeatures, type SketchHooks } from './layers'

function noopHooks(): SketchHooks {
  return {
    getLabelMode: () => 'none',
    getPresetStyle: () => ({ color: '#870010', weight: 2 }),
    onSelect: vi.fn(),
    onChange: vi.fn(),
  }
}

describe('createLayerFromFeature', () => {
  it('recreates a styled polygon from its GeoJSON', () => {
    const feature: Feature = {
      type: 'Feature',
      properties: { style: { color: '#123456', weight: 5 } },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [8, 47],
            [8.1, 47],
            [8.1, 47.1],
            [8, 47],
          ],
        ],
      },
    }
    const layer = createLayerFromFeature(feature) as L.Polygon
    expect(layer).toBeInstanceOf(L.Polygon)
    expect(layer.options.color).toBe('#123456')
    expect(layer.options.weight).toBe(5)
  })

  it('recreates a free-standing text label as a draggable marker', () => {
    const feature: Feature = {
      type: 'Feature',
      properties: { isLabel: true, text: 'Gipfel' },
      geometry: { type: 'Point', coordinates: [8, 47] },
    }
    const layer = createLayerFromFeature(feature) as L.Marker
    expect(layer).toBeInstanceOf(L.Marker)
    expect(layer.options.draggable).toBe(true)
    expect(layer.getLatLng()).toEqual(L.latLng(47, 8))
  })

  it('rebinds an attached label as a permanent tooltip', () => {
    const feature: Feature = {
      type: 'Feature',
      properties: { label: 'Parzelle 12' },
      geometry: { type: 'Point', coordinates: [8, 47] },
    }
    const layer = createLayerFromFeature(feature)!
    expect(layer.getTooltip()?.getContent()).toBe('Parzelle 12')
  })
})

describe('rebuildLayers + readFeatures', () => {
  it('round-trips a snapshot through the map', () => {
    const container = document.createElement('div')
    const map = L.map(container, { center: [47, 8], zoom: 10 })
    const snapshot: Feature[] = [
      {
        type: 'Feature',
        properties: { style: { color: '#000000', weight: 3 } },
        geometry: { type: 'LineString', coordinates: [[8, 47], [8.1, 47.1]] },
      },
    ]

    rebuildLayers(map, snapshot, noopHooks())
    const result = readFeatures(map)

    expect(result).toHaveLength(1)
    expect(result[0].geometry.type).toBe('LineString')
    expect(result[0].properties?.style).toEqual({ color: '#000000', weight: 3 })

    map.remove()
  })
})
