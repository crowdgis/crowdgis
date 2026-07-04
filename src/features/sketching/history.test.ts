import { describe, expect, it } from 'vitest'
import type { Feature } from 'geojson'
import { canRedo, canUndo, current, initialHistory, record, redo, undo } from './history'

const point = (id: number): Feature[] => [
  { type: 'Feature', properties: { id }, geometry: { type: 'Point', coordinates: [id, id] } },
]

describe('sketch history', () => {
  it('starts empty and disallows undo/redo', () => {
    const state = initialHistory()
    expect(current(state)).toEqual([])
    expect(canUndo(state)).toBe(false)
    expect(canRedo(state)).toBe(false)
  })

  it('records snapshots and allows undo back to the previous one', () => {
    let state = initialHistory()
    state = record(state, point(1))
    state = record(state, point(2))
    expect(current(state)).toEqual(point(2))

    state = undo(state)
    expect(current(state)).toEqual(point(1))
    expect(canRedo(state)).toBe(true)

    state = undo(state)
    expect(current(state)).toEqual([])
    expect(canUndo(state)).toBe(false)
  })

  it('redo restores what undo removed', () => {
    let state = initialHistory()
    state = record(state, point(1))
    state = undo(state)
    state = redo(state)
    expect(current(state)).toEqual(point(1))
    expect(canRedo(state)).toBe(false)
  })

  it('recording after an undo discards the redo-able future', () => {
    let state = initialHistory()
    state = record(state, point(1))
    state = record(state, point(2))
    state = undo(state)
    state = record(state, point(3))
    expect(current(state)).toEqual(point(3))
    expect(canRedo(state)).toBe(false)
  })

  it('undo/redo are no-ops at the boundaries', () => {
    const state = initialHistory()
    expect(undo(state)).toEqual(state)
    expect(redo(state)).toEqual(state)
  })
})
