import '../../lib/leaflet-setup'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'
import type { FeatureModule } from '../types'

/** Serialize all Geoman draw layers into the sketch store. */
function syncSketches(map: L.Map) {
  const features: Feature[] = map.pm
    .getGeomanDrawLayers()
    .map((layer) => (layer as L.Layer & { toGeoJSON: () => Feature }).toGeoJSON())
  useSketchStore.getState().setFeatures(features)
}

/** Mounts the Geoman toolbar and mirrors sketches into the store. */
function SketchControls() {
  const map = useMap()
  const clearToken = useSketchStore((s) => s.clearToken)

  useEffect(() => {
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
    map.pm.setGlobalOptions({
      pathOptions: { color: '#870010', weight: 2, fillOpacity: 0.1 },
    })

    const sync = () => syncSketches(map)
    map.on('pm:create', (e) => {
      e.layer.on('pm:update', sync)
      e.layer.on('pm:dragend', sync)
      sync()
    })
    map.on('pm:remove', sync)

    return () => {
      map.off('pm:create')
      map.off('pm:remove')
      map.pm.removeControls()
    }
  }, [map])

  useEffect(() => {
    if (clearToken > 0) {
      for (const layer of map.pm.getGeomanDrawLayers()) {
        layer.remove()
      }
      syncSketches(map)
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

/** Sidebar section: sketch summary, export and clear. */
function SketchPanel() {
  const features = useSketchStore((s) => s.features)
  const requestClear = useSketchStore((s) => s.requestClear)

  return (
    <section>
      <h2 className="label-micro mb-2">Skizzen</h2>
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
  MapSlot: SketchControls,
  SidebarPanel: SketchPanel,
}

export default sketchingFeature
