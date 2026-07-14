import { describe, expect, it } from 'vitest'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import GeoTIFFSource from 'ol/source/GeoTIFF'
import { makeSentinel2Layer } from './layer'

describe('makeSentinel2Layer', () => {
  it('builds a WebGL tile layer sourced from the scene GeoTIFF', () => {
    const layer = makeSentinel2Layer('https://example.com/scene.tif')
    expect(layer).toBeInstanceOf(WebGLTileLayer)
    expect(layer.getSource()).toBeInstanceOf(GeoTIFFSource)
  })

  it('carries a Copernicus/ESA attribution', () => {
    const layer = makeSentinel2Layer('https://example.com/scene.tif')
    const getAttributions = (layer.getSource() as GeoTIFFSource).getAttributions()
    expect(getAttributions?.(null as never)).toEqual([
      expect.stringContaining('Copernicus'),
    ])
  })
})
