import { useEffect } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import { circleMarker } from 'leaflet'
import { useLayerStore } from '../../state/layerStore'
import type { FeatureModule } from '../types'
import { RasterLayer } from './RasterLayer'

/** Default vector style in brand ink. */
const VECTOR_STYLE = {
  color: '#2b336a',
  weight: 2,
  fillColor: '#2b336a',
  fillOpacity: 0.15,
}

/** Renders all visible app layers and applies zoom requests. */
function LayersOnMap() {
  const layers = useLayerStore((s) => s.layers)
  const zoomTarget = useLayerStore((s) => s.zoomTarget)
  const map = useMap()

  useEffect(() => {
    if (zoomTarget) {
      map.fitBounds(zoomTarget.bounds, { padding: [24, 24], maxZoom: 17 })
    }
  }, [zoomTarget, map])

  return (
    <>
      {layers.map((layer) => {
        if (!layer.visible) return null
        if (layer.source.kind === 'vector') {
          return (
            <GeoJSON
              key={layer.id}
              data={layer.source.geojson}
              style={() => VECTOR_STYLE}
              pointToLayer={(_f, latlng) =>
                circleMarker(latlng, { radius: 5, ...VECTOR_STYLE, fillOpacity: 0.6 })
              }
            />
          )
        }
        return <RasterLayer key={layer.id} georaster={layer.source.georaster} />
      })}
    </>
  )
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
      <h2 className="label-micro mb-2">Ebenen</h2>
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
