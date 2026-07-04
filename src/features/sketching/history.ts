import type { Feature } from 'geojson'

/** Undo/redo stack of full sketch snapshots. `entries[index]` is the current state. */
export interface HistoryState {
  entries: Feature[][]
  index: number
}

export function initialHistory(): HistoryState {
  return { entries: [[]], index: 0 }
}

/** Records a new snapshot, discarding any redo-able future. */
export function record(state: HistoryState, snapshot: Feature[]): HistoryState {
  const entries = [...state.entries.slice(0, state.index + 1), snapshot]
  return { entries, index: entries.length - 1 }
}

export function canUndo(state: HistoryState): boolean {
  return state.index > 0
}

export function canRedo(state: HistoryState): boolean {
  return state.index < state.entries.length - 1
}

export function undo(state: HistoryState): HistoryState {
  return canUndo(state) ? { ...state, index: state.index - 1 } : state
}

export function redo(state: HistoryState): HistoryState {
  return canRedo(state) ? { ...state, index: state.index + 1 } : state
}

export function current(state: HistoryState): Feature[] {
  return state.entries[state.index]
}
