import type { ReactNode } from 'react'

interface PanelFrameProps {
  id: string
  label: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

/**
 * Collapsible frame around a feature's SidebarPanel. The core renders
 * this for every panel; features only supply the content inside.
 */
export function PanelFrame({
  id,
  label,
  open,
  onToggle,
  children,
}: PanelFrameProps) {
  const contentId = `panel-${id}`
  return (
    <section className="border-b border-hairline py-1 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-2 rounded-[3px] px-1 py-1.5 text-left hover:bg-paper"
      >
        <span className="label-micro transition-colors group-hover:text-ink">
          {label}
        </span>
        <span
          aria-hidden
          className="text-[10px] leading-none text-stone group-hover:text-ink"
        >
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <div id={contentId} className="px-1 pt-1 pb-2">
          {children}
        </div>
      )}
    </section>
  )
}
