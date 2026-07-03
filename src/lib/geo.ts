import { bbox } from '@turf/turf'
import proj4 from 'proj4'
import type { FeatureCollection } from 'geojson'
import type { GeoRasterData } from 'georaster'
import type { LayerBounds } from '../state/layerStore'
// Registers EPSG:2056 with proj4 as a side effect.
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
