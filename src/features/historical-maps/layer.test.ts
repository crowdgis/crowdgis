import { describe, expect, it, vi } from 'vitest'
import WMTS from 'ol/source/WMTS'
import RenderEvent from 'ol/render/Event'
import type Map from 'ol/Map'
import { clipLayerToSwipe, makeHistoricalMapLayer } from './layer'

describe('makeHistoricalMapLayer', () => {
  it('builds a WMTS tile layer requesting the given edition', () => {
    const layer = makeHistoricalMapLayer('1935', 'image/png')
    const source = layer.getSource()
    expect(source).toBeInstanceOf(WMTS)
    const urls = (source as WMTS).getUrls()
    expect(urls?.[0]).toContain('/ch.swisstopo.zeitreihen/default/1935/2056/')
    expect(urls?.[0]).toMatch(/\.png$/)
  })

  it('derives the tile extension from the given format', () => {
    const layer = makeHistoricalMapLayer('1864', 'image/jpeg')
    const urls = (layer.getSource() as WMTS).getUrls()
    expect(urls?.[0]).toMatch(/\.jpeg$/)
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
    const layer = makeHistoricalMapLayer('1998', 'image/png')
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
