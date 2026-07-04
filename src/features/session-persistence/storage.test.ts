import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppLayer } from '../../state/layerStore'
import { debounce, readSession, serializeSession, writeSession } from './storage'

const vectorLayer: AppLayer = {
  id: 'a',
  name: 'Gemeinden',
  visible: true,
  bounds: null,
  source: { kind: 'vector', geojson: { type: 'FeatureCollection', features: [] } },
}

beforeEach(() => {
  localStorage.clear()
})

describe('serializeSession', () => {
  it('drops the internal layer id and keeps the rest', () => {
    const session = serializeSession({
      basemapId: 'osm',
      view: { center: [47, 8], zoom: 12 },
      layers: [vectorLayer],
      sketches: [],
    })
    expect(session.layers[0]).toEqual({
      name: 'Gemeinden',
      visible: true,
      bounds: null,
      source: vectorLayer.source,
    })
    expect(session.version).toBe(1)
  })
})

describe('writeSession + readSession', () => {
  it('round-trips a session through localStorage', () => {
    const session = serializeSession({
      basemapId: 'osm',
      view: { center: [47, 8], zoom: 12 },
      layers: [vectorLayer],
      sketches: [],
    })
    expect(writeSession(session)).toBe(true)
    expect(readSession()).toEqual(session)
  })

  it('returns null when nothing was saved', () => {
    expect(readSession()).toBeNull()
  })

  it('returns null for corrupt data instead of throwing', () => {
    localStorage.setItem('crowdgis.session.v1', '{not json')
    expect(readSession()).toBeNull()
  })

  it('drops raster layers and retries when storage quota is exceeded', () => {
    const rasterLayer: AppLayer = {
      id: 'b',
      name: 'Orthofoto',
      visible: true,
      bounds: null,
      source: {
        kind: 'raster',
        georaster: {
          width: 1,
          height: 1,
          xmin: 0,
          xmax: 1,
          ymin: 0,
          ymax: 1,
          pixelWidth: 1,
          pixelHeight: 1,
          projection: 4326,
          numberOfRasters: 1,
          noDataValue: null,
          values: [[[0]]],
        },
      },
    }
    const session = serializeSession({
      basemapId: 'osm',
      view: null,
      layers: [vectorLayer, rasterLayer],
      sketches: [],
    })

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })

    expect(writeSession(session)).toBe(true)
    const saved = readSession()
    expect(saved?.layers).toHaveLength(1)
    expect(saved?.layers[0].source.kind).toBe('vector')

    spy.mockRestore()
  })

  it('gives up gracefully when even the minimal session cannot be stored', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const session = serializeSession({ basemapId: 'osm', view: null, layers: [], sketches: [] })
    expect(writeSession(session)).toBe(false)
    spy.mockRestore()
  })
})

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('only invokes the function once after calls settle', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
