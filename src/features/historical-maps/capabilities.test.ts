import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchHistoricalMapsCapabilities,
  parseHistoricalMapsFormat,
  parseHistoricalMapsTimes,
} from './capabilities'

const CAPABILITIES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1">
  <Contents>
    <Layer>
      <ows:Title>Landeskarte</ows:Title>
      <ows:Identifier>ch.swisstopo.pixelkarte-farbe</ows:Identifier>
    </Layer>
    <Layer>
      <ows:Title>Zeitreihen</ows:Title>
      <ows:Identifier>ch.swisstopo.zeitreihen</ows:Identifier>
      <Format>image/png</Format>
      <Dimension>
        <ows:Identifier>Time</ows:Identifier>
        <Default>2023</Default>
        <Value>2023</Value>
        <Value>1935</Value>
        <Value>1864</Value>
      </Dimension>
    </Layer>
  </Contents>
</Capabilities>`

describe('parseHistoricalMapsTimes', () => {
  it('extracts the Time dimension values, years descending', () => {
    expect(parseHistoricalMapsTimes(CAPABILITIES_XML)).toEqual([
      '2023',
      '1935',
      '1864',
    ])
  })

  it('falls back to current when the layer is missing', () => {
    expect(
      parseHistoricalMapsTimes('<Capabilities><Contents/></Capabilities>'),
    ).toEqual(['current'])
  })

  it('falls back to current when the layer has no Time dimension', () => {
    const xml = `<Capabilities xmlns:ows="http://www.opengis.net/ows/1.1"><Contents><Layer><ows:Identifier>ch.swisstopo.zeitreihen</ows:Identifier></Layer></Contents></Capabilities>`
    expect(parseHistoricalMapsTimes(xml)).toEqual(['current'])
  })
})

describe('parseHistoricalMapsFormat', () => {
  it('extracts the tile format', () => {
    expect(parseHistoricalMapsFormat(CAPABILITIES_XML)).toBe('image/png')
  })

  it('falls back to the default format when the layer is missing', () => {
    expect(
      parseHistoricalMapsFormat('<Capabilities><Contents/></Capabilities>'),
    ).toBe('image/png')
  })
})

describe('fetchHistoricalMapsCapabilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves the parsed times and format on a successful fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(CAPABILITIES_XML),
      }),
    )
    expect(await fetchHistoricalMapsCapabilities()).toEqual({
      times: ['2023', '1935', '1864'],
      format: 'image/png',
    })
  })

  it('falls back to current/png on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await fetchHistoricalMapsCapabilities()).toEqual({
      times: ['current'],
      format: 'image/png',
    })
  })

  it('falls back to current/png on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await fetchHistoricalMapsCapabilities()).toEqual({
      times: ['current'],
      format: 'image/png',
    })
  })
})
