import type { Feature } from 'geojson'

/** True for point features that are free-standing text labels. */
export function isTextLabel(feature: Feature | undefined): boolean {
  return feature?.properties?.isLabel === true
}

/** Text of a free-standing label feature, if any. */
export function labelText(feature: Feature | undefined): string {
  const text = feature?.properties?.text
  return typeof text === 'string' ? text : ''
}

/** Text of a label attached to a regular sketch object, if any. */
export function attachedLabel(feature: Feature | undefined): string | null {
  const label = feature?.properties?.label
  return typeof label === 'string' && label.length > 0 ? label : null
}

/** Escapes text before it is used as innerHTML (divIcon content, tooltips). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
