import { describe, expect, it } from 'vitest'
import type { Feature } from 'geojson'
import { attachedLabel, escapeHtml, isTextLabel, labelText } from './labels'

const featureWith = (properties: Record<string, unknown>): Feature => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Point', coordinates: [0, 0] },
})

describe('isTextLabel', () => {
  it('is true only when isLabel is exactly true', () => {
    expect(isTextLabel(featureWith({ isLabel: true }))).toBe(true)
    expect(isTextLabel(featureWith({}))).toBe(false)
    expect(isTextLabel(undefined)).toBe(false)
  })
})

describe('labelText', () => {
  it('reads the text of a free-standing label', () => {
    expect(labelText(featureWith({ text: 'Gipfel' }))).toBe('Gipfel')
    expect(labelText(featureWith({}))).toBe('')
  })
})

describe('attachedLabel', () => {
  it('returns the label text when present and non-empty', () => {
    expect(attachedLabel(featureWith({ label: 'Parzelle 12' }))).toBe('Parzelle 12')
  })

  it('returns null when absent or empty', () => {
    expect(attachedLabel(featureWith({}))).toBeNull()
    expect(attachedLabel(featureWith({ label: '' }))).toBeNull()
  })
})

describe('escapeHtml', () => {
  it('escapes markup so label text cannot inject HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
    expect(escapeHtml(`"quoted" & 'single'`)).toBe('&quot;quoted&quot; &amp; &#39;single&#39;')
  })
})
