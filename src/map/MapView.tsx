import { OlMapSpike } from './ol/OlMapSpike'

/**
 * SPIKE (branch spike/openlayers): the map is OpenLayers with a native
 * EPSG:2056 view. Feature MapSlots are react-leaflet components and are
 * intentionally NOT rendered here — the spike talks to the shared stores
 * directly. See docs in OlMapSpike.tsx.
 */
export function MapView() {
  return <OlMapSpike />
}
