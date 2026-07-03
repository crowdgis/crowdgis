import { create } from 'zustand'
import type { Feature } from 'geojson'

interface SketchState {
  /** Current sketched geometries, mirrored from the Leaflet-Geoman layers. */
  features: Feature[]
  setFeatures: (features: Feature[]) => void
  /** Monotonic token; incremented to ask the map to remove all sketches. */
  clearToken: number
  requestClear: () => void
}

export const useSketchStore = create<SketchState>((set) => ({
  features: [],
  setFeatures: (features) => set({ features }),
  clearToken: 0,
  requestClear: () => set((s) => ({ clearToken: s.clearToken + 1 })),
}))
