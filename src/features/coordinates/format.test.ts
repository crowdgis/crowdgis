import { describe, expect, it } from 'vitest'
import { formatLv95, formatWgs84 } from './format'

describe('formatWgs84', () => {
  it('formats a position in Switzerland', () => {
    expect(formatWgs84(47.378177, 8.540192)).toBe('47.37818°N 8.54019°E')
  })

  it('handles southern and western hemispheres', () => {
    expect(formatWgs84(-33.9, -70.6)).toBe('33.90000°S 70.60000°W')
  })
})

describe('formatLv95', () => {
  it('formats a Zurich position with Swiss thousands separators', () => {
    // Official LV95 reference: E 2'683'188.018 / N 1'248'065.982 (swisstopo REFRAME)
    expect(formatLv95(47.378177, 8.540192)).toBe("2'683'188 / 1'248'066")
  })

  it('returns null outside the LV95 area', () => {
    expect(formatLv95(52.52, 13.4)).toBeNull()
  })
})
