import type { ImportedLayer } from '../../state/layerStore'
import {
  isSupportedRasterProjection,
  rasterBounds,
  vectorBounds,
} from '../../lib/geo'
import {
  detectImportKind,
  layerNameFromFilename,
  toFeatureCollection,
} from './parse'

/** Client-side raster limit; larger files freeze the browser tab. */
export const MAX_RASTER_BYTES = 100 * 1024 * 1024

async function loadGeoJson(file: File): Promise<ImportedLayer[]> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  const geojson = toFeatureCollection(parsed)
  return [
    {
      name: layerNameFromFilename(file.name),
      bounds: vectorBounds(geojson),
      source: { kind: 'vector', geojson },
    },
  ]
}

async function loadGeoPackage(file: File): Promise<ImportedLayer[]> {
  // Lazy-loaded: the GeoPackage bundle (sql.js WASM) is heavy.
  const [{ GeoPackageAPI, setSqljsWasmLocateFile }, { default: wasmUrl }] =
    await Promise.all([
      import('@ngageoint/geopackage'),
      import('@ngageoint/geopackage/dist/sql-wasm.wasm?url'),
    ])
  setSqljsWasmLocateFile(() => wasmUrl)

  const bytes = new Uint8Array(await file.arrayBuffer())
  const geopackage = await GeoPackageAPI.open(bytes)
  try {
    const tables = geopackage.getFeatureTables()
    if (tables.length === 0) {
      throw new Error('Das GeoPackage enthält keine Vektor-Tabellen.')
    }
    const baseName = layerNameFromFilename(file.name)
    return tables.map((table) => {
      const features = geopackage.iterateGeoJSONFeatures(table)
      const geojson = toFeatureCollection({
        type: 'FeatureCollection',
        features: [...features],
      })
      return {
        name: tables.length === 1 ? baseName : `${baseName} – ${table}`,
        bounds: vectorBounds(geojson),
        source: { kind: 'vector' as const, geojson },
      }
    })
  } finally {
    geopackage.close()
  }
}

async function loadGeoTiff(file: File): Promise<ImportedLayer[]> {
  if (file.size > MAX_RASTER_BYTES) {
    throw new Error(
      'Rasterdateien über 100 MB können im Browser nicht dargestellt werden.',
    )
  }
  const { default: parseGeoraster } = await import('georaster')
  let georaster
  try {
    georaster = await parseGeoraster(await file.arrayBuffer())
  } catch {
    throw new Error('Die Datei konnte nicht als GeoTIFF gelesen werden.')
  }
  if (!isSupportedRasterProjection(georaster.projection)) {
    throw new Error(
      `Koordinatensystem EPSG:${georaster.projection} wird nicht unterstützt ` +
        '(unterstützt: WGS84, Web Mercator, LV95).',
    )
  }
  return [
    {
      name: layerNameFromFilename(file.name),
      bounds: rasterBounds(georaster),
      source: { kind: 'raster', georaster },
    },
  ]
}

/** Import a file into app layers. Throws German, user-facing errors. */
export async function importFile(file: File): Promise<ImportedLayer[]> {
  const kind = detectImportKind(file.name)
  switch (kind) {
    case 'geojson':
      return loadGeoJson(file)
    case 'gpkg':
      return loadGeoPackage(file)
    case 'geotiff':
      return loadGeoTiff(file)
    default:
      throw new Error(
        'Dateiformat nicht unterstützt. Lade GeoJSON, GeoPackage (.gpkg) oder GeoTIFF (.tif).',
      )
  }
}
