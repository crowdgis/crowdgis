import { isInLv95Area, wgs84ToLv95 } from '../../lib/crs'

/** Format a WGS84 position, e.g. "47.37818°N 8.54019°E". */
export function formatWgs84(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(5)}°${ns} ${Math.abs(lng).toFixed(5)}°${ew}`
}

/**
 * Format a position as Swiss LV95 coordinates, e.g. "2'683'263 / 1'248'243".
 * Returns null outside the LV95 area, where the values would be meaningless.
 */
export function formatLv95(lat: number, lng: number): string | null {
  if (!isInLv95Area(lat, lng)) return null
  const { east, north } = wgs84ToLv95(lat, lng)
  return `${formatSwissMeters(east)} / ${formatSwissMeters(north)}`
}

/** Swiss number style with apostrophes as thousands separators, no decimals. */
function formatSwissMeters(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")
}
