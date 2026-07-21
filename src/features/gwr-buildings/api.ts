/**
 * Access to the public GWR (Gebäude- und Wohnungsregister) layer published
 * by swisstopo on geo.admin.ch. There is no dedicated backend for this app,
 * so buildings are queried directly from the browser for a drawn polygon
 * (never for all of Switzerland at once) via the identify endpoint that
 * also powers the map.geo.admin.ch viewer.
 */

const IDENTIFY_URL =
  'https://api3.geo.admin.ch/rest/services/api/MapServer/identify'

export const GWR_LAYER_ID = 'ch.bfs.gebaeude_wohnungs_register'

/** One GWR building's attributes, keyed by the register's own field names. */
export interface GwrBuilding {
  [key: string]: unknown
}

/**
 * Build the geo.admin.ch identify URL for all GWR buildings intersecting a
 * polygon. `rings` and `extent` are Swiss LV95 (EPSG:2056) coordinates, the
 * map's native projection — no reprojection needed.
 */
export function buildIdentifyUrl(
  rings: number[][][],
  extent: [number, number, number, number],
): string {
  const [minX, minY, maxX, maxY] = extent
  const params = new URLSearchParams({
    geometryType: 'esriGeometryPolygon',
    geometry: JSON.stringify({ rings }),
    geometryFormat: 'geojson',
    layers: `all:${GWR_LAYER_ID}`,
    tolerance: '0',
    mapExtent: `${minX},${minY},${maxX},${maxY}`,
    imageDisplay: '1000,1000,96',
    sr: '2056',
    returnGeometry: 'false',
  })
  return `${IDENTIFY_URL}?${params.toString()}`
}

/** A single identify result may carry its attributes as either key, depending on format. */
function extractProperties(result: unknown): GwrBuilding | null {
  if (typeof result !== 'object' || result === null) return null
  const r = result as Record<string, unknown>
  const props = r.properties ?? r.attributes
  if (typeof props !== 'object' || props === null) return null
  return props as GwrBuilding
}

/** Parse a geo.admin.ch identify response into a flat list of building attributes. */
export function parseIdentifyResponse(data: unknown): GwrBuilding[] {
  if (typeof data !== 'object' || data === null) return []
  const results = (data as Record<string, unknown>).results
  if (!Array.isArray(results)) return []
  return results
    .map(extractProperties)
    .filter((p): p is GwrBuilding => p !== null)
}

/** Query all GWR buildings inside a drawn polygon. Throws on network/HTTP failure. */
export async function fetchGwrBuildings(
  rings: number[][][],
  extent: [number, number, number, number],
): Promise<GwrBuilding[]> {
  const res = await fetch(buildIdentifyUrl(rings, extent))
  if (!res.ok) {
    throw new Error(`GWR-Abfrage fehlgeschlagen (Status ${res.status}).`)
  }
  const data = await res.json()
  return parseIdentifyResponse(data)
}
