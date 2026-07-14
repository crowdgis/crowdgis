import { create } from 'zustand'
import type { Polygon } from 'geojson'
import type { Sentinel2Scene } from './api'

interface Sentinel2TimetravelState {
  /** Whether the AOI polygon draw tool is active on the map. */
  drawing: boolean
  /** Area of interest drawn by the student, in WGS84 GeoJSON. */
  aoi: Polygon | null
  /** Scenes found for the current AOI, sorted by ascending cloud cover. */
  scenes: Sentinel2Scene[]
  /** Id of the scene currently shown on the map, if any. */
  selectedSceneId: string | null
  /** Whether a search request is in flight. */
  loading: boolean
  /** Message to show when the last search failed; null otherwise. */
  error: string | null
  /** Opacity of the displayed scene layer. */
  opacity: number
  setDrawing: (drawing: boolean) => void
  setAoi: (aoi: Polygon | null) => void
  setScenes: (scenes: Sentinel2Scene[]) => void
  setSelectedSceneId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOpacity: (opacity: number) => void
  /** Clears the AOI and any search results, e.g. to draw a new area. */
  reset: () => void
}

export const useSentinel2TimetravelStore = create<Sentinel2TimetravelState>(
  (set) => ({
    drawing: false,
    aoi: null,
    scenes: [],
    selectedSceneId: null,
    loading: false,
    error: null,
    opacity: 1,
    setDrawing: (drawing) => set({ drawing }),
    setAoi: (aoi) => set({ aoi }),
    // Selecting the least cloudy scene by default saves the student a click —
    // scenes arrive pre-sorted by ascending cloud cover (see api.ts).
    setScenes: (scenes) => set({ scenes, selectedSceneId: scenes[0]?.id ?? null }),
    setSelectedSceneId: (selectedSceneId) => set({ selectedSceneId }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setOpacity: (opacity) => set({ opacity }),
    reset: () =>
      set({ aoi: null, scenes: [], selectedSceneId: null, error: null, loading: false }),
  }),
)
