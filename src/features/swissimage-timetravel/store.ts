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
  /** Whether the swipe comparison between `time` and `compareTime` is active. */
  compareEnabled: boolean
  /** WMTS Time dimension value shown on the right side of the swipe. */
  compareTime: string
  /** Swipe handle position, 0 (left edge) to 100 (right edge) of the map. */
  swipePosition: number
  setVisible: (visible: boolean) => void
  setOpacity: (opacity: number) => void
  setTime: (time: string) => void
  setAvailableTimes: (times: string[]) => void
  setCompareEnabled: (enabled: boolean) => void
  setCompareTime: (time: string) => void
  setSwipePosition: (position: number) => void
}

export const useSwissimageTimetravelStore = create<SwissimageTimetravelState>(
  (set) => ({
    visible: false,
    opacity: 1,
    time: 'current',
    availableTimes: ['current'],
    compareEnabled: false,
    compareTime: 'current',
    swipePosition: 50,
    setVisible: (visible) => set({ visible }),
    setOpacity: (opacity) => set({ opacity }),
    setTime: (time) => set({ time }),
    setAvailableTimes: (availableTimes) =>
      set((state) => ({
        availableTimes,
        // Default the comparison year to the oldest available year distinct
        // from `time`, so enabling compare mode immediately shows a
        // meaningful then-vs-now swipe instead of two identical years.
        // Once the two diverge (or the user picked one explicitly), keep it.
        compareTime:
          state.compareTime !== state.time &&
          availableTimes.includes(state.compareTime)
            ? state.compareTime
            : (availableTimes.filter((t) => t !== state.time).pop() ??
              availableTimes[0] ??
              'current'),
      })),
    setCompareEnabled: (compareEnabled) => set({ compareEnabled }),
    setCompareTime: (compareTime) => set({ compareTime }),
    setSwipePosition: (swipePosition) =>
      set({ swipePosition: Math.min(100, Math.max(0, swipePosition)) }),
  }),
)
