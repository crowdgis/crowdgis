import type { Feature, FeatureCollection } from 'geojson'
import type { ImportedLayer } from '../../state/layerStore'
import {
  arcToleranceForEpsg,
  isSupportedRasterProjection,
  isSupportedVectorProjection,
  rasterBounds,
  reprojectGeometryToWgs84,
  vectorBounds,
} from '../../lib/geo'
import { parseGpkgGeometry } from '../../lib/gpkg-wkb'
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
 * WGS84 ourselves (the library's in-browser reprojection is wrong for
 * Swiss CRS). Geometries are decoded with our own WKB parser, which also
 * handles curve types the library cannot read.
 *
 * COMPLETENESS GUARANTEE: if any geometry cannot be decoded, the whole
 * import fails loudly. We never display an incomplete dataset — partial
 * data that looks complete is worse than an error.
 */
// The GeoPackage types don't expose these row internals cleanly.
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
  const geomColumn: string =
    dao.getGeometryColumnName?.() ?? dao.geometryColumns?.columnName ?? 'geom'
  const tolerance = arcToleranceForEpsg(epsg)

  const features: Feature[] = []
  let unreadable = 0
  let empty = 0
  let total = 0
  for (const raw of dao.queryForEach()) {
    total += 1
    const record = raw as Record<string, unknown>
    const blob = record[geomColumn]
    if (blob == null) {
      empty += 1
      continue
    }
    if (!(blob instanceof Uint8Array)) {
      unreadable += 1
      continue
    }
    let geometry
    try {
      geometry = parseGpkgGeometry(blob, tolerance)
    } catch {
      unreadable += 1
      continue
    }
    if (!geometry) {
      empty += 1 // explicitly empty geometry
      continue
    }
    const properties: Record<string, unknown> = {}
    for (const key of Object.keys(record)) {
      const value = record[key]
      if (key !== geomColumn && !(value instanceof Uint8Array)) {
        properties[key] = value
      }
    }
    features.push({
      type: 'Feature',
      geometry: reprojectGeometryToWgs84(geometry, epsg),
      properties,
    })
  }

  // Fail closed: incomplete data must never be shown as if it were complete.
  if (unreadable > 0) {
    throw new Error(
      `Import abgebrochen: ${unreadable} von ${total} Objekten in „${table}“ ` +
        'konnten nicht gelesen werden. Es werden keine unvollständigen Daten angezeigt. ' +
        'Bitte melde dieses Problem als Feature-Wunsch mit Angabe der Datei.',
    )
  }
  if (features.length === 0) {
    throw new Error(`Die Tabelle „${table}“ enthält keine Geometrien.`)
  }

  const geojson: FeatureCollection = { type: 'FeatureCollection', features }
  return {
    name,
    bounds: vectorBounds(geojson),
    source: { kind: 'vector', geojson },
    note:
      empty > 0
        ? `„${name}“: ${empty} Objekte ohne Geometrie (leer) nicht dargestellt.`
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
