import { SWISSIMAGE_TIMETRAVEL_LAYER_ID } from './layer'

const CAPABILITIES_URL =
  'https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml'

/** Direct children (at any nesting depth) matching a tag, ignoring namespace prefixes. */
function tags(root: Element | Document, localName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', localName))
}

/**
 * Extract the WMTS Time dimension values swisstopo publishes for the
 * SwissImage time-travel layer, from a WMTSCapabilities.xml document.
 * Returns `['current']` if the layer or its Time dimension is missing.
 */
export function parseSwissimageTimes(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const layer = tags(doc, 'Layer').find((l) =>
    tags(l, 'Identifier').some(
      (id) => id.textContent === SWISSIMAGE_TIMETRAVEL_LAYER_ID,
    ),
  )
  if (!layer) return ['current']

  const dimension = tags(layer, 'Dimension').find((d) =>
    tags(d, 'Identifier').some((id) => id.textContent === 'Time'),
  )
  if (!dimension) return ['current']

  const values = tags(dimension, 'Value')
    .map((v) => v.textContent ?? '')
    .filter(Boolean)
  if (values.length === 0) return ['current']

  const years = values.filter((v) => v !== 'current').sort((a, b) => b.localeCompare(a))
  return values.includes('current') ? ['current', ...years] : years
}

/**
 * Fetch the available SwissImage time-travel years from swisstopo.
 * Falls back to `['current']` on any network or parsing failure.
 */
export async function fetchSwissimageTimes(): Promise<string[]> {
  try {
    const res = await fetch(CAPABILITIES_URL)
    if (!res.ok) return ['current']
    return parseSwissimageTimes(await res.text())
  } catch {
    return ['current']
  }
}
