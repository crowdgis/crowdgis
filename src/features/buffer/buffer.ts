import { buffer } from '@turf/turf'
import type { FeatureCollection } from 'geojson'

/**
 * Buffer every feature of a collection by `distanceMeters` and merge the
 * results into a new collection. Original geometries are left untouched.
 * Throws if the distance is not a positive number or produces no output
 * (e.g. an empty input collection).
 */
export function bufferFeatureCollection(
  fc: FeatureCollection,
  distanceMeters: number,
): FeatureCollection {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    throw new Error('Der Pufferabstand muss eine positive Zahl sein.')
  }
  const buffered = buffer(fc, distanceMeters, { units: 'meters' })
  if (!buffered || buffered.features.length === 0) {
    throw new Error('Für diese Ebene konnte kein Puffer erzeugt werden.')
  }
  return buffered
}
