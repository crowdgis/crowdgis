import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import GeoRasterLayer from 'georaster-layer-for-leaflet'
import type { GeoRasterData } from 'georaster'

/** Mounts a georaster as a Leaflet layer for its lifetime. */
export function RasterLayer({ georaster }: { georaster: GeoRasterData }) {
  const map = useMap()
  useEffect(() => {
    const layer = new GeoRasterLayer({ georaster, opacity: 0.9, resolution: 128 })
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [georaster, map])
  return null
}
