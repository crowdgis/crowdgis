import { beforeEach, describe, expect, it } from 'vitest'
import type { ImportedLayer } from './layerStore'
import { useLayerStore } from './layerStore'

const sample: ImportedLayer = {
  name: 'Testebene',
  bounds: [
    [46, 7],
    [47, 8],
  ],
  source: { kind: 'vector', geojson: { type: 'FeatureCollection', features: [] } },
}

beforeEach(() => {
  useLayerStore.setState({ layers: [], zoomTarget: null })
})

describe('layerStore', () => {
  it('adds layers as visible with a unique id', () => {
    const id1 = useLayerStore.getState().addLayer(sample)
    const id2 = useLayerStore.getState().addLayer(sample)
    const { layers } = useLayerStore.getState()
    expect(layers).toHaveLength(2)
    expect(id1).not.toBe(id2)
    expect(layers[0].visible).toBe(true)
  })

  it('toggles visibility', () => {
    const id = useLayerStore.getState().addLayer(sample)
    useLayerStore.getState().setVisible(id, false)
    expect(useLayerStore.getState().layers[0].visible).toBe(false)
  })

  it('removes layers', () => {
    const id = useLayerStore.getState().addLayer(sample)
    useLayerStore.getState().removeLayer(id)
    expect(useLayerStore.getState().layers).toHaveLength(0)
  })

  it('re-triggers zoom requests to identical bounds via token', () => {
    const bounds = sample.bounds!
    useLayerStore.getState().requestZoom(bounds)
    const first = useLayerStore.getState().zoomTarget
    useLayerStore.getState().requestZoom(bounds)
    const second = useLayerStore.getState().zoomTarget
    expect(second!.token).toBeGreaterThan(first!.token)
  })
})
