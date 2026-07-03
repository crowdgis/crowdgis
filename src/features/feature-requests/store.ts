import { create } from 'zustand'

type View = { kind: 'board' } | { kind: 'form' } | { kind: 'detail'; number: number }

interface RequestsUiState {
  open: boolean
  view: View
  setOpen: (open: boolean) => void
  show: (view: View) => void
}

/** Initial view from the URL (mail links: ?request=123). */
function initialFromUrl(): Pick<RequestsUiState, 'open' | 'view'> {
  const params = new URLSearchParams(window.location.search)
  const requestNumber = Number(params.get('request'))
  if (Number.isInteger(requestNumber) && requestNumber > 0) {
    return { open: true, view: { kind: 'detail', number: requestNumber } }
  }
  if (params.has('bestaetigt')) {
    return { open: true, view: { kind: 'board' } }
  }
  return { open: false, view: { kind: 'board' } }
}

export const useRequestsUi = create<RequestsUiState>((set) => ({
  ...initialFromUrl(),
  setOpen: (open) => set({ open }),
  show: (view) => set({ view, open: true }),
}))
