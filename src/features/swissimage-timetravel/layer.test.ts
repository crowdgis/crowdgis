import { describe, expect, it } from 'vitest'
import WMTS from 'ol/source/WMTS'
import { makeSwissimageLayer } from './layer'

describe('makeSwissimageLayer', () => {
  it('builds a WMTS tile layer requesting the given time', () => {
    const layer = makeSwissimageLayer('2019')
    const source = layer.getSource()
    expect(source).toBeInstanceOf(WMTS)
    const urls = (source as WMTS).getUrls()
    expect(urls?.[0]).toContain(
      '/ch.swisstopo.swissimage-product/default/2019/2056/',
    )
  })

  it('requests the current mosaic by default time value', () => {
    const layer = makeSwissimageLayer('current')
    const urls = (layer.getSource() as WMTS).getUrls()
    expect(urls?.[0]).toContain('/default/current/2056/')
  })
})
