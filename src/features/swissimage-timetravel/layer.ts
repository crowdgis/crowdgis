import TileLayer from 'ol/layer/Tile'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'

/** swisstopo's time-enabled national aerial image mosaic. */
export const SWISSIMAGE_TIMETRAVEL_LAYER_ID = 'ch.swisstopo.swissimage-product'

/** Official swisstopo WMTS resolutions for the LV95 (EPSG:2056) grid. */
const LV95_RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25,
]
const LV95_ORIGIN: [number, number] = [2420000, 1350000]

/**
 * SwissImage aerial layer on the native LV95 tile grid for a given WMTS
 * Time dimension value ('current' or a year reported by the capabilities,
 * see capabilities.ts).
 */
export function makeSwissimageLayer(time: string): TileLayer {
  return new TileLayer({
    source: new WMTS({
      url: `https://wmts.geo.admin.ch/1.0.0/${SWISSIMAGE_TIMETRAVEL_LAYER_ID}/default/${time}/2056/{TileMatrix}/{TileCol}/{TileRow}.jpeg`,
      layer: SWISSIMAGE_TIMETRAVEL_LAYER_ID,
      matrixSet: '2056',
      format: 'image/jpeg',
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
