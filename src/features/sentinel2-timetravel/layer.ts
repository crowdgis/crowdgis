import WebGLTileLayer from 'ol/layer/WebGLTile'
import GeoTIFFSource from 'ol/source/GeoTIFF'

/**
 * True-colour Sentinel-2 scene, rendered directly in the browser from its
 * Cloud Optimized GeoTIFF visual asset — no server-side rendering involved.
 */
export function makeSentinel2Layer(visualUrl: string): WebGLTileLayer {
  return new WebGLTileLayer({
    source: new GeoTIFFSource({
      sources: [{ url: visualUrl }],
      convertToRGB: 'auto',
      attributions:
        'Enthält modifizierte Copernicus-Sentinel-Daten, verarbeitet von ESA / Element84 Earth Search',
    }),
  })
}
