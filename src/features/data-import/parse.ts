import type { Feature, FeatureCollection } from 'geojson'

export type ImportKind = 'geojson' | 'gpkg' | 'geotiff'

const EXTENSION_KINDS: Record<string, ImportKind> = {
  geojson: 'geojson',
  json: 'geojson',
  gpkg: 'gpkg',
  tif: 'geotiff',
  tiff: 'geotiff',
}

export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSION_KINDS).map(
  (e) => `.${e}`,
)

/** Detect the import kind from a filename, null when unsupported. */
export function detectImportKind(filename: string): ImportKind | null {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  return EXTENSION_KINDS[ext] ?? null
}

/** Layer name from a filename: strip path and extension. */
export function layerNameFromFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}

/**
 * Validate parsed JSON as GeoJSON and normalize it to a FeatureCollection.
 * Accepts a FeatureCollection or a single Feature. Throws a German,
 * user-facing error message otherwise.
 */
export function toFeatureCollection(data: unknown): FeatureCollection {
  if (typeof data !== 'object' || data === null || !('type' in data)) {
    throw new Error('Die Datei enthält kein gültiges GeoJSON.')
  }
  const typed = data as { type: unknown }
  if (typed.type === 'FeatureCollection') {
    const fc = data as FeatureCollection
    if (!Array.isArray(fc.features)) {
      throw new Error('Die FeatureCollection hat keine features-Liste.')
    }
    return fc
  }
  if (typed.type === 'Feature') {
    return { type: 'FeatureCollection', features: [data as Feature] }
  }
  throw new Error(
    'Nur GeoJSON vom Typ "FeatureCollection" oder "Feature" wird unterstützt.',
  )
}
