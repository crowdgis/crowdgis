import { create } from 'zustand'

interface SwissimageTimetravelState {
  /** Whether the SwissImage time-travel layer is shown on the map. */
  visible: boolean
  /** Layer opacity, 0 (fully transparent) to 1 (opaque background). */
  opacity: number
  /** Selected WMTS Time dimension value: 'current' or a year from swisstopo. */
  time: string
  /** Years reported by swisstopo's WMTS capabilities, 'current' first. */
  availableTimes: string[]
  setVisible: (visible: boolean) => void
  setOpacity: (opacity: number) => void
  setTime: (time: string) => void
  setAvailableTimes: (times: string[]) => void
}

export const useSwissimageTimetravelStore = create<SwissimageTimetravelState>(
  (set) => ({
    visible: false,
    opacity: 1,
    time: 'current',
    availableTimes: ['current'],
    setVisible: (visible) => set({ visible }),
    setOpacity: (opacity) => set({ opacity }),
    setTime: (time) => set({ time }),
    setAvailableTimes: (availableTimes) => set({ availableTimes }),
  }),
)
