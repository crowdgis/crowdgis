import type { FeatureModule } from './types'
import attributeTable from './attribute-table'
import basemaps from './basemaps'
import buffer from './buffer'
import chineseGlossary from './chinese-glossary'
import coordinates from './coordinates'
import dataImport from './data-import'
import featureRequests from './feature-requests'
import layerManager from './layer-manager'
import measure from './measure'
import sketching from './sketching'

/**
 * Central feature registry.
 *
 * To add a new feature: create `src/features/<id>/` with an `index.ts(x)`
 * that default-exports a `FeatureModule`, then import and append it here.
 * This is the ONLY core file a new feature is allowed to touch.
 * Order defines rendering order of sidebar panels and toolbar items.
 */
export const features: FeatureModule[] = [
  dataImport,
  layerManager,
  sketching,
  measure,
  buffer,
  attributeTable,
  basemaps,
  coordinates,
  featureRequests,
  chineseGlossary,
]
