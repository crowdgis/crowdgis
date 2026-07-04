import { features } from '../features/registry'
import type { FeatureModule } from '../features/types'
import { isPanelOpen, usePanelStore } from '../state/panelStore'
import { PanelFrame } from './PanelFrame'

/** All features that contribute a sidebar panel, in registry order. */
const panelFeatures = features.filter((f) => f.SidebarPanel)

/** Rail icon: the feature's own icon, or a monogram from its label. */
function railIcon(f: FeatureModule): string {
  return f.icon ?? f.label.charAt(0).toUpperCase()
}

/**
 * The left sidebar. Two user-switchable modes, both persisted:
 * - 'stack': every panel as a collapsible section, several may be open
 * - 'rail':  narrow icon bar, exactly one panel opens next to it
 */
export function SidebarPanels() {
  const mode = usePanelStore((s) => s.mode)
  return mode === 'rail' ? <RailSidebar /> : <StackSidebar />
}

function StackSidebar() {
  const open = usePanelStore((s) => s.open)
  const togglePanel = usePanelStore((s) => s.togglePanel)
  const setMode = usePanelStore((s) => s.setMode)

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-hairline bg-sheet p-3">
      <div className="mb-1 flex justify-end">
        <button
          type="button"
          onClick={() => setMode('rail')}
          title="Kompakte Seitenleiste (Icon-Leiste)"
          aria-label="Kompakte Seitenleiste"
          className="rounded-[3px] px-1.5 py-0.5 text-xs leading-none text-stone hover:bg-paper hover:text-ink"
        >
          ⇤
        </button>
      </div>
      {panelFeatures.map((f) => {
        const Panel = f.SidebarPanel!
        return (
          <PanelFrame
            key={f.id}
            id={f.id}
            label={f.label}
            open={isPanelOpen(open, f.id)}
            onToggle={() => togglePanel(f.id)}
          >
            <Panel />
          </PanelFrame>
        )
      })}
    </aside>
  )
}

function RailSidebar() {
  const activeRailId = usePanelStore((s) => s.activeRailId)
  const toggleRailPanel = usePanelStore((s) => s.toggleRailPanel)
  const setMode = usePanelStore((s) => s.setMode)

  const active = panelFeatures.find((f) => f.id === activeRailId) ?? null
  const ActivePanel = active?.SidebarPanel ?? null

  return (
    <aside className="flex shrink-0 border-r border-hairline bg-sheet">
      <div className="flex w-12 flex-col items-center gap-1.5 overflow-y-auto p-1.5">
        <button
          type="button"
          onClick={() => setMode('stack')}
          title="Breite Seitenleiste (Liste)"
          aria-label="Breite Seitenleiste"
          className="flex h-9 w-9 items-center justify-center rounded-[3px] text-stone hover:bg-paper hover:text-ink"
        >
          ⇥
        </button>
        <span aria-hidden className="mb-0.5 block h-px w-7 bg-hairline" />
        {panelFeatures.map((f) => {
          const isActive = f.id === activeRailId
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleRailPanel(f.id)}
              title={f.label}
              aria-label={f.label}
              aria-pressed={isActive}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border font-mono text-xs font-medium uppercase ${
                isActive
                  ? 'border-ink bg-ink text-white'
                  : 'border-hairline text-stone hover:bg-paper hover:text-ink'
              }`}
            >
              {railIcon(f)}
            </button>
          )
        })}
      </div>
      {active && ActivePanel && (
        <div className="flex w-72 flex-col overflow-y-auto border-l border-hairline p-3">
          <h2 className="label-micro mb-2">{active.label}</h2>
          <ActivePanel />
        </div>
      )}
    </aside>
  )
}
