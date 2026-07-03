import { TileLayer } from 'react-leaflet'
import { useMapStore } from '../../state/mapStore'
import type { FeatureModule } from '../types'
import { BASEMAPS, getBasemap } from './basemaps'

/** Renders the currently selected basemap as the bottom tile layer. */
function BasemapLayer() {
  const basemapId = useMapStore((s) => s.basemapId)
  const basemap = getBasemap(basemapId)
  return (
    <TileLayer
      key={basemap.id}
      url={basemap.url}
      attribution={basemap.attribution}
      maxZoom={basemap.maxZoom}
    />
  )
}

/** Dropdown to switch between the available basemaps. */
function BasemapSwitcher() {
  const basemapId = useMapStore((s) => s.basemapId)
  const setBasemapId = useMapStore((s) => s.setBasemapId)
  return (
    <label className="flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-sm shadow">
      <span className="font-medium text-gray-700">Basiskarte</span>
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
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
