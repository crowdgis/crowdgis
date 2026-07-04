import type { Feature } from 'geojson'

export interface SketchStyle {
  color: string
  weight: number
}

export const DEFAULT_STYLE: SketchStyle = { color: '#870010', weight: 2 }

/** Reads the style stored in a sketch feature's properties, if valid. */
export function styleOf(feature: Feature | undefined): SketchStyle | null {
  const style = feature?.properties?.style
  if (!style || typeof style !== 'object') return null
  const { color, weight } = style as Record<string, unknown>
  if (typeof color !== 'string' || typeof weight !== 'number') return null
  return { color, weight }
}
