import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_OPEN, isPanelOpen, usePanelStore } from './panelStore'

beforeEach(() => {
  localStorage.removeItem('crowdgis-panels')
  usePanelStore.setState({ mode: 'stack', open: {}, activeRailId: null })
})

describe('isPanelOpen', () => {
  it('opens core panels by default, everything else starts closed', () => {
    for (const id of DEFAULT_OPEN) {
      expect(isPanelOpen({}, id)).toBe(true)
    }
    expect(isPanelOpen({}, 'measure')).toBe(false)
    // Future student features are unknown ids — they must start closed.
    expect(isPanelOpen({}, 'some-future-student-feature')).toBe(false)
  })

  it('explicit user choices win over the defaults', () => {
    expect(isPanelOpen({ 'data-import': false }, 'data-import')).toBe(false)
    expect(isPanelOpen({ measure: true }, 'measure')).toBe(true)
  })
})

describe('panelStore', () => {
  it('togglePanel flips relative to the effective state', () => {
    usePanelStore.getState().togglePanel('measure')
    expect(isPanelOpen(usePanelStore.getState().open, 'measure')).toBe(true)

    usePanelStore.getState().togglePanel('data-import')
    expect(isPanelOpen(usePanelStore.getState().open, 'data-import')).toBe(
      false,
    )
  })

  it('toggleRailPanel shows one panel and closes it on the second click', () => {
    usePanelStore.getState().toggleRailPanel('layer-manager')
    expect(usePanelStore.getState().activeRailId).toBe('layer-manager')

    usePanelStore.getState().toggleRailPanel('measure')
    expect(usePanelStore.getState().activeRailId).toBe('measure')

    usePanelStore.getState().toggleRailPanel('measure')
    expect(usePanelStore.getState().activeRailId).toBeNull()
  })

  it('persists mode and choices to localStorage', () => {
    usePanelStore.getState().setMode('rail')
    usePanelStore.getState().togglePanel('measure')

    const raw = localStorage.getItem('crowdgis-panels')
    expect(raw).not.toBeNull()
    const stored = JSON.parse(raw!) as {
      state: { mode: string; open: Record<string, boolean> }
    }
    expect(stored.state.mode).toBe('rail')
    expect(stored.state.open.measure).toBe(true)
  })
})
