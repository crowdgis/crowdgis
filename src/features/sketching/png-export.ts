import { toPng } from 'html-to-image'

export type PngExportMode = 'drawing' | 'map'

/** DOM node classes that never belong in an exported map image. */
const ALWAYS_EXCLUDED = ['leaflet-control-container']
/** Additionally excluded when exporting only the drawing (no basemap). */
const BASEMAP_EXCLUDED = ['leaflet-tile-pane', 'leaflet-tile-container']

/** Whether a map-container DOM node should be kept when rasterizing to PNG. */
export function includeNode(node: Element, mode: PngExportMode): boolean {
  const classList = node.classList
  if (!classList) return true
  const excluded = mode === 'drawing' ? [...ALWAYS_EXCLUDED, ...BASEMAP_EXCLUDED] : ALWAYS_EXCLUDED
  return !excluded.some((cls) => classList.contains(cls))
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

/** Exports the map as a PNG: either the drawing only (transparent) or the full map. */
export async function exportMapAsPng(map: L.Map, mode: PngExportMode): Promise<void> {
  const container = map.getContainer()
  const previousBackground = container.style.background
  if (mode === 'drawing') {
    container.style.background = 'transparent'
  }
  try {
    const dataUrl = await toPng(container, {
      pixelRatio: 2,
      filter: (node) => includeNode(node, mode),
    })
    download(dataUrl, mode === 'drawing' ? 'skizze.png' : 'karte.png')
  } finally {
    container.style.background = previousBackground
  }
}
