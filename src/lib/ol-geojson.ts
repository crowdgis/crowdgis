import GeoJSONFormat from 'ol/format/GeoJSON'
import type Feature from 'ol/Feature'
import type {
  FeatureCollection,
  Feature as GeoJsonFeature,
  GeoJSON as GeoJsonObject,
} from 'geojson'

/**
 * GeoJSON in the stores is ALWAYS WGS84 (EPSG:4326); the map view runs
 * in EPSG:2056. These helpers do the conversion in both directions —
 * use them whenever a feature moves data between a store and the map.
 */

export const VIEW_PROJECTION = 'EPSG:2056'

const format = new GeoJSONFormat()

/** WGS84 GeoJSON (store) → OL features in view coordinates (map). */
export function readFeaturesWgs84(data: GeoJsonObject): Feature[] {
  return format.readFeatures(data, {
    dataProjection: 'EPSG:4326',
    featureProjection: VIEW_PROJECTION,
  })
}

/** OL features in view coordinates (map) → WGS84 GeoJSON (store). */
export function writeFeaturesWgs84(features: Feature[]): FeatureCollection {
  return format.writeFeaturesObject(features, {
    featureProjection: VIEW_PROJECTION,
    dataProjection: 'EPSG:4326',
  }) as FeatureCollection & { features: GeoJsonFeature[] }
}
