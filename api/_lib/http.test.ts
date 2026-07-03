import { describe, expect, it } from 'vitest'
import { requestIdFromUrl } from './http.js'

describe('requestIdFromUrl', () => {
  it('extracts the id from a detail URL', () => {
    expect(requestIdFromUrl('https://crowdgis.vercel.app/api/requests/42')).toBe(
      42,
    )
  })

  it('extracts the id from a sub-resource URL', () => {
    expect(
      requestIdFromUrl('https://crowdgis.vercel.app/api/requests/7/upvote'),
    ).toBe(7)
    expect(
      requestIdFromUrl('https://crowdgis.vercel.app/api/requests/7/reply?x=1'),
    ).toBe(7)
  })

  it('rejects non-numeric or missing ids', () => {
    expect(requestIdFromUrl('https://x.app/api/requests/abc')).toBeNull()
    expect(requestIdFromUrl('https://x.app/api/requests')).toBeNull()
    expect(requestIdFromUrl('https://x.app/api/requests/0')).toBeNull()
    expect(requestIdFromUrl('https://x.app/api/requests/-3')).toBeNull()
  })
})
