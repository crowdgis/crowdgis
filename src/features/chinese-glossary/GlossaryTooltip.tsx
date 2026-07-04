import { useGlossaryHover } from './useGlossaryHover'

const OFFSET = 14
const TOOLTIP_WIDTH = 240

/** Floating Chinese explanation that follows the cursor over a known term. */
export function GlossaryTooltip() {
  const hover = useGlossaryHover()
  if (!hover) return null

  const left = Math.min(hover.x + OFFSET, window.innerWidth - TOOLTIP_WIDTH - OFFSET)
  const top = Math.min(hover.y + OFFSET, window.innerHeight - OFFSET * 3)

  return (
    <div
      role="tooltip"
      style={{ position: 'fixed', left, top, width: TOOLTIP_WIDTH }}
      className="pointer-events-none z-[2000] rounded-[3px] border border-hairline bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
    >
      {hover.zh}
    </div>
  )
}
