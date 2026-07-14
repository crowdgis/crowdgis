import { beforeEach, describe, expect, it } from 'vitest'
import { useHistoricalMapsStore } from './store'

beforeEach(() => {
  useHistoricalMapsStore.setState({
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
  it('defaults the compare edition to the oldest one distinct from the primary edition', () => {
    useHistoricalMapsStore
      .getState()
      .setAvailableTimes(['2023', '1935', '1864'])
    expect(useHistoricalMapsStore.getState().compareTime).toBe('1864')
  })

  it('keeps the current compare edition when it is still available', () => {
    useHistoricalMapsStore.setState({ compareTime: '1935' })
    useHistoricalMapsStore
      .getState()
      .setAvailableTimes(['2023', '1935', '1864'])
    expect(useHistoricalMapsStore.getState().compareTime).toBe('1935')
  })
})

describe('setSwipePosition', () => {
  it('clamps the position to the 0-100 range', () => {
    useHistoricalMapsStore.getState().setSwipePosition(150)
    expect(useHistoricalMapsStore.getState().swipePosition).toBe(100)
    useHistoricalMapsStore.getState().setSwipePosition(-10)
    expect(useHistoricalMapsStore.getState().swipePosition).toBe(0)
  })
})
