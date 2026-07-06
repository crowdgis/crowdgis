import { area, length, lineString } from '@turf/turf'
import type { Feature, Position } from 'geojson'
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

/** Length in meters of each segment between consecutive coordinates. */
function segmentLengths(coords: Position[]): number[] {
  const lengths: number[] = []
  for (let i = 0; i < coords.length - 1; i++) {
    lengths.push(length(lineString([coords[i], coords[i + 1]]), { units: 'kilometers' }) * 1000)
  }
  return lengths
}

/**
 * Breakdown of a sketched feature: per-segment lengths for a line, or
 * per-edge lengths of a polygon's outline. Empty for points.
 */
export function measureSegments(feature: Feature): number[] {
  const geometry = feature.geometry
  if (geometry.type === 'LineString') return segmentLengths(geometry.coordinates)
  if (geometry.type === 'MultiLineString') return geometry.coordinates.flatMap(segmentLengths)
  if (geometry.type === 'Polygon') return segmentLengths(geometry.coordinates[0])
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap(([ring]) => segmentLengths(ring))
  }
  return []
}

/** "Segment" for lines, "Kante" for a polygon's outline. */
function segmentLabel(type: string): string {
  return type === 'Polygon' || type === 'MultiPolygon' ? 'Kante' : 'Segment'
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
          {measurable.map((f, i) => {
            const segments = measureSegments(f)
            return (
              <li key={i} className="border-b border-hairline py-1 last:border-b-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone">
                    {GEOMETRY_LABELS[f.geometry.type] ?? f.geometry.type} {i + 1}
                  </span>
                  <span className="font-mono text-black">{measureFeature(f)}</span>
                </div>
                {segments.length > 1 && (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-3">
                    {segments.map((s, j) => (
                      <li
                        key={j}
                        className="flex items-center justify-between text-xs text-stone"
                      >
                        <span>
                          {segmentLabel(f.geometry.type)} {j + 1}
                        </span>
                        <span className="font-mono">{formatLength(s)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
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
