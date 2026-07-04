import '../../lib/leaflet-setup'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'
import type { FeatureModule } from '../types'
import {
  useSketchToolStore,
  sketchHooks,
} from './sketchToolStore'
import {
  bindLayerInteractions,
  createTextLabel,
  initializeCreatedLayer,
  readFeatures,
  applyStyleToLayer,
  type LabelMode,
  type SketchLayer,
} from './layers'
import { canRedo, canUndo } from './history'
import { exportMapAsPng, type PngExportMode } from './png-export'
import type { SketchStyle } from './style'

/** Mounts the Geoman toolbar and mirrors sketches into the shared store. */
function SketchControls() {
  const map = useMap()
  const clearToken = useSketchStore((s) => s.clearToken)
  const presetStyle = useSketchToolStore((s) => s.presetStyle)

  useEffect(() => {
    useSketchToolStore.getState().setMap(map)
    map.pm.setLang('de')
    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolyline: true,
      drawPolygon: true,
      drawRectangle: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      rotateMode: false,
      cutPolygon: false,
    })

    const handleCreate = (e: { layer: SketchLayer }) => {
      const hooks = sketchHooks()
      initializeCreatedLayer(e.layer, hooks)
      bindLayerInteractions(map, e.layer, hooks)
      hooks.onChange(readFeatures(map))
    }
    const handleRemove = (e: { layer: SketchLayer }) => {
      if (useSketchToolStore.getState().selected?.layer === e.layer) {
        useSketchToolStore.getState().clearSelection()
      }
      sketchHooks().onChange(readFeatures(map))
    }
    const handleMapClick = (e: { latlng: L.LatLng }) => {
      if (useSketchToolStore.getState().labelMode !== 'free') return
      const text = window.prompt('Text der Beschriftung:')
      if (!text || !text.trim()) return
      createTextLabel(map, e.latlng, text.trim(), sketchHooks())
      sketchHooks().onChange(readFeatures(map))
    }

    map.on('pm:create', handleCreate)
    map.on('pm:remove', handleRemove)
    map.on('click', handleMapClick)

    return () => {
      map.off('pm:create', handleCreate)
      map.off('pm:remove', handleRemove)
      map.off('click', handleMapClick)
      map.pm.removeControls()
      useSketchToolStore.getState().setMap(null)
    }
  }, [map])

  useEffect(() => {
    map.pm.setGlobalOptions({
      pathOptions: { color: presetStyle.color, weight: presetStyle.weight, fillOpacity: 0.1 },
    })
  }, [map, presetStyle])

  useEffect(() => {
    if (clearToken > 0) {
      for (const layer of map.pm.getGeomanDrawLayers()) {
        layer.remove()
      }
      useSketchToolStore.getState().clearSelection()
      sketchHooks().onChange(readFeatures(map))
    }
  }, [clearToken, map])

  return null
}

/** Download the current sketches as a GeoJSON file. */
function downloadSketches(features: Feature[]) {
  const blob = new Blob(
    [JSON.stringify({ type: 'FeatureCollection', features }, null, 2)],
    { type: 'application/geo+json' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'skizzen.geojson'
  a.click()
  URL.revokeObjectURL(url)
}

const LABEL_MODE_BUTTONS: { mode: LabelMode; label: string }[] = [
  { mode: 'free', label: 'Textmarker setzen' },
  { mode: 'attach', label: 'Beschriftung anhängen' },
]

/** Small color + line-width form, shared by the preset and per-object editors. */
function StyleFields({
  style,
  onChange,
}: {
  style: SketchStyle
  onChange: (style: SketchStyle) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={style.color}
        onChange={(e) => onChange({ ...style, color: e.target.value })}
        className="h-7 w-9 cursor-pointer rounded-[3px] border border-hairline"
        aria-label="Farbe"
      />
      <input
        type="range"
        min={1}
        max={10}
        value={style.weight}
        onChange={(e) => onChange({ ...style, weight: Number(e.target.value) })}
        className="flex-1"
        aria-label="Linienstärke"
      />
      <span className="w-4 text-right font-mono text-xs text-stone">{style.weight}</span>
    </div>
  )
}

/** Sidebar section: style presets, labels, undo/redo, export and clear. */
function SketchPanel() {
  const features = useSketchStore((s) => s.features)
  const requestClear = useSketchStore((s) => s.requestClear)
  const map = useSketchToolStore((s) => s.map)
  const presetStyle = useSketchToolStore((s) => s.presetStyle)
  const setPresetStyle = useSketchToolStore((s) => s.setPresetStyle)
  const labelMode = useSketchToolStore((s) => s.labelMode)
  const setLabelMode = useSketchToolStore((s) => s.setLabelMode)
  const selected = useSketchToolStore((s) => s.selected)
  const clearSelection = useSketchToolStore((s) => s.clearSelection)
  const historyState = useSketchToolStore((s) => s.history)
  const requestUndo = useSketchToolStore((s) => s.requestUndo)
  const requestRedo = useSketchToolStore((s) => s.requestRedo)

  const applySelectedStyle = (style: SketchStyle) => {
    if (!selected || !map) return
    applyStyleToLayer(selected.layer, style)
    useSketchToolStore.getState().select(selected.layer, style)
    sketchHooks().onChange(readFeatures(map))
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="mb-1 text-xs text-stone">Farbe &amp; Linienstärke (neue Objekte)</p>
        <StyleFields style={presetStyle} onChange={setPresetStyle} />
      </div>

      {selected && (
        <div className="rounded-[3px] border border-hairline p-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs text-stone">Ausgewähltes Objekt</p>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-stone hover:text-signal"
            >
              Fertig
            </button>
          </div>
          <StyleFields style={selected.style} onChange={applySelectedStyle} />
        </div>
      )}

      <div>
        <p className="mb-1 text-xs text-stone">Textbeschriftungen</p>
        <div className="flex gap-2">
          {LABEL_MODE_BUTTONS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLabelMode(labelMode === mode ? 'none' : mode)}
              className={`flex-1 rounded-[3px] border px-2 py-1.5 text-xs font-medium ${
                labelMode === mode
                  ? 'border-ink bg-ink text-white'
                  : 'border-hairline text-stone hover:border-ink hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={requestUndo}
          disabled={!canUndo(historyState)}
          className="flex-1 rounded-[3px] border border-hairline px-2 py-1.5 text-xs text-stone hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Rückgängig
        </button>
        <button
          type="button"
          onClick={requestRedo}
          disabled={!canRedo(historyState)}
          className="flex-1 rounded-[3px] border border-hairline px-2 py-1.5 text-xs text-stone hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Wiederholen
        </button>
      </div>

      {features.length === 0 ? (
        <p className="text-xs text-stone">
          Zeichne mit den Werkzeugen links oben auf der Karte.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone">
            {features.length} {features.length === 1 ? 'Objekt' : 'Objekte'}{' '}
            gezeichnet
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadSketches(features)}
              className="flex-1 rounded-[3px] border border-ink px-2 py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-white"
            >
              Als GeoJSON exportieren
            </button>
            <button
              type="button"
              onClick={requestClear}
              className="rounded-[3px] border border-hairline px-2 py-1.5 text-xs text-stone hover:border-signal hover:text-signal"
            >
              Alle löschen
            </button>
          </div>
          <div className="flex gap-2">
            {(['drawing', 'map'] as PngExportMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => map && exportMapAsPng(map, mode)}
                disabled={!map}
                className="flex-1 rounded-[3px] border border-hairline px-2 py-1.5 text-xs font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode === 'drawing' ? 'PNG (nur Zeichnung)' : 'PNG (ganze Karte)'}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

const sketchingFeature: FeatureModule = {
  id: 'sketching',
  label: 'Skizzieren',
  MapSlot: SketchControls,
  SidebarPanel: SketchPanel,
}

export default sketchingFeature
