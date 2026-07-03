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

function reprojectCoords(from: string, coords: unknown): unknown {
  if (typeof (coords as number[])[0] === 'number') {
    const [x, y, ...rest] = coords as Position
    const [lng, lat] = proj4(from, 'EPSG:4326', [x, y])
    return rest.length > 0 ? [lng, lat, ...rest] : [lng, lat]
  }
  return (coords as unknown[]).map((c) => reprojectCoords(from, c))
}

/**
 * Reproject a GeoJSON geometry to WGS84 using our verified proj4 defs.
 * We do this ourselves because the GeoPackage library's in-browser
 * reprojection is unreliable for Swiss CRS (produces shifted coordinates).
 */
export function reprojectGeometryToWgs84(geom: Geometry, epsg: number): Geometry {
  if (epsg === 4326) return geom
  const from = `EPSG:${epsg}`
  if (geom.type === 'GeometryCollection') {
    return {
      type: 'GeometryCollection',
      geometries: geom.geometries.map((g) => reprojectGeometryToWgs84(g, epsg)),
    }
  }
  return {
    ...geom,
    coordinates: reprojectCoords(from, geom.coordinates),
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
  const from = `EPSG:${projection}`
  const corners: Array<[number, number]> = [
    [xmin, ymin],
    [xmin, ymax],
    [xmax, ymin],
    [xmax, ymax],
  ]
  const transformed = corners.map(([x, y]) => proj4(from, 'EPSG:4326', [x, y]))
  const lngs = transformed.map(([lng]) => lng)
  const lats = transformed.map(([, lat]) => lat)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}
