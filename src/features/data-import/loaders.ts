import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { ImportedLayer } from '../../state/layerStore'
import {
  isSupportedRasterProjection,
  isSupportedVectorProjection,
  rasterBounds,
  reprojectGeometryToWgs84,
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
    const tables: string[] = geopackage.getFeatureTables()
    if (tables.length === 0) {
      throw new Error('Das GeoPackage enthält keine Vektor-Tabellen.')
    }
    const baseName = layerNameFromFilename(file.name)
    return tables.map((table) =>
      readGpkgTable(
        geopackage,
        table,
        tables.length === 1 ? baseName : `${baseName} – ${table}`,
      ),
    )
  } finally {
    geopackage.close()
  }
}

/**
 * Read one GeoPackage feature table in its NATIVE CRS and reproject it to
 * WGS84 ourselves. The library's in-browser reprojection is wrong for Swiss
 * CRS, so we read raw coordinates via the feature DAO and use our verified
 * proj4 defs. Features whose geometry the library cannot parse (e.g. curve
 * geometries / CurvePolygon) are counted and surfaced rather than dropped
 * silently.
 */
// The GeoPackage types don't expose these row/geometry internals cleanly.
/* eslint-disable @typescript-eslint/no-explicit-any */
function readGpkgTable(
  geopackage: any,
  table: string,
  name: string,
): ImportedLayer {
  const dao = geopackage.getFeatureDao(table)
  const epsg = Number(
    dao.srs?.organization_coordsys_id ?? dao.srs?.srs_id ?? NaN,
  )
  if (!Number.isFinite(epsg) || !isSupportedVectorProjection(epsg)) {
    throw new Error(
      `Koordinatensystem EPSG:${epsg} der Tabelle „${table}“ wird nicht unterstützt ` +
        '(unterstützt: WGS84, Web Mercator, LV95, LV03).',
    )
  }
  const geomColumn: string | undefined = dao.geometryColumns?.columnName

  const features: Feature[] = []
  let skipped = 0
  for (const raw of dao.queryForEach()) {
    const row = dao.getRow(raw)
    let native: Geometry | undefined
    try {
      native = row.geometry?.geometry?.toGeoJSON?.() as Geometry | undefined
    } catch {
      native = undefined
    }
    if (!native) {
      skipped += 1
      continue
    }
    const properties: Record<string, unknown> = {}
    const values = row.values as Record<string, unknown>
    for (const key of Object.keys(values)) {
      const value = values[key]
      if (key !== geomColumn && !(value instanceof Uint8Array)) {
        properties[key] = value
      }
    }
    features.push({
      type: 'Feature',
      geometry: reprojectGeometryToWgs84(native, epsg),
      properties,
    })
  }

  if (features.length === 0) {
    throw new Error(
      `Die Tabelle „${table}“ enthält keine lesbaren Geometrien` +
        (skipped > 0
          ? ` (${skipped} nicht unterstützte Kurven-Geometrien).`
          : '.'),
    )
  }

  const geojson: FeatureCollection = { type: 'FeatureCollection', features }
  return {
    name,
    bounds: vectorBounds(geojson),
    source: { kind: 'vector', geojson },
    note:
      skipped > 0
        ? `„${name}“: ${skipped} von ${skipped + features.length} Objekten übersprungen ` +
          '(Kurven-Geometrie wird nicht unterstützt).'
        : undefined,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
