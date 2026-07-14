import TileLayer from 'ol/layer/Tile'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { getRenderPixel } from 'ol/render'
import type RenderEvent from 'ol/render/Event'
import type Map from 'ol/Map'

/** swisstopo's time-enabled historical maps layer (Dufour-, Siegfried- and historical Landeskarte editions). */
export const HISTORICAL_MAPS_LAYER_ID = 'ch.swisstopo.zeitreihen'

/** Official swisstopo WMTS resolutions for the LV95 (EPSG:2056) grid. */
const LV95_RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25,
]
const LV95_ORIGIN: [number, number] = [2420000, 1350000]

/** Tile file extension for a WMTS `Format` mime type, e.g. 'image/png' -> 'png'. */
function extensionFor(format: string): string {
  return format.split('/')[1] || 'png'
}

/**
 * Historical map layer on the native LV95 tile grid for a given WMTS Time
 * dimension value (a map edition year reported by the capabilities, see
 * capabilities.ts), rendered in the given tile `format`.
 */
export function makeHistoricalMapLayer(time: string, format: string): TileLayer {
  const ext = extensionFor(format)
  return new TileLayer({
    source: new WMTS({
      url: `https://wmts.geo.admin.ch/1.0.0/${HISTORICAL_MAPS_LAYER_ID}/default/${time}/2056/{TileMatrix}/{TileCol}/{TileRow}.${ext}`,
      layer: HISTORICAL_MAPS_LAYER_ID,
      matrixSet: '2056',
      format,
      style: 'default',
      projection: 'EPSG:2056',
      requestEncoding: 'REST',
      tileGrid: new WMTSTileGrid({
        origin: LV95_ORIGIN,
        resolutions: LV95_RESOLUTIONS,
        matrixIds: LV95_RESOLUTIONS.map((_, i) => String(i)),
      }),
      attributions:
        '© <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
      crossOrigin: 'anonymous',
    }),
  })
}

/**
 * Clips `layer`'s rendering to the part of the map viewport right of
 * `getFraction()` (0 = left edge, 1 = right edge), so the layer(s) below
 * show through on the left — used to swipe-compare two map editions.
 * Returns a function that removes the clip listeners again.
 */
export function clipLayerToSwipe(
  layer: TileLayer,
  map: Map,
  getFraction: () => number,
): () => void {
  function prerender(event: RenderEvent) {
    const ctx = event.context as CanvasRenderingContext2D
    const size = map.getSize()
    if (!size) return
    const width = size[0] * getFraction()
    const topLeft = getRenderPixel(event, [width, 0])
    const topRight = getRenderPixel(event, [size[0], 0])
    const bottomLeft = getRenderPixel(event, [width, size[1]])
    const bottomRight = getRenderPixel(event, size)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(topLeft[0], topLeft[1])
    ctx.lineTo(bottomLeft[0], bottomLeft[1])
    ctx.lineTo(bottomRight[0], bottomRight[1])
    ctx.lineTo(topRight[0], topRight[1])
    ctx.closePath()
    ctx.clip()
  }
  function postrender(event: RenderEvent) {
    ;(event.context as CanvasRenderingContext2D).restore()
  }
  layer.on('prerender', prerender)
  layer.on('postrender', postrender)
  return () => {
    layer.un('prerender', prerender)
    layer.un('postrender', postrender)
  }
}
