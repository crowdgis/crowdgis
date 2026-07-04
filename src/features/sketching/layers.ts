import * as L from 'leaflet'
import type { Feature } from 'geojson'
import { DEFAULT_STYLE, styleOf, type SketchStyle } from './style'
import { attachedLabel, escapeHtml, isTextLabel, labelText } from './labels'

export type LabelMode = 'none' | 'free' | 'attach'

export type SketchLayer = L.Layer & {
  feature?: Feature
  setStyle?: (style: Partial<SketchStyle>) => void
  _drawnByGeoman?: boolean
}

/** Callbacks that connect layer interactions back to the feature's state. */
export interface SketchHooks {
  getLabelMode: () => LabelMode
  getPresetStyle: () => SketchStyle
  onSelect: (layer: SketchLayer, style: SketchStyle) => void
  onChange: (features: Feature[]) => void
}

const TEXT_LABEL_CLASS = 'sketch-text-label'
const ATTACHED_LABEL_CLASS = 'sketch-label-tooltip'

function withProperties(properties: Record<string, unknown>): Feature {
  return { type: 'Feature', properties, geometry: { type: 'Point', coordinates: [0, 0] } }
}

const TEXT_LABEL_INLINE_STYLE =
  'display:inline-block;white-space:nowrap;background:#fff;border:1px solid #870010;' +
  'border-radius:3px;padding:1px 6px;font-size:12px;color:#1a1a1a;transform:translate(-50%,-100%);'

function textLabelIcon(text: string): L.DivIcon {
  return L.divIcon({
    className: TEXT_LABEL_CLASS,
    html: `<span style="${TEXT_LABEL_INLINE_STYLE}">${escapeHtml(text)}</span>`,
    iconSize: [0, 0],
  })
}

function isPathLayer(layer: SketchLayer): layer is SketchLayer & L.Path {
  return layer instanceof L.Path
}

/** Reads every Geoman-drawn layer on the map back into plain GeoJSON. */
export function readFeatures(map: L.Map): Feature[] {
  return map.pm
    .getGeomanDrawLayers()
    .map((layer) => (layer as SketchLayer & { toGeoJSON: () => Feature }).toGeoJSON())
}

/** Prompts the user and applies (or clears) a tooltip label attached to `layer`. */
function promptAttachedLabel(layer: SketchLayer): boolean {
  const existing = attachedLabel(layer.feature) ?? ''
  const input = window.prompt('Beschriftung für dieses Objekt (leer lassen zum Entfernen):', existing)
  if (input === null) return false
  const text = input.trim()
  if (text) {
    layer
      .bindTooltip(escapeHtml(text), { permanent: true, direction: 'top', className: ATTACHED_LABEL_CLASS })
      .openTooltip()
  } else {
    layer.unbindTooltip()
  }
  layer.feature = withProperties({ ...layer.feature?.properties, label: text || undefined })
  return true
}

/** Prompts the user for the new text of a free-standing text-label marker. */
function promptTextLabel(layer: SketchLayer): boolean {
  const input = window.prompt('Text der Beschriftung:', labelText(layer.feature))
  if (input === null) return false
  const text = input.trim()
  if (!text) return false
  ;(layer as L.Marker).setIcon(textLabelIcon(text))
  layer.feature = withProperties({ isLabel: true, text })
  return true
}

/** Wires click/drag/edit interactions for a single sketch layer. */
export function bindLayerInteractions(map: L.Map, layer: SketchLayer, hooks: SketchHooks) {
  const emitChange = () => hooks.onChange(readFeatures(map))

  layer.on('pm:update', emitChange)
  layer.on('dragend', emitChange)
  layer.on('click', (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e)
    const mode = hooks.getLabelMode()
    if (mode === 'attach') {
      if (promptAttachedLabel(layer)) emitChange()
      return
    }
    if (isTextLabel(layer.feature)) {
      if (promptTextLabel(layer)) emitChange()
      return
    }
    if (isPathLayer(layer)) {
      hooks.onSelect(layer, styleOf(layer.feature) ?? DEFAULT_STYLE)
    }
  })
}

/** Creates a free-standing, draggable text-label marker at `latlng`. */
export function createTextLabel(map: L.Map, latlng: L.LatLng, text: string, hooks: SketchHooks): SketchLayer {
  const marker: SketchLayer = L.marker(latlng, { draggable: true, icon: textLabelIcon(text) })
  marker._drawnByGeoman = true
  marker.feature = withProperties({ isLabel: true, text })
  bindLayerInteractions(map, marker, hooks)
  marker.addTo(map)
  return marker
}

/** Builds a live Leaflet layer from a plain GeoJSON sketch feature (used to rebuild history snapshots). */
export function createLayerFromFeature(feature: Feature): SketchLayer | null {
  if (feature.geometry?.type === 'Point' && isTextLabel(feature)) {
    const [lng, lat] = feature.geometry.coordinates as [number, number]
    return L.marker([lat, lng], { draggable: true, icon: textLabelIcon(labelText(feature)) })
  }

  const layers = L.geoJSON(feature, {
    style: () => styleOf(feature) ?? DEFAULT_STYLE,
    pointToLayer: (_pointFeature, latlng) => L.marker(latlng),
  }).getLayers()
  const built = (layers[0] as SketchLayer | undefined) ?? null

  const label = attachedLabel(feature)
  if (built && label) {
    built.bindTooltip(escapeHtml(label), { permanent: true, direction: 'top', className: ATTACHED_LABEL_CLASS })
  }
  return built
}

/** Replaces all sketch layers on the map with the ones described by `features`. */
export function rebuildLayers(map: L.Map, features: Feature[], hooks: SketchHooks) {
  for (const layer of map.pm.getGeomanDrawLayers()) {
    layer.remove()
  }
  for (const feature of features) {
    const layer = createLayerFromFeature(feature)
    if (!layer) continue
    layer._drawnByGeoman = true
    layer.feature = feature
    bindLayerInteractions(map, layer, hooks)
    layer.addTo(map)
  }
}

/** Applies the preset style to a layer freshly created via a Geoman draw tool. */
export function initializeCreatedLayer(layer: SketchLayer, hooks: SketchHooks) {
  const style = hooks.getPresetStyle()
  layer.feature = withProperties({ style })
  layer.setStyle?.(style)
}

/** Applies a new style to an already-selected layer (color/weight adjustment). */
export function applyStyleToLayer(layer: SketchLayer, style: SketchStyle) {
  layer.setStyle?.(style)
  layer.feature = withProperties({ ...layer.feature?.properties, style })
}
