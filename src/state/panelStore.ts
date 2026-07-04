import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Sidebar panel state: which panels are open and how the sidebar is
 * displayed. Persisted to localStorage so a user's arrangement survives
 * reloads. Feature modules know nothing about this — the core wraps
 * every SidebarPanel in a frame driven by this store.
 */

export type PanelMode = 'stack' | 'rail'

/**
 * Panels that are open on a first visit: the core workflow almost every
 * session needs. Everything else — especially future student features —
 * starts collapsed so the sidebar stays readable as the app grows.
 */
export const DEFAULT_OPEN = ['data-import', 'layer-manager']

/** Open state of a panel: explicit user choice first, defaults second. */
export function isPanelOpen(
  open: Record<string, boolean>,
  id: string,
): boolean {
  return open[id] ?? DEFAULT_OPEN.includes(id)
}

interface PanelState {
  /** 'stack': collapsible sections; 'rail': narrow icon bar + one panel. */
  mode: PanelMode
  /** Explicit per-panel choices; ids not listed fall back to DEFAULT_OPEN. */
  open: Record<string, boolean>
  /** The single panel shown next to the icon rail, null = none. */
  activeRailId: string | null
  setMode: (mode: PanelMode) => void
  togglePanel: (id: string) => void
  toggleRailPanel: (id: string) => void
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      mode: 'stack',
      open: {},
      activeRailId: null,
      setMode: (mode) => set({ mode }),
      togglePanel: (id) =>
        set((s) => ({ open: { ...s.open, [id]: !isPanelOpen(s.open, id) } })),
      toggleRailPanel: (id) =>
        set((s) => ({ activeRailId: s.activeRailId === id ? null : id })),
    }),
    { name: 'crowdgis-panels' },
  ),
)
