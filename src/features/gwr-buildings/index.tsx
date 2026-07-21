import { useEffect, useMemo, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import type Polygon from 'ol/geom/Polygon'
import { useOlMap } from '../../map/OlMap'
import type { FeatureModule } from '../types'
import { useGwrBuildingsStore } from './store'
import { collectColumns, downloadGwrCsv } from './csv'

/** Cap rendered rows to keep the DOM responsive for large query areas. */
const MAX_ROWS = 200

const AREA_STYLE = new Style({
  stroke: new Stroke({ color: '#0a5fa8', width: 2 }),
  fill: new Fill({ color: 'rgba(10, 95, 168, 0.12)' }),
})

/** Map overlay: toggle button + polygon draw interaction that triggers the GWR query. */
function GwrDrawTool() {
  const map = useOlMap()
  const drawing = useGwrBuildingsStore((s) => s.drawing)
  const setDrawing = useGwrBuildingsStore((s) => s.setDrawing)
  const runQuery = useGwrBuildingsStore((s) => s.runQuery)
  const clearToken = useGwrBuildingsStore((s) => s.clearToken)
  const sourceRef = useRef<VectorSource | null>(null)
  if (!sourceRef.current) sourceRef.current = new VectorSource()
  const source = sourceRef.current

  useEffect(() => {
    const layer = new VectorLayer({ source, style: AREA_STYLE, zIndex: 90 })
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, source])

  useEffect(() => {
    if (clearToken > 0) source.clear()
  }, [clearToken, source])

  // One polygon at a time: starting to draw clears the previous query area.
  useEffect(() => {
    if (!drawing) return
    source.clear()
    const draw = new Draw({ source, type: 'Polygon', style: AREA_STYLE })
    draw.on('drawend', (evt) => {
      const polygon = evt.feature.getGeometry() as Polygon
      const rings = polygon.getCoordinates()
      const extent = polygon.getExtent() as [number, number, number, number]
      setDrawing(false)
      void runQuery(rings, extent)
    })
    map.addInteraction(draw)
    return () => {
      map.removeInteraction(draw)
    }
  }, [map, source, drawing, setDrawing, runQuery])

  return (
    <button
      type="button"
      title="Gebiet für GWR-Abfrage zeichnen"
      aria-label="Gebiet für GWR-Abfrage zeichnen"
      aria-pressed={drawing}
      onClick={() => setDrawing(!drawing)}
      className={`absolute top-20 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-[3px] border text-sm shadow-sm ${
        drawing
          ? 'border-signal bg-signal text-white'
          : 'border-hairline bg-sheet text-stone hover:text-ink'
      }`}
    >
      🏠
    </button>
  )
}

/** Sidebar section: instructions, status and CSV export. */
function GwrSidebarPanel() {
  const buildings = useGwrBuildingsStore((s) => s.buildings)
  const loading = useGwrBuildingsStore((s) => s.loading)
  const error = useGwrBuildingsStore((s) => s.error)
  const clear = useGwrBuildingsStore((s) => s.clear)

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-stone">
        Zeichne mit dem 🏠-Werkzeug oben rechts auf der Karte ein Gebiet. Für
        alle Gebäude darin werden die öffentlichen GWR-Daten abgefragt.
      </p>
      {loading && <p className="text-xs text-stone">Lade GWR-Daten…</p>}
      {error && <p className="text-xs text-signal">{error}</p>}
      {buildings && !loading && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone">
            {buildings.length === 0
              ? 'Keine Gebäude im gezeichneten Gebiet gefunden.'
              : `${buildings.length} Gebäude gefunden`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadGwrCsv(buildings)}
              disabled={buildings.length === 0}
              className="flex-1 rounded-[3px] border border-ink px-2 py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Als CSV exportieren
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-[3px] border border-hairline px-2 py-1.5 text-xs text-stone hover:border-signal hover:text-signal"
            >
              Gebiet löschen
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '–'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Bottom panel: full attribute list of the GWR buildings found in the drawn area. */
function GwrBottomPanel() {
  const buildings = useGwrBuildingsStore((s) => s.buildings)
  const columns = useMemo(() => collectColumns(buildings ?? []), [buildings])

  if (!buildings || buildings.length === 0) return null

  return (
    <div className="flex h-56 shrink-0 flex-col border-t border-hairline bg-sheet">
      <div className="flex items-center gap-3 border-b border-hairline px-3 py-1.5">
        <h2 className="label-micro">GWR-Gebäude</h2>
        <span className="text-xs text-stone">
          {buildings.length} {buildings.length === 1 ? 'Gebäude' : 'Gebäude'}
          {buildings.length > MAX_ROWS && `, erste ${MAX_ROWS} angezeigt`}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-paper">
            <tr>
              <th className="label-micro border-b border-hairline px-2 py-1 text-left">
                #
              </th>
              {columns.map((c) => (
                <th
                  key={c}
                  className="border-b border-hairline px-2 py-1 text-left font-semibold text-black"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buildings.slice(0, MAX_ROWS).map((b, i) => (
              <tr key={i} className="border-b border-hairline">
                <td className="px-2 py-1 font-mono text-stone">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c} className="max-w-56 truncate px-2 py-1">
                    {formatValue(b[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const gwrBuildingsFeature: FeatureModule = {
  id: 'gwr-buildings',
  label: 'GWR-Gebäuderegister',
  icon: '🏠',
  MapSlot: GwrDrawTool,
  SidebarPanel: GwrSidebarPanel,
  BottomPanel: GwrBottomPanel,
}

export default gwrBuildingsFeature
