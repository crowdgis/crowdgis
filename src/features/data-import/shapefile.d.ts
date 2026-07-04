// The `shapefile` package ships no type declarations.
declare module 'shapefile' {
  import type { FeatureCollection } from 'geojson'

  export function read(
    shp: ArrayBuffer,
    dbf?: ArrayBuffer,
    options?: { encoding?: string },
  ): Promise<FeatureCollection>
}
