import { create } from 'zustand'

type View = { kind: 'board' } | { kind: 'form' } | { kind: 'detail'; number: number }

interface RequestsUiState {
  open: boolean
  view: View
  /**
   * Issue number the student just confirmed via the mail link
   * (?bestaetigt=N). The board shows a success banner, polls until the
   * request appears and highlights its row. One-time signal per page load.
   */
  confirmedNumber: number | null
  setOpen: (open: boolean) => void
  show: (view: View) => void
}

/** Initial view from the URL (mail links: ?request=123, ?bestaetigt=123). */
function initialFromUrl(): Pick<
  RequestsUiState,
  'open' | 'view' | 'confirmedNumber'
> {
  const params = new URLSearchParams(window.location.search)

  const requestNumber = Number(params.get('request'))
  if (Number.isInteger(requestNumber) && requestNumber > 0) {
    return {
      open: true,
      view: { kind: 'detail', number: requestNumber },
      confirmedNumber: null,
    }
  }

  if (params.has('bestaetigt')) {
    const confirmed = Number(params.get('bestaetigt'))
    // One-time event: drop the param so a manual refresh starts clean.
    params.delete('bestaetigt')
    const rest = params.toString()
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (rest ? `?${rest}` : ''),
    )
    return {
      open: true,
      view: { kind: 'board' },
      confirmedNumber:
        Number.isInteger(confirmed) && confirmed > 0 ? confirmed : null,
    }
  }

  return { open: false, view: { kind: 'board' }, confirmedNumber: null }
}

export const useRequestsUi = create<RequestsUiState>((set) => ({
  ...initialFromUrl(),
  setOpen: (open) => set({ open }),
  show: (view) => set({ view, open: true }),
}))
