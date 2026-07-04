import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type * as L from 'leaflet'
import { useLayerStore } from '../../state/layerStore'
import { useSketchStore } from '../../state/sketchStore'
import { useMapStore } from '../../state/mapStore'
import type { FeatureModule } from '../types'
import { debounce, readSession, writeSession, serializeSession } from './storage'
import { restoreSketches } from './sketchRestore'
import { useSessionPersistenceStore } from './sessionStore'

const AUTOSAVE_DELAY_MS = 800

/** Guards the one-time restore against React StrictMode's double-invoked effects. */
let restoredOnce = false

function saveNow(map: L.Map): void {
  const center = map.getCenter()
  const session = serializeSession({
    basemapId: useMapStore.getState().basemapId,
    view: { center: [center.lat, center.lng], zoom: map.getZoom() },
    layers: useLayerStore.getState().layers,
    sketches: useSketchStore.getState().features,
  })
  if (writeSession(session)) {
    useSessionPersistenceStore.getState().markSaved(session.savedAt)
  }
}

/** Restores the last session once, then autosaves layers, sketches, basemap and view on every change. */
function SessionPersistence() {
  const map = useMap()
  const saveToken = useSessionPersistenceStore((s) => s.saveToken)

  useEffect(() => {
    if (restoredOnce) return
    restoredOnce = true
    const session = readSession()
    if (!session) return

    useMapStore.getState().setBasemapId(session.basemapId)
    for (const layer of session.layers) {
      const id = useLayerStore.getState().addLayer(layer)
      if (!layer.visible) useLayerStore.getState().setVisible(id, false)
    }
    restoreSketches(map, session.sketches)
    if (session.view) map.setView(session.view.center, session.view.zoom)
  }, [map])

  useEffect(() => {
    const scheduleSave = debounce(() => saveNow(map), AUTOSAVE_DELAY_MS)
    const unsubLayers = useLayerStore.subscribe(scheduleSave)
    const unsubSketches = useSketchStore.subscribe(scheduleSave)
    const unsubMapState = useMapStore.subscribe(scheduleSave)
    map.on('moveend zoomend', scheduleSave)
    return () => {
      unsubLayers()
      unsubSketches()
      unsubMapState()
      map.off('moveend zoomend', scheduleSave)
    }
  }, [map])

  useEffect(() => {
    if (saveToken > 0) saveNow(map)
  }, [saveToken, map])

  return null
}

function formatSavedAt(at: number): string {
  return new Date(at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

/** Toolbar button for an explicit, on-demand save in addition to the automatic one. */
function SaveButton() {
  const requestSave = useSessionPersistenceStore((s) => s.requestSave)
  const lastSavedAt = useSessionPersistenceStore((s) => s.lastSavedAt)

  return (
    <button
      type="button"
      onClick={requestSave}
      title={
        lastSavedAt
          ? `Zuletzt gespeichert um ${formatSavedAt(lastSavedAt)}`
          : 'Arbeitsstand jetzt speichern'
      }
      className="rounded-[3px] border border-hairline bg-sheet px-3 py-2 text-sm font-medium text-ink shadow-sm hover:border-ink"
    >
      Jetzt speichern
      {lastSavedAt && (
        <span className="ml-1.5 font-normal text-stone">({formatSavedAt(lastSavedAt)})</span>
      )}
    </button>
  )
}

const sessionPersistenceFeature: FeatureModule = {
  id: 'session-persistence',
  label: 'Sitzung speichern',
  MapSlot: SessionPersistence,
  ToolbarItem: SaveButton,
}

export default sessionPersistenceFeature
