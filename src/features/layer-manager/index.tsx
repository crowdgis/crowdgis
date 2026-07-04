import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import GeoTIFFSource from 'ol/source/GeoTIFF'
import { transformExtent } from 'ol/proj'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import CircleStyle from 'ol/style/Circle'
import type BaseLayer from 'ol/layer/Base'
import { useOlMap } from '../../map/OlMap'
import { readFeaturesWgs84, VIEW_PROJECTION } from '../../lib/ol-geojson'
import { useLayerStore } from '../../state/layerStore'
import type { FeatureModule } from '../types'

/** Default vector style in brand ink. */
const VECTOR_STYLE = new Style({
  stroke: new Stroke({ color: '#2b336a', width: 2 }),
  fill: new Fill({ color: 'rgba(43, 51, 106, 0.15)' }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({ color: '#2b336a', width: 2 }),
    fill: new Fill({ color: 'rgba(43, 51, 106, 0.6)' }),
  }),
})

/** Renders all visible app layers and applies zoom requests. */
function LayersOnMap() {
  const map = useOlMap()
  const layers = useLayerStore((s) => s.layers)
  const zoomTarget = useLayerStore((s) => s.zoomTarget)
  // GeoTIFF sources are expensive to create — cache them per layer id.
  const rasterCache = useRef(new globalThis.Map<string, WebGLTileLayer>())

  useEffect(() => {
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
            features: readFeaturesWgs84(layer.source.geojson),
          }),
          style: VECTOR_STYLE,
        })
      } else {
        let cached = rasterCache.current.get(layer.id)
        if (!cached) {
          cached = new WebGLTileLayer({
            source: new GeoTIFFSource({
              sources: [{ blob: layer.source.blob }],
              convertToRGB: 'auto',
            }),
            opacity: 0.85,
          })
          rasterCache.current.set(layer.id, cached)
        }
        olLayer = cached
      }
      olLayer.set('appLayer', true)
      olLayer.setZIndex(1 + i)
      map.addLayer(olLayer)
    })

    // Drop cached raster layers whose store layer was removed.
    for (const id of rasterCache.current.keys()) {
      if (!layers.some((l) => l.id === id)) rasterCache.current.delete(id)
    }
  }, [map, layers])

  useEffect(() => {
    if (!zoomTarget) return
    const [[south, west], [north, east]] = zoomTarget.bounds
    const extent = transformExtent(
      [west, south, east, north],
      'EPSG:4326',
      VIEW_PROJECTION,
    )
    map.getView().fit(extent, {
      padding: [24, 24, 24, 24],
      maxZoom: 24,
      duration: 200,
    })
  }, [map, zoomTarget])

  return null
}

/** Sidebar section: list of loaded layers with visibility and actions. */
function LayerListPanel() {
  const layers = useLayerStore((s) => s.layers)
  const setVisible = useLayerStore((s) => s.setVisible)
  const removeLayer = useLayerStore((s) => s.removeLayer)
  const requestZoom = useLayerStore((s) => s.requestZoom)
  const setAttributeTableLayer = useLayerStore((s) => s.setAttributeTableLayer)

  return (
    <section>
      {layers.length === 0 ? (
        <p className="text-xs text-stone">
          Noch keine Ebenen geladen. Lade oben eine Datei, um zu starten.
        </p>
      ) : (
        <ul className="flex flex-col">
          {layers.map((layer) => (
            <li
              key={layer.id}
              className="group flex items-center gap-2 border-b border-hairline py-1.5 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={(e) => setVisible(layer.id, e.target.checked)}
                aria-label={`${layer.name} ein-/ausblenden`}
                className="accent-ink"
              />
              <span
                className="min-w-0 flex-1 truncate text-sm text-black"
                title={layer.name}
              >
                {layer.name}
              </span>
              <span className="label-micro">
                {layer.source.kind === 'vector' ? 'VEK' : 'RAS'}
              </span>
              {layer.source.kind === 'vector' && (
                <button
                  type="button"
                  onClick={() => setAttributeTableLayer(layer.id)}
                  title="Attributtabelle öffnen"
                  aria-label={`Attributtabelle von ${layer.name} öffnen`}
                  className="rounded-[3px] px-1 text-stone hover:bg-paper hover:text-ink"
                >
                  ▦
                </button>
              )}
              {layer.bounds && (
                <button
                  type="button"
                  onClick={() => requestZoom(layer.bounds!)}
                  title="Auf Ebene zoomen"
                  aria-label={`Auf ${layer.name} zoomen`}
                  className="rounded-[3px] px-1 text-stone hover:bg-paper hover:text-ink"
                >
                  ⌖
                </button>
              )}
              <button
                type="button"
                onClick={() => removeLayer(layer.id)}
                title="Ebene entfernen"
                aria-label={`${layer.name} entfernen`}
                className="rounded-[3px] px-1 text-stone hover:bg-paper hover:text-signal"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const layerManagerFeature: FeatureModule = {
  id: 'layer-manager',
  label: 'Ebenen',
  MapSlot: LayersOnMap,
  SidebarPanel: LayerListPanel,
}

export default layerManagerFeature
