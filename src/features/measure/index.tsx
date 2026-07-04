import { area, length } from '@turf/turf'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'
import type { FeatureModule } from '../types'
import { formatArea, formatLength } from './format'

const GEOMETRY_LABELS: Record<string, string> = {
  Point: 'Punkt',
  LineString: 'Linie',
  Polygon: 'Fläche',
  MultiPolygon: 'Fläche',
  MultiLineString: 'Linie',
}

/** Human-readable measurement of a sketched feature, null for points. */
export function measureFeature(feature: Feature): string | null {
  const type = feature.geometry.type
  if (type === 'LineString' || type === 'MultiLineString') {
    return formatLength(length(feature, { units: 'kilometers' }) * 1000)
  }
  if (type === 'Polygon' || type === 'MultiPolygon') {
    return formatArea(area(feature))
  }
  return null
}

/** Sidebar section: live measurements of all sketched geometries. */
function MeasurePanel() {
  const features = useSketchStore((s) => s.features)
  const measurable = features.filter((f) => measureFeature(f) !== null)

  return (
    <section>
      {measurable.length === 0 ? (
        <p className="text-xs text-stone">
          Zeichne eine Linie oder Fläche, um Distanz und Fläche zu messen.
        </p>
      ) : (
        <ul className="flex flex-col">
          {measurable.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between border-b border-hairline py-1 text-sm last:border-b-0"
            >
              <span className="text-stone">
                {GEOMETRY_LABELS[f.geometry.type] ?? f.geometry.type} {i + 1}
              </span>
              <span className="font-mono text-black">{measureFeature(f)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const measureFeatureModule: FeatureModule = {
  id: 'measure',
  label: 'Messen',
  SidebarPanel: MeasurePanel,
}

export default measureFeatureModule
