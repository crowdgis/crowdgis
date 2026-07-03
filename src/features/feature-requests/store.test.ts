import { beforeEach, describe, expect, it, vi } from 'vitest'

// The store reads the URL at module evaluation time, so each test
// sets the URL first and then imports a fresh module instance.
async function loadStoreWithUrl(url: string) {
  vi.resetModules()
  window.history.replaceState({}, '', url)
  const { useRequestsUi } = await import('./store')
  return useRequestsUi.getState()
}

describe('requests UI store — URL handling', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('stays closed without params', async () => {
    const state = await loadStoreWithUrl('/')
    expect(state.open).toBe(false)
    expect(state.confirmedNumber).toBeNull()
  })

  it('opens the detail view for ?request=', async () => {
    const state = await loadStoreWithUrl('/?request=42')
    expect(state.open).toBe(true)
    expect(state.view).toEqual({ kind: 'detail', number: 42 })
  })

  it('opens the board with confirmation signal for ?bestaetigt=', async () => {
    const state = await loadStoreWithUrl('/?bestaetigt=17')
    expect(state.open).toBe(true)
    expect(state.view).toEqual({ kind: 'board' })
    expect(state.confirmedNumber).toBe(17)
  })

  it('removes the one-time bestaetigt param from the URL', async () => {
    await loadStoreWithUrl('/?bestaetigt=17')
    expect(window.location.search).not.toContain('bestaetigt')
  })

  it('stores the answer key from mail links and strips it from the URL', async () => {
    localStorage.clear()
    await loadStoreWithUrl('/?request=21&key=geheim-123')
    const { getAnswerKey } = await import('./keys')
    expect(getAnswerKey(21)).toBe('geheim-123')
    expect(window.location.search).not.toContain('key=')
    expect(window.location.search).toContain('request=21')
  })

  it('stores the answer key from the confirm redirect', async () => {
    localStorage.clear()
    await loadStoreWithUrl('/?bestaetigt=22&key=geheim-456')
    const { getAnswerKey } = await import('./keys')
    expect(getAnswerKey(22)).toBe('geheim-456')
  })
})
