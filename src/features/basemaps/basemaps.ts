export interface BasemapDef {
  id: string
  label: string
  url: string
  attribution: string
  maxZoom: number
}

/**
 * Available basemaps. swisstopo tiles are served free of charge via the
 * public WMTS at wmts.geo.admin.ch (web mercator tile matrix set 3857).
 */
export const BASEMAPS: BasemapDef[] = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
    maxZoom: 19,
  },
  {
    id: 'swisstopo-karte',
    label: 'swisstopo Landeskarte',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
    maxZoom: 19,
  },
  {
    id: 'swisstopo-luftbild',
    label: 'swisstopo Luftbild',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
    maxZoom: 20,
  },
]

export const DEFAULT_BASEMAP_ID = 'osm'

export function getBasemap(id: string): BasemapDef {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0]
}
