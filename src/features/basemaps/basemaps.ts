import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'

export interface BasemapDef {
  id: string
  label: string
}

/** Available basemaps (shown in the switcher, in this order). */
export const BASEMAPS: BasemapDef[] = [
  { id: 'osm', label: 'OpenStreetMap' },
  { id: 'swisstopo-karte', label: 'swisstopo Landeskarte' },
  { id: 'swisstopo-luftbild', label: 'swisstopo Luftbild' },
]

export const DEFAULT_BASEMAP_ID = 'osm'

/** Official swisstopo WMTS resolutions for the LV95 (EPSG:2056) grid. */
const LV95_RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25,
]
const LV95_ORIGIN: [number, number] = [2420000, 1350000]

/**
 * swisstopo layer on the native LV95 tile grid — pixel-identical to the
 * official map.geo.admin.ch rendering, no reprojection involved.
 */
function swisstopoLv95(layerId: string): TileLayer {
  return new TileLayer({
    source: new WMTS({
      url: `https://wmts.geo.admin.ch/1.0.0/${layerId}/default/current/2056/{TileMatrix}/{TileCol}/{TileRow}.jpeg`,
      layer: layerId,
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

/** Create the OL layer for a basemap id (unknown ids fall back to OSM). */
export function makeBasemapLayer(id: string): TileLayer {
  switch (id) {
    case 'swisstopo-karte':
      return swisstopoLv95('ch.swisstopo.pixelkarte-farbe')
    case 'swisstopo-luftbild':
      return swisstopoLv95('ch.swisstopo.swissimage')
    default:
      // OSM tiles are Web Mercator; OL reprojects them into the LV95 view.
      return new TileLayer({ source: new OSM() })
  }
}
