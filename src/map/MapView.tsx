import { features } from '../features/registry'
import { OlMap } from './OlMap'

export function MapView() {
  return (
    <OlMap>
      {features.map((f) => (f.MapSlot ? <f.MapSlot key={f.id} /> : null))}
    </OlMap>
  )
}
