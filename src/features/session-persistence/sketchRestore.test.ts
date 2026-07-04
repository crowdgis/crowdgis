import { beforeEach, describe, expect, it } from 'vitest'
import * as L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'
import { restoreSketches } from './sketchRestore'

beforeEach(() => {
  useSketchStore.setState({ features: [], clearToken: 0 })
})

function newMap(): L.Map {
  return L.map(document.createElement('div'), { center: [47, 8], zoom: 10 })
}

describe('restoreSketches', () => {
  it('adds saved shapes to the map with their style and syncs the sketch store', () => {
    const map = newMap()
    const saved: Feature[] = [
      {
        type: 'Feature',
        properties: { style: { color: '#123456', weight: 4 } },
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
      },
    ]

    restoreSketches(map, saved)

    const drawn = map.pm.getGeomanDrawLayers()
    expect(drawn).toHaveLength(1)
    expect((drawn[0] as L.Polygon).options.color).toBe('#123456')
    expect(useSketchStore.getState().features).toHaveLength(1)
  })

  it('restores a free-standing text label as a draggable marker with a tooltip', () => {
    const map = newMap()
    const saved: Feature[] = [
      {
        type: 'Feature',
        properties: { isLabel: true, text: 'Gipfel' },
        geometry: { type: 'Point', coordinates: [8, 47] },
      },
    ]

    restoreSketches(map, saved)

    const [marker] = map.pm.getGeomanDrawLayers() as L.Marker[]
    expect(marker.options.draggable).toBe(true)
    expect(marker.getTooltip()?.getContent()).toBe('Gipfel')
  })

  it('makes restored shapes deletable like freshly-drawn ones', () => {
    const map = newMap()
    restoreSketches(map, [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [8, 47] },
      },
    ])
    for (const layer of map.pm.getGeomanDrawLayers()) layer.remove()
    expect(map.pm.getGeomanDrawLayers()).toHaveLength(0)
  })
})
