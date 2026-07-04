import { create } from 'zustand'

interface SessionPersistenceState {
  /** Epoch ms of the last successful save, null before the first save. */
  lastSavedAt: number | null
  /** Monotonic token; bumped by the manual save button. */
  saveToken: number
  requestSave: () => void
  markSaved: (at: number) => void
}

export const useSessionPersistenceStore = create<SessionPersistenceState>((set) => ({
  lastSavedAt: null,
  saveToken: 0,
  requestSave: () => set((s) => ({ saveToken: s.saveToken + 1 })),
  markSaved: (at) => set({ lastSavedAt: at }),
}))
