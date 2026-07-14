import { useEffect, useRef } from 'react'
import type { Feature as OlFeature } from 'ol'
import type Polygon from 'ol/geom/Polygon'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import type WebGLTileLayer from 'ol/layer/WebGLTile'
import type { Polygon as GeoJsonPolygon } from 'geojson'
import { useOlMap } from '../../map/OlMap'
import { writeFeaturesWgs84 } from '../../lib/ol-geojson'
import type { FeatureModule } from '../types'
import { searchSentinel2Scenes } from './api'
import { makeSentinel2Layer } from './layer'
import { useSentinel2TimetravelStore } from './store'

/** Aquamarine outline for the area-of-interest polygon. */
const AOI_STYLE = new Style({
  stroke: new Stroke({ color: '#0a7ea4', width: 2 }),
  fill: new Fill({ color: 'rgba(10, 126, 164, 0.1)' }),
})

/** Formats an ISO datetime as a German date, e.g. '2023-05-01T10:00:00Z' -> '01.05.2023'. */
function dateLabel(datetime: string): string {
  const date = new Date(datetime)
  if (Number.isNaN(date.getTime())) return datetime
  return date.toLocaleDateString('de-CH')
}

/** AOI drawing + the scene layer on the map, and the search that connects them. */
function Sentinel2Map() {
  const map = useOlMap()
  const drawing = useSentinel2TimetravelStore((s) => s.drawing)
  const aoi = useSentinel2TimetravelStore((s) => s.aoi)
  const scenes = useSentinel2TimetravelStore((s) => s.scenes)
  const selectedSceneId = useSentinel2TimetravelStore((s) => s.selectedSceneId)
  const opacity = useSentinel2TimetravelStore((s) => s.opacity)
  const setDrawing = useSentinel2TimetravelStore((s) => s.setDrawing)
  const setAoi = useSentinel2TimetravelStore((s) => s.setAoi)
  const setScenes = useSentinel2TimetravelStore((s) => s.setScenes)
  const setLoading = useSentinel2TimetravelStore((s) => s.setLoading)
  const setError = useSentinel2TimetravelStore((s) => s.setError)
  const sourceRef = useRef<VectorSource | null>(null)
  if (!sourceRef.current) sourceRef.current = new VectorSource()
  const source = sourceRef.current
  const layerRef = useRef<WebGLTileLayer | null>(null)

  // AOI outline layer, always on the map so the drawn polygon stays visible.
  useEffect(() => {
    const layer = new VectorLayer({ source, style: AOI_STYLE, zIndex: 0.4 })
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, source])

  // Draw interaction: a single AOI polygon at a time.
  useEffect(() => {
    if (!drawing) return
    const draw = new Draw({ source, type: 'Polygon', style: AOI_STYLE })
    draw.on('drawstart', () => source.clear())
    draw.on('drawend', (e) => {
      const feature = e.feature as OlFeature<Polygon>
      const fc = writeFeaturesWgs84([feature])
      const geometry = fc.features[0]?.geometry as GeoJsonPolygon | undefined
      if (geometry) setAoi(geometry)
      setDrawing(false)
    })
    map.addInteraction(draw)
    return () => {
      map.removeInteraction(draw)
    }
  }, [map, source, drawing, setAoi, setDrawing])

  // Search Sentinel-2 scenes whenever the AOI changes.
  useEffect(() => {
    if (!aoi) return
    let cancelled = false
    setLoading(true)
    setError(null)
    searchSentinel2Scenes(aoi)
      .then((found) => {
        if (cancelled) return
        setScenes(found)
        if (found.length === 0) {
          setError('Keine Sentinel-2-Aufnahmen für dieses Gebiet gefunden.')
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setScenes([])
        setError(err instanceof Error ? err.message : 'Sentinel-2-Suche fehlgeschlagen.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [aoi, setScenes, setLoading, setError])

  // Selected scene layer on the map.
  useEffect(() => {
    const scene = scenes.find((s) => s.id === selectedSceneId)
    if (!scene) return
    const layer = makeSentinel2Layer(scene.visualUrl)
    layer.setZIndex(0.5)
    layer.setOpacity(opacity)
    layerRef.current = layer
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
      layerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, scenes, selectedSceneId])

  useEffect(() => {
    layerRef.current?.setOpacity(opacity)
  }, [opacity])

  return null
}

/** Toolbar button to start/stop drawing the area of interest. */
function Sentinel2DrawButton() {
  const drawing = useSentinel2TimetravelStore((s) => s.drawing)
  const setDrawing = useSentinel2TimetravelStore((s) => s.setDrawing)

  return (
    <div className="absolute top-20 left-2 z-10">
      <button
        type="button"
        title="Gebiet für die Sentinel-2-Suche zeichnen"
        aria-label="Gebiet für die Sentinel-2-Suche zeichnen"
        aria-pressed={drawing}
        onClick={() => setDrawing(!drawing)}
        className={`flex h-8 w-8 items-center justify-center rounded-[3px] border text-sm shadow-sm ${
          drawing
            ? 'border-signal bg-signal text-white'
            : 'border-hairline bg-sheet text-stone hover:text-ink'
        }`}
      >
        🛰️
      </button>
    </div>
  )
}

/** Sidebar: draw/clear the AOI, search status, scene list and opacity. */
function Sentinel2Panel() {
  const drawing = useSentinel2TimetravelStore((s) => s.drawing)
  const aoi = useSentinel2TimetravelStore((s) => s.aoi)
  const scenes = useSentinel2TimetravelStore((s) => s.scenes)
  const selectedSceneId = useSentinel2TimetravelStore((s) => s.selectedSceneId)
  const loading = useSentinel2TimetravelStore((s) => s.loading)
  const error = useSentinel2TimetravelStore((s) => s.error)
  const opacity = useSentinel2TimetravelStore((s) => s.opacity)
  const setDrawing = useSentinel2TimetravelStore((s) => s.setDrawing)
  const setSelectedSceneId = useSentinel2TimetravelStore((s) => s.setSelectedSceneId)
  const setOpacity = useSentinel2TimetravelStore((s) => s.setOpacity)
  const reset = useSentinel2TimetravelStore((s) => s.reset)

  return (
    <section className="flex flex-col gap-3">
      {!aoi ? (
        <>
          <p className="text-xs text-stone">
            Zeichne auf der Karte ein Gebiet (Polygon), um dafür öffentlich
            verfügbare Sentinel-2-Aufnahmen zu suchen.
          </p>
          <button
            type="button"
            onClick={() => setDrawing(!drawing)}
            aria-pressed={drawing}
            className="rounded-[3px] border border-ink px-2 py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-white"
          >
            {drawing ? 'Zeichnen abbrechen' : 'Gebiet zeichnen'}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={reset}
            className="rounded-[3px] border border-hairline px-2 py-1.5 text-xs text-stone hover:border-signal hover:text-signal"
          >
            Gebiet neu zeichnen
          </button>

          {loading && <p className="text-xs text-stone">Suche Aufnahmen…</p>}
          {error && <p className="text-xs text-signal">{error}</p>}

          {scenes.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="label-micro">
                Aufnahmen ({scenes.length}, nach Wolkenabdeckung sortiert)
              </span>
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {scenes.map((scene) => (
                  <li key={scene.id}>
                    <button
                      type="button"
                      aria-pressed={scene.id === selectedSceneId}
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-[3px] border px-2 py-1 text-left text-xs ${
                        scene.id === selectedSceneId
                          ? 'border-signal bg-signal/10 text-ink'
                          : 'border-hairline text-stone hover:text-ink'
                      }`}
                    >
                      <span>{dateLabel(scene.datetime)}</span>
                      <span>☁ {Math.round(scene.cloudCover)}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedSceneId && (
            <label className="flex flex-col gap-1">
              <span className="label-micro">Transparenz</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                aria-label="Transparenz der Sentinel-2-Ebene"
              />
            </label>
          )}

          <p className="text-[10px] text-stone">
            Enthält modifizierte Copernicus-Sentinel-Daten (ESA), bereitgestellt
            über die Element84-Earth-Search-Schnittstelle.
          </p>
        </>
      )}
    </section>
  )
}

const sentinel2TimetravelFeature: FeatureModule = {
  id: 'sentinel2-timetravel',
  label: 'Sentinel-2-Zeitreise',
  icon: '🛰️',
  MapSlot: () => (
    <>
      <Sentinel2Map />
      <Sentinel2DrawButton />
    </>
  ),
  SidebarPanel: Sentinel2Panel,
}

export default sentinel2TimetravelFeature
