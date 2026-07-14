import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseStacScenes, searchSentinel2Scenes } from './api'

const AOI_POLYGON = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [8.5, 47.4],
      [8.6, 47.4],
      [8.6, 47.5],
      [8.5, 47.5],
      [8.5, 47.4],
    ],
  ],
}

function stacResponse(features: unknown[]) {
  return { type: 'FeatureCollection', features }
}

describe('parseStacScenes', () => {
  it('maps STAC items to scenes sorted by ascending cloud cover', () => {
    const scenes = parseStacScenes(
      stacResponse([
        {
          id: 'cloudy',
          properties: { datetime: '2023-06-01T10:00:00Z', 'eo:cloud_cover': 80 },
          assets: { visual: { href: 'https://example.com/cloudy.tif' } },
        },
        {
          id: 'clear',
          properties: { datetime: '2023-05-01T10:00:00Z', 'eo:cloud_cover': 2 },
          assets: { visual: { href: 'https://example.com/clear.tif' } },
        },
      ]),
    )
    expect(scenes.map((s) => s.id)).toEqual(['clear', 'cloudy'])
    expect(scenes[0].cloudCover).toBe(2)
    expect(scenes[0].visualUrl).toBe('https://example.com/clear.tif')
  })

  it('skips items without a visual asset', () => {
    const scenes = parseStacScenes(
      stacResponse([
        {
          id: 'no-visual',
          properties: { datetime: '2023-06-01T10:00:00Z', 'eo:cloud_cover': 5 },
          assets: {},
        },
      ]),
    )
    expect(scenes).toEqual([])
  })

  it('returns an empty list for a malformed response', () => {
    expect(parseStacScenes(null)).toEqual([])
    expect(parseStacScenes({})).toEqual([])
  })
})

describe('searchSentinel2Scenes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the AOI geometry and returns parsed scenes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          stacResponse([
            {
              id: 'scene-1',
              properties: { datetime: '2023-06-01T10:00:00Z', 'eo:cloud_cover': 10 },
              assets: { visual: { href: 'https://example.com/scene-1.tif' } },
            },
          ]),
        ),
    })
    vi.stubGlobal('fetch', fetchMock)

    const scenes = await searchSentinel2Scenes(AOI_POLYGON)

    expect(scenes).toHaveLength(1)
    expect(scenes[0].id).toBe('scene-1')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('earth-search.aws.element84.com')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.intersects).toEqual(AOI_POLYGON)
    expect(body.collections).toEqual(['sentinel-2-l2a'])
  })

  it('throws a German error message when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(searchSentinel2Scenes(AOI_POLYGON)).rejects.toThrow(/fehlgeschlagen/)
  })
})
