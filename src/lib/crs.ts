import proj4 from 'proj4'

/**
 * Swiss coordinate reference system LV95 (EPSG:2056).
 * Official transformation parameters from swisstopo.
 */
export const EPSG_2056 =
  '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 ' +
  '+x_0=2600000 +y_0=1200000 +ellps=bessel ' +
  '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs'

proj4.defs('EPSG:2056', EPSG_2056)

export interface Lv95Coords {
  /** Easting in meters (E), around 2'600'000 in central Switzerland */
  east: number
  /** Northing in meters (N), around 1'200'000 in central Switzerland */
  north: number
}

export interface Wgs84Coords {
  lat: number
  lng: number
}

/** Convert WGS84 (lat/lng) to Swiss LV95 (E/N). */
export function wgs84ToLv95(lat: number, lng: number): Lv95Coords {
  const [east, north] = proj4('EPSG:4326', 'EPSG:2056', [lng, lat])
  return { east, north }
}

/** Convert Swiss LV95 (E/N) to WGS84 (lat/lng). */
export function lv95ToWgs84(east: number, north: number): Wgs84Coords {
  const [lng, lat] = proj4('EPSG:2056', 'EPSG:4326', [east, north])
  return { lat, lng }
}

/**
 * Rough check whether a WGS84 position is inside the area where LV95
 * is meaningful (Switzerland and immediate surroundings).
 */
export function isInLv95Area(lat: number, lng: number): boolean {
  return lat >= 45.5 && lat <= 48.1 && lng >= 5.5 && lng <= 11.0
}
