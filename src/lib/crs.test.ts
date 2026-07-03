import { describe, expect, it } from 'vitest'
import { isInLv95Area, lv95ToWgs84, wgs84ToLv95 } from './crs'

describe('wgs84ToLv95', () => {
  it('converts the LV95 projection origin (Bern old observatory)', () => {
    // The projection center maps to E 2'600'000 / N 1'200'000 by definition.
    const { east, north } = wgs84ToLv95(46.95108, 7.438637)
    expect(east).toBeCloseTo(2_600_000, -1) // within ~5 m
    expect(north).toBeCloseTo(1_200_000, -1)
  })

  it('converts a Zurich position to official LV95 coordinates', () => {
    // Reference from the official swisstopo REFRAME service:
    // geodesy.geo.admin.ch/reframe/wgs84tolv95?easting=8.540192&northing=47.378177
    const { east, north } = wgs84ToLv95(47.378177, 8.540192)
    expect(east).toBeCloseTo(2_683_188.018, 0) // within 1 m
    expect(north).toBeCloseTo(1_248_065.982, 0)
  })
})

describe('lv95ToWgs84', () => {
  it('is the inverse of wgs84ToLv95', () => {
    const { east, north } = wgs84ToLv95(46.8, 8.2)
    const { lat, lng } = lv95ToWgs84(east, north)
    expect(lat).toBeCloseTo(46.8, 6)
    expect(lng).toBeCloseTo(8.2, 6)
  })
})

describe('isInLv95Area', () => {
  it('accepts positions inside Switzerland', () => {
    expect(isInLv95Area(47.37, 8.54)).toBe(true)
  })

  it('rejects positions far outside Switzerland', () => {
    expect(isInLv95Area(52.52, 13.4)).toBe(false)
  })
})
