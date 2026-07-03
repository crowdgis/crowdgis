declare module 'georaster' {
  export interface GeoRasterData {
    width: number
    height: number
    xmin: number
    xmax: number
    ymin: number
    ymax: number
    pixelWidth: number
    pixelHeight: number
    /** EPSG code of the raster, e.g. 4326, 3857, 2056 */
    projection: number
    numberOfRasters: number
    noDataValue: number | null
    values: number[][][]
  }
  export default function parseGeoraster(
    data: ArrayBuffer | Blob | string,
  ): Promise<GeoRasterData>
}

declare module 'georaster-layer-for-leaflet' {
  import type { GridLayer, GridLayerOptions } from 'leaflet'
  import type { GeoRasterData } from 'georaster'

  export interface GeoRasterLayerOptions extends GridLayerOptions {
    georaster: GeoRasterData
    opacity?: number
    /** Sampling resolution per tile, higher = sharper but slower. */
    resolution?: number
    pixelValuesToColorFn?: (values: number[]) => string | undefined
  }

  export default class GeoRasterLayer extends GridLayer {
    constructor(options: GeoRasterLayerOptions)
  }
}
