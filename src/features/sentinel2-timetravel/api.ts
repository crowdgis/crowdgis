import type { Geometry } from 'geojson'

/** Public, CORS-enabled STAC API for Sentinel-2 data — no backend involved. */
const STAC_SEARCH_URL = 'https://earth-search.aws.element84.com/v1/search'
const SENTINEL2_COLLECTION = 'sentinel-2-l2a'
const MAX_RESULTS = 30

/** One Sentinel-2 L2A scene found for the student's area of interest. */
export interface Sentinel2Scene {
  id: string
  /** Acquisition timestamp, ISO 8601 as reported by the STAC item. */
  datetime: string
  /** Cloud cover percentage (0–100) reported by the STAC item. */
  cloudCover: number
  /** URL of the true-colour visual asset (a Cloud Optimized GeoTIFF). */
  visualUrl: string
}

interface StacItem {
  id: string
  properties?: { datetime?: string; 'eo:cloud_cover'?: number }
  assets?: { visual?: { href?: string } }
}

/**
 * Turn a raw STAC ItemCollection response into displayable scenes, sorted
 * by ascending cloud cover (least cloudy first). Items without a usable
 * visual asset are skipped.
 */
export function parseStacScenes(json: unknown): Sentinel2Scene[] {
  const items = (json as { features?: StacItem[] })?.features ?? []
  return items
    .filter((item) => typeof item.assets?.visual?.href === 'string')
    .map((item) => ({
      id: item.id,
      datetime: item.properties?.datetime ?? '',
      cloudCover: item.properties?.['eo:cloud_cover'] ?? 0,
      visualUrl: item.assets!.visual!.href as string,
    }))
    .sort((a, b) => a.cloudCover - b.cloudCover)
}

/**
 * Search public Sentinel-2 L2A scenes (Copernicus/ESA data, served through
 * the Element84 Earth Search STAC API) intersecting an AOI polygon in
 * WGS84. Runs entirely client-side against a public endpoint.
 */
export async function searchSentinel2Scenes(
  aoi: Geometry,
): Promise<Sentinel2Scene[]> {
  const res = await fetch(STAC_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collections: [SENTINEL2_COLLECTION],
      intersects: aoi,
      limit: MAX_RESULTS,
      sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }],
    }),
  })
  if (!res.ok) {
    throw new Error(`Sentinel-2-Suche fehlgeschlagen (${res.status})`)
  }
  return parseStacScenes(await res.json())
}
