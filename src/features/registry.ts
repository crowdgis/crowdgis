import type { FeatureModule } from './types'
import basemaps from './basemaps'
import coordinates from './coordinates'

/**
 * Central feature registry.
 *
 * To add a new feature: create `src/features/<id>/` with an `index.ts(x)`
 * that default-exports a `FeatureModule`, then import and append it here.
 * This is the ONLY core file a new feature is allowed to touch.
 */
export const features: FeatureModule[] = [basemaps, coordinates]
