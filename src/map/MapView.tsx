import { MapContainer, ScaleControl } from 'react-leaflet'
import { features } from '../features/registry'

/** Initial view: Switzerland. */
const INITIAL_CENTER: [number, number] = [46.8, 8.2]
const INITIAL_ZOOM = 8

export function MapView() {
  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      className="h-full w-full"
      zoomControl
    >
      <ScaleControl position="bottomleft" metric imperial={false} />
      {features.map((f) => (f.MapSlot ? <f.MapSlot key={f.id} /> : null))}
    </MapContainer>
  )
}
