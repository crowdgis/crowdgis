import * as L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'

type SketchLayer = L.Layer & {
  feature?: Feature
  toGeoJSON: () => Feature
  _drawnByGeoman?: boolean
}

const DEFAULT_STYLE = { color: '#870010', weight: 2 }

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function styleOf(feature: Feature): L.PathOptions {
  const style = feature.properties?.style
  if (!style || typeof style !== 'object') return DEFAULT_STYLE
  const { color, weight } = style as Record<string, unknown>
  return typeof color === 'string' && typeof weight === 'number'
    ? { color, weight }
    : DEFAULT_STYLE
}

/** Rebuilds one saved sketch feature as a live Leaflet layer, mirroring the shapes sketching.ts draws. */
function buildLayer(feature: Feature): SketchLayer | null {
  if (feature.properties?.isLabel === true && feature.geometry?.type === 'Point') {
    const [lng, lat] = feature.geometry.coordinates as [number, number]
    const text = typeof feature.properties?.text === 'string' ? feature.properties.text : ''
    const marker: SketchLayer = L.marker([lat, lng], { draggable: true }) as SketchLayer
    marker.bindTooltip(escapeHtml(text), { permanent: true, direction: 'top' }).openTooltip()
    return marker
  }

  const built = L.geoJSON(feature, {
    style: () => styleOf(feature),
    pointToLayer: (_pointFeature, latlng) => L.marker(latlng),
  }).getLayers()[0] as SketchLayer | undefined
  if (!built) return null

  const label = feature.properties?.label
  if (typeof label === 'string' && label.length > 0) {
    built.bindTooltip(escapeHtml(label), { permanent: true, direction: 'top' }).openTooltip()
  }
  return built
}

/** Reads every Geoman-drawn layer on the map back into the shared sketch store. */
function syncSketchStore(map: L.Map): void {
  const features = map.pm.getGeomanDrawLayers().map((layer) => (layer as SketchLayer).toGeoJSON())
  useSketchStore.getState().setFeatures(features)
}

/**
 * Re-creates saved sketches as live, editable Geoman layers on the map and
 * syncs the shared sketch store to match. Uses only Leaflet/Geoman's public
 * APIs (never sketching's internal module) to keep features independent.
 */
export function restoreSketches(map: L.Map, features: Feature[]): void {
  for (const feature of features) {
    const layer = buildLayer(feature)
    if (!layer) continue
    layer._drawnByGeoman = true
    layer.feature = feature
    layer.on('pm:update', () => syncSketchStore(map))
    layer.on('dragend', () => syncSketchStore(map))
    layer.addTo(map)
  }
  syncSketchStore(map)
}
