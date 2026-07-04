import { create } from 'zustand'

export interface MousePosition {
  lat: number
  lng: number
}

interface MapState {
  /** Id of the active basemap (see src/features/basemaps). */
  basemapId: string
  setBasemapId: (id: string) => void
  /** Current mouse position on the map, null when the cursor left the map. */
  mousePosition: MousePosition | null
  setMousePosition: (pos: MousePosition | null) => void
  /**
   * Monotonic token bumped by `requestOverview` (see src/features/map-overview).
   * The map's MapSlot watches it to reset the view — a token, rather than a
   * boolean, so repeated clicks re-trigger even if the view didn't change.
   */
  overviewToken: number
  requestOverview: () => void
}

export const useMapStore = create<MapState>((set) => ({
  basemapId: 'osm',
  setBasemapId: (id) => set({ basemapId: id }),
  mousePosition: null,
  setMousePosition: (pos) => set({ mousePosition: pos }),
  overviewToken: 0,
  requestOverview: () => set((s) => ({ overviewToken: s.overviewToken + 1 })),
}))
