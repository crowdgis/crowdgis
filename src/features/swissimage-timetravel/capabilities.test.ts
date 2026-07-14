import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSwissimageTimes, parseSwissimageTimes } from './capabilities'

const CAPABILITIES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1">
  <Contents>
    <Layer>
      <ows:Title>Landeskarte</ows:Title>
      <ows:Identifier>ch.swisstopo.pixelkarte-farbe</ows:Identifier>
    </Layer>
    <Layer>
      <ows:Title>SWISSIMAGE Product</ows:Title>
      <ows:Identifier>ch.swisstopo.swissimage-product</ows:Identifier>
      <Dimension>
        <ows:Identifier>Time</ows:Identifier>
        <Default>current</Default>
        <Value>current</Value>
        <Value>2023</Value>
        <Value>1998</Value>
        <Value>1946</Value>
      </Dimension>
    </Layer>
  </Contents>
</Capabilities>`

describe('parseSwissimageTimes', () => {
  it('extracts the Time dimension values, current first, years descending', () => {
    expect(parseSwissimageTimes(CAPABILITIES_XML)).toEqual([
      'current',
      '2023',
      '1998',
      '1946',
    ])
  })

  it('falls back to current when the layer is missing', () => {
    expect(parseSwissimageTimes('<Capabilities><Contents/></Capabilities>')).toEqual([
      'current',
    ])
  })

  it('falls back to current when the layer has no Time dimension', () => {
    const xml = `<Capabilities xmlns:ows="http://www.opengis.net/ows/1.1"><Contents><Layer><ows:Identifier>ch.swisstopo.swissimage-product</ows:Identifier></Layer></Contents></Capabilities>`
    expect(parseSwissimageTimes(xml)).toEqual(['current'])
  })
})

describe('fetchSwissimageTimes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves the parsed times on a successful fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(CAPABILITIES_XML),
      }),
    )
    expect(await fetchSwissimageTimes()).toEqual([
      'current',
      '2023',
      '1998',
      '1946',
    ])
  })

  it('falls back to current on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await fetchSwissimageTimes()).toEqual(['current'])
  })

  it('falls back to current on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await fetchSwissimageTimes()).toEqual(['current'])
  })
})
