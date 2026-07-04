import { useEffect } from 'react'
import { useOlMap } from '../../map/OlMap'
import { useMapStore } from '../../state/mapStore'
import type { FeatureModule } from '../types'
import { BASEMAPS, makeBasemapLayer } from './basemaps'

/** Keeps the selected basemap mounted as the bottom map layer. */
function BasemapLayer() {
  const map = useOlMap()
  const basemapId = useMapStore((s) => s.basemapId)

  useEffect(() => {
    const layer = makeBasemapLayer(basemapId)
    layer.setZIndex(0)
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, basemapId])

  return null
}

/** Dropdown to switch between the available basemaps. */
function BasemapSwitcher() {
  const basemapId = useMapStore((s) => s.basemapId)
  const setBasemapId = useMapStore((s) => s.setBasemapId)
  return (
    <label className="flex items-center gap-2.5 rounded-[3px] border border-hairline bg-sheet px-3 py-2 shadow-sm">
      <span className="label-micro">Basiskarte</span>
      <select
        className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black"
        value={basemapId}
        onChange={(e) => setBasemapId(e.target.value)}
        aria-label="Basiskarte wählen"
      >
        {BASEMAPS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
    </label>
  )
}

const basemapsFeature: FeatureModule = {
  id: 'basemaps',
  label: 'Basiskarten',
  MapSlot: BasemapLayer,
  ToolbarItem: BasemapSwitcher,
}

export default basemapsFeature
