import 'ol/ol.css'
import '../../lib/ol-setup'
import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import GeoTIFFSource from 'ol/source/GeoTIFF'
import GeoJSONFormat from 'ol/format/GeoJSON'
import Draw, { createBox } from 'ol/interaction/Draw'
import ScaleLine from 'ol/control/ScaleLine'
import { defaults as defaultControls } from 'ol/control/defaults'
import { toLonLat, transformExtent } from 'ol/proj'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import CircleStyle from 'ol/style/Circle'
import type BaseLayer from 'ol/layer/Base'
import type { Feature as GeoJsonFeature } from 'geojson'
import { useLayerStore } from '../../state/layerStore'
import { useMapStore } from '../../state/mapStore'
import { useSketchStore } from '../../state/sketchStore'

/**
 * SPIKE: OpenLayers map with a native EPSG:2056 (LV95) view.
 *
 * Bypasses the feature MapSlots (they are react-leaflet components) and
 * talks to the shared stores directly instead — the sidebar panels
 * (import, layers, sketch list, measure, attribute table) keep working
 * unchanged. This file previews the architecture of a full migration.
 */

/** Official swisstopo WMTS resolutions for the LV95 tile grid. */
const LV95_RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25,
]
const LV95_ORIGIN: [number, number] = [2420000, 1350000]

function swisstopoLv95(layerId: string): TileLayer {
  return new TileLayer({
    source: new WMTS({
      url: `https://wmts.geo.admin.ch/1.0.0/${layerId}/default/current/2056/{TileMatrix}/{TileCol}/{TileRow}.jpeg`,
      layer: layerId,
      matrixSet: '2056',
      format: 'image/jpeg',
      style: 'default',
      projection: 'EPSG:2056',
      requestEncoding: 'REST',
      tileGrid: new WMTSTileGrid({
        origin: LV95_ORIGIN,
        resolutions: LV95_RESOLUTIONS,
        matrixIds: LV95_RESOLUTIONS.map((_, i) => String(i)),
      }),
      attributions:
        '© <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
      crossOrigin: 'anonymous',
    }),
  })
}

/** Basemaps keyed by the ids the existing basemap dropdown already uses. */
function makeBasemap(id: string): TileLayer {
  switch (id) {
    case 'swisstopo-karte':
      return swisstopoLv95('ch.swisstopo.pixelkarte-farbe')
    case 'swisstopo-luftbild':
      return swisstopoLv95('ch.swisstopo.swissimage')
    default:
      // OSM tiles are 3857; OL reprojects them into the LV95 view.
      return new TileLayer({ source: new OSM() })
  }
}

/** Brand-ink style for imported vector layers (mirrors the Leaflet one). */
const VECTOR_STYLE = new Style({
  stroke: new Stroke({ color: '#2b336a', width: 2 }),
  fill: new Fill({ color: 'rgba(43, 51, 106, 0.15)' }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({ color: '#2b336a', width: 2 }),
    fill: new Fill({ color: 'rgba(43, 51, 106, 0.6)' }),
  }),
})

/** Landeskarte-red style for sketches (mirrors the Geoman pathOptions). */
const SKETCH_STYLE = new Style({
  stroke: new Stroke({ color: '#870010', width: 2 }),
  fill: new Fill({ color: 'rgba(135, 0, 16, 0.1)' }),
  image: new CircleStyle({
    radius: 6,
    stroke: new Stroke({ color: '#870010', width: 2 }),
    fill: new Fill({ color: 'rgba(135, 0, 16, 0.4)' }),
  }),
})

const geojson = new GeoJSONFormat()
const READ_OPTS = {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:2056',
}

type SketchTool = 'Point' | 'LineString' | 'Polygon' | 'Box'

const SKETCH_TOOLS: { tool: SketchTool; icon: string; label: string }[] = [
  { tool: 'Point', icon: '●', label: 'Punkt zeichnen' },
  { tool: 'LineString', icon: '╱', label: 'Linie zeichnen' },
  { tool: 'Polygon', icon: '⬠', label: 'Fläche zeichnen' },
  { tool: 'Box', icon: '▭', label: 'Rechteck zeichnen' },
]

export function OlMapSpike() {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const baseLayerRef = useRef<BaseLayer | null>(null)
  const sketchSourceRef = useRef(new VectorSource())
  const rasterCacheRef = useRef(new globalThis.Map<string, WebGLTileLayer>())
  const drawRef = useRef<Draw | null>(null)
  const [activeTool, setActiveTool] = useState<SketchTool | null>(null)

  const basemapId = useMapStore((s) => s.basemapId)
  const setMousePosition = useMapStore((s) => s.setMousePosition)
  const layers = useLayerStore((s) => s.layers)
  const zoomTarget = useLayerStore((s) => s.zoomTarget)
  const clearToken = useSketchStore((s) => s.clearToken)

  // Map init (once).
  useEffect(() => {
    if (!hostRef.current) return
    const sketchLayer = new VectorLayer({
      source: sketchSourceRef.current,
      style: SKETCH_STYLE,
      zIndex: 100,
    })
    const map = new Map({
      target: hostRef.current,
      layers: [sketchLayer],
      view: new View({
        projection: 'EPSG:2056',
        center: [2660000, 1190000], // Switzerland
        resolution: 650,
      }),
      controls: defaultControls().extend([new ScaleLine({ units: 'metric' })]),
    })

    map.on('pointermove', (e) => {
      if (e.dragging) return
      const [lng, lat] = toLonLat(e.coordinate, 'EPSG:2056')
      setMousePosition({ lat, lng })
    })
    map.getViewport().addEventListener('mouseleave', () =>
      setMousePosition(null),
    )

    // Any change to the sketch source mirrors ALL sketches into the store
    // as WGS84 GeoJSON — measure panel and sketch list update live.
    const sync = () => {
      const fc = geojson.writeFeaturesObject(
        sketchSourceRef.current.getFeatures(),
        { featureProjection: 'EPSG:2056', dataProjection: 'EPSG:4326' },
      )
      useSketchStore.getState().setFeatures(fc.features as GeoJsonFeature[])
    }
    sketchSourceRef.current.on(['addfeature', 'removefeature', 'changefeature'], sync)

    mapRef.current = map
    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [setMousePosition])

  // Basemap switching (driven by the existing basemaps dropdown).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current)
    const base = makeBasemap(basemapId)
    base.setZIndex(0)
    baseLayerRef.current = base
    map.addLayer(base)
  }, [basemapId])

  // App layers from the shared store (vector: rebuilt; raster: cached).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map
      .getLayers()
      .getArray()
      .filter((l) => l.get('appLayer'))
      .slice()
      .forEach((l) => map.removeLayer(l))

    layers.forEach((layer, i) => {
      if (!layer.visible) return
      let olLayer: BaseLayer | null = null
      if (layer.source.kind === 'vector') {
        olLayer = new VectorLayer({
          source: new VectorSource({
            features: geojson.readFeatures(layer.source.geojson, READ_OPTS),
          }),
          style: VECTOR_STYLE,
        })
      } else if (layer.source.blob) {
        let cached = rasterCacheRef.current.get(layer.id)
        if (!cached) {
          cached = new WebGLTileLayer({
            source: new GeoTIFFSource({
              sources: [{ blob: layer.source.blob }],
              convertToRGB: 'auto',
            }),
            opacity: 0.85,
          })
          rasterCacheRef.current.set(layer.id, cached)
        }
        olLayer = cached
      }
      if (olLayer) {
        olLayer.set('appLayer', true)
        olLayer.setZIndex(1 + i)
        map.addLayer(olLayer)
      }
    })
  }, [layers])

  // Zoom-to-bounds requests (layer list, attribute table rows).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !zoomTarget) return
    const [[south, west], [north, east]] = zoomTarget.bounds
    const extent = transformExtent(
      [west, south, east, north],
      'EPSG:4326',
      'EPSG:2056',
    )
    map.getView().fit(extent, {
      padding: [24, 24, 24, 24],
      maxZoom: 24,
      duration: 200,
    })
  }, [zoomTarget])

  // "Alle löschen" from the sketch panel.
  useEffect(() => {
    if (clearToken > 0) {
      sketchSourceRef.current.clear()
      useSketchStore.getState().setFeatures([])
    }
  }, [clearToken])

  // Draw interaction for the active sketch tool.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (drawRef.current) {
      map.removeInteraction(drawRef.current)
      drawRef.current = null
    }
    if (!activeTool) return
    const draw = new Draw({
      source: sketchSourceRef.current,
      type: activeTool === 'Box' ? 'Circle' : activeTool,
      geometryFunction: activeTool === 'Box' ? createBox() : undefined,
      style: SKETCH_STYLE,
    })
    map.addInteraction(draw)
    drawRef.current = draw
  }, [activeTool])

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" data-testid="ol-map" />
      {/* Sketch toolbar (below the OL zoom control, Kartenrand style). */}
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
    </div>
  )
}
