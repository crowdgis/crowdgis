import { create } from 'zustand'
import { fetchGwrBuildings, type GwrBuilding } from './api'

interface GwrBuildingsState {
  /** Whether the polygon draw interaction is currently active on the map. */
  drawing: boolean
  setDrawing: (drawing: boolean) => void
  loading: boolean
  error: string | null
  /** null = no area queried yet; [] = queried, no buildings found. */
  buildings: GwrBuilding[] | null
  /** Monotonic token bumped by `clear()`; the map's draw tool clears its polygon on change. */
  clearToken: number
  runQuery: (
    rings: number[][][],
    extent: [number, number, number, number],
  ) => Promise<void>
  clear: () => void
}

export const useGwrBuildingsStore = create<GwrBuildingsState>((set) => ({
  drawing: false,
  setDrawing: (drawing) => set({ drawing }),
  loading: false,
  error: null,
  buildings: null,
  clearToken: 0,
  runQuery: async (rings, extent) => {
    set({ loading: true, error: null })
    try {
      const buildings = await fetchGwrBuildings(rings, extent)
      set({ buildings, loading: false })
    } catch (e) {
      set({
        buildings: null,
        loading: false,
        error:
          e instanceof Error ? e.message : 'GWR-Abfrage fehlgeschlagen.',
      })
    }
  },
  clear: () =>
    set((s) => ({
      buildings: null,
      error: null,
      loading: false,
      clearToken: s.clearToken + 1,
    })),
}))
