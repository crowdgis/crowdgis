/**
 * Minimal .prj (WKT) → EPSG detection, limited to the CRS this app can
 * reproject (see isSupportedVectorProjection in src/lib/geo.ts). Many
 * shapefiles ship ESRI-style WKT without AUTHORITY/EPSG tags, so we match
 * on CRS names as well as codes. Order matters: CH1903+ (LV95) must be
 * checked before CH1903 (LV03), and Web Mercator before generic WGS84,
 * since their WKT strings overlap.
 */
const PRJ_PATTERNS: Array<[RegExp, number]> = [
  [/CH1903\+|LV95|\b2056\b/i, 2056],
  [/CH1903(?!\+)|LV03|\b21781\b/i, 21781],
  [/Web_Mercator|Pseudo-Mercator|\b3857\b|\b900913\b/i, 3857],
  [/WGS_1984|WGS[ _]?84|\b4326\b/i, 4326],
]

/** Detect the EPSG code of a .prj WKT string, null when unrecognized. */
export function detectEpsgFromPrj(wkt: string): number | null {
  for (const [pattern, epsg] of PRJ_PATTERNS) {
    if (pattern.test(wkt)) return epsg
  }
  return null
}
