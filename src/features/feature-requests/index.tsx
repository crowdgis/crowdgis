import type { FeatureModule } from '../types'
import { Board } from './Board'
import { RequestDetail } from './RequestDetail'
import { SubmitForm } from './SubmitForm'
import { useRequestsUi } from './store'

/** Header button that opens the request drawer. */
function HeaderButton() {
  const open = useRequestsUi((s) => s.open)
  const setOpen = useRequestsUi((s) => s.setOpen)
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`rounded-[3px] border px-3 py-1.5 text-sm font-medium ${
        open
          ? 'border-ink bg-ink text-white'
          : 'border-ink text-ink hover:bg-ink hover:text-white'
      }`}
    >
      Feature-Wünsche
    </button>
  )
}

/** Right-side drawer with board, form and detail views. */
function Drawer() {
  const open = useRequestsUi((s) => s.open)
  const view = useRequestsUi((s) => s.view)
  const setOpen = useRequestsUi((s) => s.setOpen)
  const show = useRequestsUi((s) => s.show)

  if (!open) return null

  return (
    <div className="absolute inset-y-0 right-0 z-[1100] flex w-full max-w-md flex-col border-l border-hairline bg-sheet shadow-lg">
      <div className="flex items-center gap-1 border-b border-hairline px-4 py-2">
        <h2 className="label-micro mr-auto">Feature-Wünsche</h2>
        <button
          type="button"
          onClick={() => show({ kind: 'board' })}
          className={`rounded-[3px] px-2 py-1 text-xs ${
            view.kind === 'board' ? 'bg-ink text-white' : 'text-ink hover:bg-paper'
          }`}
        >
          Board
        </button>
        <button
          type="button"
          onClick={() => show({ kind: 'form' })}
          className={`rounded-[3px] px-2 py-1 text-xs ${
            view.kind === 'form' ? 'bg-ink text-white' : 'text-ink hover:bg-paper'
          }`}
        >
          Neuer Wunsch
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Schliessen"
          className="ml-2 rounded-[3px] px-1.5 text-stone hover:text-signal"
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {view.kind === 'board' && <Board />}
        {view.kind === 'form' && <SubmitForm />}
        {view.kind === 'detail' && <RequestDetail number={view.number} />}
      </div>
    </div>
  )
}

const featureRequestsModule: FeatureModule = {
  id: 'feature-requests',
  label: 'Feature-Wünsche',
  HeaderItem: HeaderButton,
  Overlay: Drawer,
}

export default featureRequestsModule
