import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildIdentifyUrl,
  fetchGwrBuildings,
  parseIdentifyResponse,
} from './api'

const RINGS = [
  [
    [2600000, 1200000],
    [2600100, 1200000],
    [2600100, 1200100],
    [2600000, 1200000],
  ],
]
const EXTENT: [number, number, number, number] = [
  2600000, 1200000, 2600100, 1200100,
]

describe('buildIdentifyUrl', () => {
  it('encodes the polygon geometry and query area for the GWR layer in LV95', () => {
    const url = new URL(buildIdentifyUrl(RINGS, EXTENT))
    const params = url.searchParams
    expect(params.get('geometryType')).toBe('esriGeometryPolygon')
    expect(JSON.parse(params.get('geometry')!)).toEqual({ rings: RINGS })
    expect(params.get('layers')).toBe('all:ch.bfs.gebaeude_wohnungs_register')
    expect(params.get('mapExtent')).toBe('2600000,1200000,2600100,1200100')
    expect(params.get('sr')).toBe('2056')
    expect(params.get('returnGeometry')).toBe('false')
  })
})

describe('parseIdentifyResponse', () => {
  it('extracts attributes from GeoJSON-style results ("properties")', () => {
    const buildings = parseIdentifyResponse({
      results: [{ properties: { egid: '1', gbaup: '8021' } }],
    })
    expect(buildings).toEqual([{ egid: '1', gbaup: '8021' }])
  })

  it('extracts attributes from Esri-style results ("attributes")', () => {
    const buildings = parseIdentifyResponse({
      results: [{ attributes: { egid: '2' } }],
    })
    expect(buildings).toEqual([{ egid: '2' }])
  })

  it('skips malformed entries and returns [] for missing/invalid results', () => {
    expect(parseIdentifyResponse({ results: [null, {}, { properties: 'x' }] })).toEqual(
      [],
    )
    expect(parseIdentifyResponse({})).toEqual([])
    expect(parseIdentifyResponse(null)).toEqual([])
  })
})

describe('fetchGwrBuildings', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves the parsed buildings on a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [{ properties: { egid: '1' } }] }),
      }),
    )
    const buildings = await fetchGwrBuildings(RINGS, EXTENT)
    expect(buildings).toEqual([{ egid: '1' }])
  })

  it('throws a German error message on a failed HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )
    await expect(fetchGwrBuildings(RINGS, EXTENT)).rejects.toThrow('500')
  })
})
