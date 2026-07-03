import { useMapEvents } from 'react-leaflet'
import { useMapStore } from '../../state/mapStore'
import type { FeatureModule } from '../types'
import { formatLv95, formatWgs84 } from './format'

/** Invisible map child that tracks the mouse position in the store. */
function MouseTracker() {
  const setMousePosition = useMapStore((s) => s.setMousePosition)
  useMapEvents({
    mousemove: (e) => setMousePosition({ lat: e.latlng.lat, lng: e.latlng.lng }),
    mouseout: () => setMousePosition(null),
  })
  return null
}

/** Status bar readout: WGS84 always, LV95 when inside Switzerland. */
function CoordinateReadout() {
  const pos = useMapStore((s) => s.mousePosition)
  if (!pos) {
    return <span className="text-gray-400">Koordinaten: –</span>
  }
  const lv95 = formatLv95(pos.lat, pos.lng)
  return (
    <span className="tabular-nums">
      <span className="text-gray-500">WGS84</span> {formatWgs84(pos.lat, pos.lng)}
      {lv95 && (
        <>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-500">LV95</span> {lv95}
        </>
      )}
    </span>
  )
}

const coordinatesFeature: FeatureModule = {
  id: 'coordinates',
  label: 'Koordinatenanzeige',
  MapSlot: MouseTracker,
  StatusBarItem: CoordinateReadout,
}

export default coordinatesFeature
