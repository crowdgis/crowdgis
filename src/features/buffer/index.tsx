import { useState } from 'react'
import type { FeatureCollection } from 'geojson'
import { useLayerStore } from '../../state/layerStore'
import { vectorBounds } from '../../lib/geo'
import type { FeatureModule } from '../types'
import { bufferFeatureCollection } from './buffer'

/** Download a GeoJSON feature collection as a file. */
function downloadGeojson(geojson: FeatureCollection, filename: string) {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: 'application/geo+json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Sidebar section: create a buffered copy of a layer as a new layer. */
function BufferPanel() {
  const layers = useLayerStore((s) => s.layers)
  const addLayer = useLayerStore((s) => s.addLayer)
  const requestZoom = useLayerStore((s) => s.requestZoom)
  const vectorLayers = layers.filter((l) => l.source.kind === 'vector')

  const [layerId, setLayerId] = useState('')
  const [distance, setDistance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FeatureCollection | null>(null)

  const selectedLayer = vectorLayers.find((l) => l.id === layerId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedLayer || selectedLayer.source.kind !== 'vector') {
      setError('Bitte wähle eine Ebene aus.')
      return
    }
    try {
      const geojson = bufferFeatureCollection(
        selectedLayer.source.geojson,
        Number(distance),
      )
      const bounds = vectorBounds(geojson)
      addLayer({
        name: `${selectedLayer.name} (Puffer ${distance} m)`,
        bounds,
        source: { kind: 'vector', geojson },
      })
      if (bounds) requestZoom(bounds)
      setResult(geojson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Puffer konnte nicht erzeugt werden.')
      setResult(null)
    }
  }

  return (
    <section>
      {vectorLayers.length === 0 ? (
        <p className="text-xs text-stone">
          Lade zuerst eine Vektorebene, um einen Puffer zu erzeugen.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone">Ebene</span>
            <select
              value={layerId}
              onChange={(e) => setLayerId(e.target.value)}
              aria-label="Ebene für Puffer wählen"
              className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black"
            >
              <option value="">– wählen –</option>
              {vectorLayers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone">Pufferabstand (m)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              aria-label="Pufferabstand in Metern"
              className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black"
            />
          </label>
          <button
            type="submit"
            disabled={!layerId || !distance}
            className="w-full rounded-[3px] bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-strong disabled:opacity-60"
          >
            Puffer erstellen
          </button>
          {error && (
            <p role="alert" className="text-xs text-signal">
              {error}
            </p>
          )}
          {result && (
            <button
              type="button"
              onClick={() => downloadGeojson(result, 'puffer.geojson')}
              className="w-full rounded-[3px] border border-ink px-2 py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-white"
            >
              Puffer als GeoJSON exportieren
            </button>
          )}
        </form>
      )}
    </section>
  )
}

const bufferFeature: FeatureModule = {
  id: 'buffer',
  label: 'Puffer',
  SidebarPanel: BufferPanel,
}

export default bufferFeature
