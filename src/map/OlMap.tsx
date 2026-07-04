import 'ol/ol.css'
import '../lib/ol-setup'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import ScaleLine from 'ol/control/ScaleLine'
import { defaults as defaultControls } from 'ol/control/defaults'

/**
 * Core OpenLayers map. The view runs natively in EPSG:2056 (Swiss LV95);
 * feature MapSlots access the map instance via useOlMap() and are
 * rendered as children inside a relatively positioned container, so
 * absolutely positioned tool UIs overlay the map.
 */

const MapContext = createContext<Map | null>(null)

/** The shared OpenLayers map. Only available inside a MapSlot. */
export function useOlMap(): Map {
  const map = useContext(MapContext)
  if (!map) {
    throw new Error('useOlMap() must be used inside a MapSlot (<OlMap>).')
  }
  return map
}

/** Initial view: Switzerland. */
const INITIAL_CENTER: [number, number] = [2660000, 1190000]
const INITIAL_RESOLUTION = 650

export function OlMap({ children }: { children?: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<Map | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const m = new Map({
      target: hostRef.current,
      layers: [],
      view: new View({
        projection: 'EPSG:2056',
        center: INITIAL_CENTER,
        resolution: INITIAL_RESOLUTION,
      }),
      controls: defaultControls().extend([new ScaleLine({ units: 'metric' })]),
    })
    setMap(m)
    return () => {
      m.setTarget(undefined)
      setMap(null)
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  )
}
