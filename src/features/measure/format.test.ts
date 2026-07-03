import { describe, expect, it } from 'vitest'
import { formatArea, formatLength } from './format'

describe('formatLength', () => {
  it('uses meters below 1 km', () => {
    expect(formatLength(845.4)).toBe('845 m')
  })

  it('uses kilometers with Swiss separators above 1 km', () => {
    expect(formatLength(12_345)).toBe('12.35 km')
    expect(formatLength(1_234_567)).toBe("1'234.57 km")
  })
})

describe('formatArea', () => {
  it('uses square meters below 1 ha', () => {
    expect(formatArea(850)).toBe('850 m²')
  })

  it('uses hectares between 1 ha and 1 km²', () => {
    expect(formatArea(25_000)).toBe('2.50 ha')
  })

  it('uses square kilometers above 1 km²', () => {
    expect(formatArea(12_340_000)).toBe('12.34 km²')
  })
})
