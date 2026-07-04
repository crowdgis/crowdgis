import { useEffect } from 'react'
import { toLonLat } from 'ol/proj'
import type { MapBrowserEvent } from 'ol'
import { useOlMap } from '../../map/OlMap'
import { VIEW_PROJECTION } from '../../lib/ol-geojson'
import { useMapStore } from '../../state/mapStore'
import type { FeatureModule } from '../types'
import { formatLv95, formatWgs84 } from './format'

/** Invisible map child that tracks the mouse position in the store. */
function MouseTracker() {
  const map = useOlMap()
  const setMousePosition = useMapStore((s) => s.setMousePosition)

  useEffect(() => {
    const move = (e: MapBrowserEvent) => {
      if (e.dragging) return
      const [lng, lat] = toLonLat(e.coordinate, VIEW_PROJECTION)
      setMousePosition({ lat, lng })
    }
    const leave = () => setMousePosition(null)
    map.on('pointermove', move)
    const viewport = map.getViewport()
    viewport.addEventListener('mouseleave', leave)
    return () => {
      map.un('pointermove', move)
      viewport.removeEventListener('mouseleave', leave)
      setMousePosition(null)
    }
  }, [map, setMousePosition])

  return null
}

/** Status bar readout: WGS84 always, LV95 when inside Switzerland. */
function CoordinateReadout() {
  const pos = useMapStore((s) => s.mousePosition)
  const lv95 = pos ? formatLv95(pos.lat, pos.lng) : null
  return (
    <span className="flex items-center gap-5">
      <span className="flex items-center gap-2">
        <span className="label-micro">WGS84</span>
        <span className="min-w-[11.5rem] font-mono text-black">
          {pos ? formatWgs84(pos.lat, pos.lng) : '–'}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className="label-micro">LV95</span>
        <span className="min-w-[10rem] font-mono text-black">{lv95 ?? '–'}</span>
      </span>
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
