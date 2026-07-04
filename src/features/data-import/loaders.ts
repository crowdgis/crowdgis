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
import { detectEpsgFromPrj } from './prj'

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

/**
 * Read a shapefile ZIP (.shp, .shx, .dbf, optional .prj) and reproject it
 * to WGS84 ourselves, same rationale as readGpkgTable: we don't trust a
 * library to get Swiss CRS reprojection right. A ZIP may bundle several
 * shapefiles, so this can return more than one layer.
 *
 * COMPLETENESS GUARANTEE: if a shapefile cannot be read or its projection
 * is not recognized, the whole import fails loudly instead of showing an
 * incomplete or misplaced layer.
 */
async function loadShapefile(file: File): Promise<ImportedLayer[]> {
  const [{ default: JSZip }, { read: readShapefile }] = await Promise.all([
    import('jszip'),
    import('shapefile'),
  ])
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter((f) => !f.dir)
  const shpEntries = entries.filter((f) => /\.shp$/i.test(f.name))
  if (shpEntries.length === 0) {
    throw new Error('Das ZIP enthält keine .shp-Datei.')
  }

  function findSibling(shpName: string, ext: string) {
    const base = shpName.slice(0, -4).toLowerCase()
    return entries.find((f) => f.name.toLowerCase() === `${base}.${ext}`)
  }

  const layers: ImportedLayer[] = []
  for (const shpEntry of shpEntries) {
    const shpLabel = shpEntry.name.split('/').pop() ?? shpEntry.name
    const dbfEntry = findSibling(shpEntry.name, 'dbf')
    const shxEntry = findSibling(shpEntry.name, 'shx')
    const prjEntry = findSibling(shpEntry.name, 'prj')
    if (!dbfEntry) {
      throw new Error(`Zu „${shpLabel}“ fehlt die zugehörige .dbf-Datei.`)
    }
    if (!shxEntry) {
      throw new Error(`Zu „${shpLabel}“ fehlt die zugehörige .shx-Datei.`)
    }

    let epsg = 4326
    let projectionNote: string | undefined
    if (prjEntry) {
      const wkt = await prjEntry.async('text')
      const detected = detectEpsgFromPrj(wkt)
      if (detected == null || !isSupportedVectorProjection(detected)) {
        throw new Error(
          `Koordinatensystem von „${shpLabel}“ wird nicht unterstützt ` +
            '(unterstützt: WGS84, Web Mercator, LV95, LV03).',
        )
      }
      epsg = detected
    } else {
      projectionNote = `„${layerNameFromFilename(shpLabel)}“: keine .prj-Datei gefunden, WGS84 angenommen.`
    }

    const [shpBytes, dbfBytes] = await Promise.all([
      shpEntry.async('arraybuffer'),
      dbfEntry.async('arraybuffer'),
    ])

    let collection: FeatureCollection
    try {
      collection = await readShapefile(shpBytes, dbfBytes)
    } catch {
      throw new Error(`„${shpLabel}“ konnte nicht als Shapefile gelesen werden.`)
    }

    let empty = 0
    const features: Feature[] = []
    for (const feature of collection.features) {
      if (!feature.geometry) {
        empty += 1
        continue
      }
      features.push({
        ...feature,
        geometry: reprojectGeometryToWgs84(feature.geometry, epsg),
      })
    }
    if (features.length === 0) {
      throw new Error(`„${shpLabel}“ enthält keine Geometrien.`)
    }

    const geojson: FeatureCollection = { type: 'FeatureCollection', features }
    const name =
      shpEntries.length === 1
        ? layerNameFromFilename(file.name)
        : layerNameFromFilename(shpLabel)
    layers.push({
      name,
      bounds: vectorBounds(geojson),
      source: { kind: 'vector', geojson },
      note:
        empty > 0
          ? `„${name}“: ${empty} Objekte ohne Geometrie (leer) nicht dargestellt.`
          : projectionNote,
    })
  }
  return layers
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
    case 'shapefile':
      return loadShapefile(file)
    default:
      throw new Error(
        'Dateiformat nicht unterstützt. Lade GeoJSON, GeoPackage (.gpkg), ' +
          'GeoTIFF (.tif) oder Shapefile (.zip).',
      )
  }
}
