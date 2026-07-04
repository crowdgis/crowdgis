import { bbox } from '@turf/turf'
import proj4 from 'proj4'
import type { Geometry, FeatureCollection, Position } from 'geojson'
import type { GeoRasterData } from 'georaster'
import type { LayerBounds } from '../state/layerStore'
// Registers EPSG:2056 and EPSG:21781 with proj4 as a side effect.
import './crs'

/** WGS84 bounds of a FeatureCollection, null when it has no geometry. */
export function vectorBounds(fc: FeatureCollection): LayerBounds | null {
  if (fc.features.length === 0) return null
  const [west, south, east, north] = bbox(fc)
  if (![west, south, east, north].every(Number.isFinite)) return null
  return [
    [south, west],
    [north, east],
  ]
}

/** EPSG codes we can transform raster bounds from. */
const SUPPORTED_RASTER_EPSG = new Set([4326, 3857, 2056])

export function isSupportedRasterProjection(epsg: number): boolean {
  return SUPPORTED_RASTER_EPSG.has(epsg)
}

/** EPSG codes we can reproject vector geometries from (to WGS84). */
const SUPPORTED_VECTOR_EPSG = new Set([4326, 3857, 2056, 21781])

export function isSupportedVectorProjection(epsg: number): boolean {
  return SUPPORTED_VECTOR_EPSG.has(epsg)
}

/**
 * Arc flattening tolerance in the CRS's units. Lives next to the
 * supported-EPSG knowledge on purpose: of the supported codes only 4326
 * is degree-based, everything else is metric — if another geographic CRS
 * is ever added above, this mapping must grow with it.
 */
export function arcToleranceForEpsg(epsg: number): number {
  return epsg === 4326 ? 5e-7 : 0.05
}

interface Wgs84Converter {
  forward: (pos: [number, number]) => [number, number]
}

/**
 * Converter construction is expensive in proj4 (defs lookup, datum setup)
 * — never build it per coordinate. Cached per source EPSG.
 */
const wgs84Converters = new Map<number, Wgs84Converter>()

function converterToWgs84(epsg: number): Wgs84Converter {
  let conv = wgs84Converters.get(epsg)
  if (!conv) {
    conv = proj4(`EPSG:${epsg}`, 'EPSG:4326') as Wgs84Converter
    wgs84Converters.set(epsg, conv)
  }
  return conv
}

function reprojectCoords(conv: Wgs84Converter, coords: unknown): unknown {
  const arr = coords as unknown[]
  if (typeof arr[0] === 'number') {
    const pos = coords as Position
    const [lng, lat] = conv.forward([pos[0], pos[1]])
    return pos.length > 2 ? [lng, lat, ...pos.slice(2)] : [lng, lat]
  }
  return arr.map((c) => reprojectCoords(conv, c))
}

/**
 * Reproject a GeoJSON geometry to WGS84 using our verified proj4 defs.
 * We do this ourselves because the GeoPackage library's in-browser
 * reprojection is unreliable for Swiss CRS (produces shifted coordinates).
 */
export function reprojectGeometryToWgs84(geom: Geometry, epsg: number): Geometry {
  if (epsg === 4326) return geom
  if (geom.type === 'GeometryCollection') {
    return {
      type: 'GeometryCollection',
      geometries: geom.geometries.map((g) => reprojectGeometryToWgs84(g, epsg)),
    }
  }
  return {
    ...geom,
    coordinates: reprojectCoords(converterToWgs84(epsg), geom.coordinates),
  } as Geometry
}

/**
 * WGS84 bounds of a georaster. Transforms all four corners and takes the
 * envelope, which also covers slightly rotated projections like LV95.
 */
export function rasterBounds(georaster: GeoRasterData): LayerBounds | null {
  const { xmin, xmax, ymin, ymax, projection } = georaster
  if (projection === 4326) {
    return [
      [ymin, xmin],
      [ymax, xmax],
    ]
  }
  if (!isSupportedRasterProjection(projection)) return null
  const corners: Array<[number, number]> = [
    [xmin, ymin],
    [xmin, ymax],
    [xmax, ymin],
    [xmax, ymax],
  ]
  const conv = converterToWgs84(projection)
  const transformed = corners.map((corner) => conv.forward(corner))
  const lngs = transformed.map(([lng]) => lng)
  const lats = transformed.map(([, lat]) => lat)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}
