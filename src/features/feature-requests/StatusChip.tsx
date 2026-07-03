import type { RequestStatus } from '../../../shared/requests'
import { STATUS_LABELS } from '../../../shared/requests'

/** Palette-only status chips in Kartenrand style. */
const CHIP_CLASSES: Record<RequestStatus, string> = {
  eingereicht: 'border-hairline text-stone',
  rueckfrage: 'border-signal text-signal',
  bereit: 'border-ink text-ink',
  freigegeben: 'border-ink text-ink',
  'in-arbeit': 'border-ink text-ink',
  testing: 'border-ink text-ink',
  live: 'border-ink bg-ink text-white',
  verworfen: 'border-hairline text-stone opacity-60',
}

export function StatusChip({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-block rounded-[3px] border px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.1em] uppercase ${CHIP_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
