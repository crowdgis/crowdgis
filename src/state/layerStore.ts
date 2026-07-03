import { create } from 'zustand'
import type { FeatureCollection } from 'geojson'
import type { GeoRasterData } from 'georaster'

/** Leaflet-order bounds: [[south, west], [north, east]] in WGS84. */
export type LayerBounds = [[number, number], [number, number]]

export interface VectorLayerSource {
  kind: 'vector'
  geojson: FeatureCollection
}

export interface RasterLayerSource {
  kind: 'raster'
  georaster: GeoRasterData
}

export type LayerSource = VectorLayerSource | RasterLayerSource

export interface AppLayer {
  id: string
  name: string
  visible: boolean
  /** WGS84 bounds for zoom-to-layer, null when unknown/empty. */
  bounds: LayerBounds | null
  source: LayerSource
}

export interface ImportedLayer {
  name: string
  bounds: LayerBounds | null
  source: LayerSource
  /** Non-fatal import note shown once to the user (e.g. skipped features). */
  note?: string
}

interface ZoomTarget {
  bounds: LayerBounds
  /** Monotonic token so repeated zooms to the same bounds re-trigger. */
  token: number
}

interface LayerState {
  layers: AppLayer[]
  addLayer: (layer: ImportedLayer) => string
  removeLayer: (id: string) => void
  setVisible: (id: string, visible: boolean) => void
  zoomTarget: ZoomTarget | null
  requestZoom: (bounds: LayerBounds) => void
  /** Layer whose attribute table is open, null = closed. */
  attributeTableLayerId: string | null
  setAttributeTableLayer: (id: string | null) => void
}

let zoomToken = 0

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  addLayer: (layer) => {
    const id = crypto.randomUUID()
    set((s) => ({ layers: [...s.layers, { ...layer, id, visible: true }] }))
    return id
  },
  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      attributeTableLayerId:
        s.attributeTableLayerId === id ? null : s.attributeTableLayerId,
    })),
  setVisible: (id, visible) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, visible } : l)),
    })),
  zoomTarget: null,
  requestZoom: (bounds) => {
    zoomToken += 1
    set({ zoomTarget: { bounds, token: zoomToken } })
  },
  attributeTableLayerId: null,
  setAttributeTableLayer: (id) => set({ attributeTableLayerId: id }),
}))
