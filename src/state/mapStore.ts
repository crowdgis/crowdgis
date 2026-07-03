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
}

export const useMapStore = create<MapState>((set) => ({
  basemapId: 'osm',
  setBasemapId: (id) => set({ basemapId: id }),
  mousePosition: null,
  setMousePosition: (pos) => set({ mousePosition: pos }),
}))
