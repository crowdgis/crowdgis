import { create } from 'zustand'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'
import * as history from './history'
import { DEFAULT_STYLE, type SketchStyle } from './style'
import { rebuildLayers, readFeatures, type LabelMode, type SketchHooks, type SketchLayer } from './layers'

interface SelectedLayer {
  layer: SketchLayer
  style: SketchStyle
}

interface SketchToolState {
  /** Set once by the map slot on mount; needed to rebuild layers for undo/redo. */
  map: L.Map | null
  setMap: (map: L.Map | null) => void

  /** Color/weight applied to newly drawn shapes. */
  presetStyle: SketchStyle
  setPresetStyle: (style: SketchStyle) => void

  labelMode: LabelMode
  setLabelMode: (mode: LabelMode) => void

  selected: SelectedLayer | null
  select: (layer: SketchLayer, style: SketchStyle) => void
  clearSelection: () => void

  history: history.HistoryState
  recordSnapshot: (features: Feature[]) => void
  requestUndo: () => void
  requestRedo: () => void
}

export const useSketchToolStore = create<SketchToolState>((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),

  presetStyle: DEFAULT_STYLE,
  setPresetStyle: (style) => set({ presetStyle: style }),

  labelMode: 'none',
  setLabelMode: (mode) => set({ labelMode: mode, selected: null }),

  selected: null,
  select: (layer, style) => set({ selected: { layer, style } }),
  clearSelection: () => set({ selected: null }),

  history: history.initialHistory(),
  recordSnapshot: (features) => set((s) => ({ history: history.record(s.history, features) })),

  requestUndo: () => {
    const { map, history: h } = get()
    if (!map || !history.canUndo(h)) return
    const nextHistory = history.undo(h)
    rebuildLayers(map, history.current(nextHistory), sketchHooks())
    useSketchStore.getState().setFeatures(readFeatures(map))
    set({ history: nextHistory, selected: null })
  },

  requestRedo: () => {
    const { map, history: h } = get()
    if (!map || !history.canRedo(h)) return
    const nextHistory = history.redo(h)
    rebuildLayers(map, history.current(nextHistory), sketchHooks())
    useSketchStore.getState().setFeatures(readFeatures(map))
    set({ history: nextHistory, selected: null })
  },
}))

/** Hooks object connecting live Leaflet layer interactions back to this store. */
export function sketchHooks(): SketchHooks {
  return {
    getLabelMode: () => useSketchToolStore.getState().labelMode,
    getPresetStyle: () => useSketchToolStore.getState().presetStyle,
    onSelect: (layer, style) => useSketchToolStore.getState().select(layer, style),
    onChange: (features) => {
      useSketchStore.getState().setFeatures(features)
      useSketchToolStore.getState().recordSnapshot(features)
    },
  }
}
