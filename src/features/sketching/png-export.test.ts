import { describe, expect, it } from 'vitest'
import { includeNode } from './png-export'

function nodeWithClasses(...classes: string[]): Element {
  const el = document.createElement('div')
  el.className = classes.join(' ')
  return el
}

describe('includeNode', () => {
  it('excludes leaflet controls in both export modes', () => {
    const controls = nodeWithClasses('leaflet-control-container')
    expect(includeNode(controls, 'drawing')).toBe(false)
    expect(includeNode(controls, 'map')).toBe(false)
  })

  it('excludes the basemap tile pane only for the drawing-only export', () => {
    const tiles = nodeWithClasses('leaflet-tile-pane')
    expect(includeNode(tiles, 'drawing')).toBe(false)
    expect(includeNode(tiles, 'map')).toBe(true)
  })

  it('keeps unrelated nodes in both modes', () => {
    const overlay = nodeWithClasses('leaflet-overlay-pane')
    expect(includeNode(overlay, 'drawing')).toBe(true)
    expect(includeNode(overlay, 'map')).toBe(true)
  })
})
