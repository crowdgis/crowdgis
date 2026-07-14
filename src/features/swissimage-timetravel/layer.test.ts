import { describe, expect, it, vi } from 'vitest'
import WMTS from 'ol/source/WMTS'
import RenderEvent from 'ol/render/Event'
import type Map from 'ol/Map'
import { clipLayerToSwipe, makeSwissimageLayer } from './layer'

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

function fakeContext() {
  return {
    save: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    restore: vi.fn(),
  }
}

describe('clipLayerToSwipe', () => {
  it('clips the render context to the right of the swipe fraction', () => {
    const layer = makeSwissimageLayer('1998')
    const map = { getSize: () => [200, 100] } as unknown as Map
    const ctx = fakeContext()

    const unclip = clipLayerToSwipe(layer, map, () => 0.25)

    layer.dispatchEvent(
      new RenderEvent(
        'prerender',
        [1, 0, 0, 1, 0, 0],
        undefined,
        ctx as unknown as CanvasRenderingContext2D,
      ),
    )
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.moveTo).toHaveBeenCalledWith(50, 0)
    expect(ctx.clip).toHaveBeenCalled()

    layer.dispatchEvent(
      new RenderEvent(
        'postrender',
        [1, 0, 0, 1, 0, 0],
        undefined,
        ctx as unknown as CanvasRenderingContext2D,
      ),
    )
    expect(ctx.restore).toHaveBeenCalled()

    unclip()
    ctx.save.mockClear()
    layer.dispatchEvent(
      new RenderEvent(
        'prerender',
        [1, 0, 0, 1, 0, 0],
        undefined,
        ctx as unknown as CanvasRenderingContext2D,
      ),
    )
    expect(ctx.save).not.toHaveBeenCalled()
  })
})
