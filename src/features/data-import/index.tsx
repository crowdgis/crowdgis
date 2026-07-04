import { useRef, useState } from 'react'
import { useLayerStore } from '../../state/layerStore'
import type { FeatureModule } from '../types'
import { ACCEPTED_EXTENSIONS } from './parse'
import { importFile } from './loaders'

/** Sidebar section: load local geodata files as layers. */
function ImportPanel() {
  const addLayer = useLayerStore((s) => s.addLayer)
  const requestZoom = useLayerStore((s) => s.requestZoom)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string[]>([])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    setNotes([])
    const collectedNotes: string[] = []
    try {
      for (const file of Array.from(files)) {
        const layers = await importFile(file)
        for (const layer of layers) {
          addLayer(layer)
          if (layer.bounds) requestZoom(layer.bounds)
          if (layer.note) collectedNotes.push(layer.note)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Datei konnte nicht geladen werden.')
    } finally {
      setNotes(collectedNotes)
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-[3px] bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-strong disabled:opacity-60"
      >
        {busy ? 'Lädt …' : 'Daten laden'}
      </button>
      <p className="mt-1.5 text-xs text-stone">
        GeoJSON, GeoPackage (.gpkg), GeoTIFF (.tif) oder Shapefile (.zip)
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-signal">
          {error}
        </p>
      )}
      {notes.map((note, i) => (
        <p key={i} className="mt-2 text-xs text-stone">
          ⚠ {note}
        </p>
      ))}
    </section>
  )
}

const dataImportFeature: FeatureModule = {
  id: 'data-import',
  label: 'Daten laden',
  SidebarPanel: ImportPanel,
}

export default dataImportFeature
