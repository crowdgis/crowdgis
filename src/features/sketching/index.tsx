import { useEffect, useRef, useState } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Draw, { createBox } from 'ol/interaction/Draw'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import CircleStyle from 'ol/style/Circle'
import type { Feature } from 'geojson'
import { useOlMap } from '../../map/OlMap'
import { writeFeaturesWgs84 } from '../../lib/ol-geojson'
import { useSketchStore } from '../../state/sketchStore'
import type { FeatureModule } from '../types'

/** Landeskarte-red sketch style. */
const SKETCH_STYLE = new Style({
  stroke: new Stroke({ color: '#870010', width: 2 }),
  fill: new Fill({ color: 'rgba(135, 0, 16, 0.1)' }),
  image: new CircleStyle({
    radius: 6,
    stroke: new Stroke({ color: '#870010', width: 2 }),
    fill: new Fill({ color: 'rgba(135, 0, 16, 0.4)' }),
  }),
})

type SketchTool = 'Point' | 'LineString' | 'Polygon' | 'Box'

const SKETCH_TOOLS: { tool: SketchTool; icon: string; label: string }[] = [
  { tool: 'Point', icon: '●', label: 'Punkt zeichnen' },
  { tool: 'LineString', icon: '╱', label: 'Linie zeichnen' },
  { tool: 'Polygon', icon: '⬠', label: 'Fläche zeichnen' },
  { tool: 'Box', icon: '▭', label: 'Rechteck zeichnen' },
]

/** Draw toolbar on the map + interactions, mirrored into the store. */
function SketchTools() {
  const map = useOlMap()
  const clearToken = useSketchStore((s) => s.clearToken)
  const [activeTool, setActiveTool] = useState<SketchTool | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)
  if (!sourceRef.current) sourceRef.current = new VectorSource()
  const source = sourceRef.current

  // Sketch layer on the map; every source change syncs WGS84 GeoJSON
  // into the store (measure panel and sketch list update live).
  useEffect(() => {
    const layer = new VectorLayer({ source, style: SKETCH_STYLE, zIndex: 100 })
    map.addLayer(layer)
    const sync = () => {
      const fc = writeFeaturesWgs84(source.getFeatures())
      useSketchStore.getState().setFeatures(fc.features as Feature[])
    }
    source.on(['addfeature', 'removefeature', 'changefeature'], sync)
    return () => {
      source.un(['addfeature', 'removefeature', 'changefeature'], sync)
      map.removeLayer(layer)
    }
  }, [map, source])

  // Active tool → OL Draw interaction.
  useEffect(() => {
    if (!activeTool) return
    const draw = new Draw({
      source,
      type: activeTool === 'Box' ? 'Circle' : activeTool,
      geometryFunction: activeTool === 'Box' ? createBox() : undefined,
      style: SKETCH_STYLE,
    })
    map.addInteraction(draw)
    return () => {
      map.removeInteraction(draw)
    }
  }, [map, source, activeTool])

  // "Alle löschen" from the sidebar panel.
  useEffect(() => {
    if (clearToken > 0) {
      source.clear()
      useSketchStore.getState().setFeatures([])
    }
  }, [clearToken, source])

  return (
    <div className="absolute top-20 left-2 z-10 flex flex-col gap-1">
      {SKETCH_TOOLS.map(({ tool, icon, label }) => (
        <button
          key={tool}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={activeTool === tool}
          onClick={() => setActiveTool(activeTool === tool ? null : tool)}
          className={`flex h-8 w-8 items-center justify-center rounded-[3px] border text-sm shadow-sm ${
            activeTool === tool
              ? 'border-signal bg-signal text-white'
              : 'border-hairline bg-sheet text-stone hover:text-ink'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  )
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

/** Sidebar section: sketch summary, export and clear. */
function SketchPanel() {
  const features = useSketchStore((s) => s.features)
  const requestClear = useSketchStore((s) => s.requestClear)

  return (
    <section>
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
        </div>
      )}
    </section>
  )
}

const sketchingFeature: FeatureModule = {
  id: 'sketching',
  label: 'Skizzieren',
  MapSlot: SketchTools,
  SidebarPanel: SketchPanel,
}

export default sketchingFeature
