import { HISTORICAL_MAPS_LAYER_ID } from './layer'

const CAPABILITIES_URL =
  'https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml'

/** Fallback tile format used when the capabilities document has none. */
export const DEFAULT_HISTORICAL_MAPS_FORMAT = 'image/png'

/** Direct children (at any nesting depth) matching a tag, ignoring namespace prefixes. */
function tags(root: Element | Document, localName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', localName))
}

function findLayer(doc: Document): Element | undefined {
  return tags(doc, 'Layer').find((l) =>
    tags(l, 'Identifier').some(
      (id) => id.textContent === HISTORICAL_MAPS_LAYER_ID,
    ),
  )
}

/**
 * Extract the WMTS Time dimension values swisstopo publishes for the
 * historical maps layer (Dufourkarte, Siegfriedkarte, historical
 * Landeskarte editions), from a WMTSCapabilities.xml document. Returns
 * `['current']` if the layer or its Time dimension is missing.
 */
export function parseHistoricalMapsTimes(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const layer = findLayer(doc)
  if (!layer) return ['current']

  const dimension = tags(layer, 'Dimension').find((d) =>
    tags(d, 'Identifier').some((id) => id.textContent === 'Time'),
  )
  if (!dimension) return ['current']

  const values = tags(dimension, 'Value')
    .map((v) => v.textContent ?? '')
    .filter(Boolean)
  if (values.length === 0) return ['current']

  const years = values
    .filter((v) => v !== 'current')
    .sort((a, b) => b.localeCompare(a))
  return values.includes('current') ? ['current', ...years] : years
}

/**
 * Extract the tile image format (e.g. 'image/png') the historical maps
 * layer is published in. Falls back to `DEFAULT_HISTORICAL_MAPS_FORMAT`
 * when the layer or its Format entry is missing.
 */
export function parseHistoricalMapsFormat(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const layer = findLayer(doc)
  if (!layer) return DEFAULT_HISTORICAL_MAPS_FORMAT
  const format = tags(layer, 'Format')[0]?.textContent
  return format || DEFAULT_HISTORICAL_MAPS_FORMAT
}

/**
 * Fetch the available historical map editions and their tile format from
 * swisstopo. Falls back to `['current']` / the default PNG format on any
 * network or parsing failure.
 */
export async function fetchHistoricalMapsCapabilities(): Promise<{
  times: string[]
  format: string
}> {
  try {
    const res = await fetch(CAPABILITIES_URL)
    if (!res.ok) return { times: ['current'], format: DEFAULT_HISTORICAL_MAPS_FORMAT }
    const xml = await res.text()
    return { times: parseHistoricalMapsTimes(xml), format: parseHistoricalMapsFormat(xml) }
  } catch {
    return { times: ['current'], format: DEFAULT_HISTORICAL_MAPS_FORMAT }
  }
}
