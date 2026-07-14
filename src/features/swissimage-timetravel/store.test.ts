import { beforeEach, describe, expect, it } from 'vitest'
import { useSwissimageTimetravelStore } from './store'

beforeEach(() => {
  useSwissimageTimetravelStore.setState({
    visible: false,
    opacity: 1,
    time: 'current',
    availableTimes: ['current'],
    compareEnabled: false,
    compareTime: 'current',
    swipePosition: 50,
  })
})

describe('setAvailableTimes', () => {
  it('defaults the compare year to the oldest year distinct from the primary year', () => {
    useSwissimageTimetravelStore
      .getState()
      .setAvailableTimes(['current', '2023', '1998', '1946'])
    expect(useSwissimageTimetravelStore.getState().compareTime).toBe('1946')
  })

  it('keeps the current compare year when it is still available', () => {
    useSwissimageTimetravelStore.setState({ compareTime: '2023' })
    useSwissimageTimetravelStore
      .getState()
      .setAvailableTimes(['current', '2023', '1998'])
    expect(useSwissimageTimetravelStore.getState().compareTime).toBe('2023')
  })
})

describe('setSwipePosition', () => {
  it('clamps the position to the 0-100 range', () => {
    useSwissimageTimetravelStore.getState().setSwipePosition(150)
    expect(useSwissimageTimetravelStore.getState().swipePosition).toBe(100)
    useSwissimageTimetravelStore.getState().setSwipePosition(-10)
    expect(useSwissimageTimetravelStore.getState().swipePosition).toBe(0)
  })
})
