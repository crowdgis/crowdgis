import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useHistoricalMapsStore } from './store'
import historicalMaps from './index'

const Panel = historicalMaps.SidebarPanel!

beforeEach(() => {
  useHistoricalMapsStore.setState({
    visible: false,
    opacity: 1,
    time: '2023',
    availableTimes: ['2023', '1935', '1864'],
    compareEnabled: false,
    compareTime: '1864',
    swipePosition: 50,
  })
})

describe('HistoricalMapsPanel', () => {
  it('toggles the layer on', () => {
    render(<Panel />)
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Historische-Karten-Zeitreise ein-\/ausblenden/,
      }),
    )
    expect(useHistoricalMapsStore.getState().visible).toBe(true)
  })

  it('lists the available editions', () => {
    render(<Panel />)
    const select = screen.getByRole('combobox', { name: /Kartenausgabe/ })
    expect(select).toHaveTextContent('2023')
    expect(select).toHaveTextContent('1935')
    expect(select).toHaveTextContent('1864')
  })

  it('changes the selected edition', () => {
    render(<Panel />)
    fireEvent.change(screen.getByRole('combobox', { name: /Kartenausgabe/ }), {
      target: { value: '1935' },
    })
    expect(useHistoricalMapsStore.getState().time).toBe('1935')
  })

  it('changes the opacity', () => {
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('slider', {
        name: /Transparenz der historischen Karten-Ebene/,
      }),
      { target: { value: '0.5' } },
    )
    expect(useHistoricalMapsStore.getState().opacity).toBe(0.5)
  })

  it('hides the compare controls until compare mode is enabled', () => {
    render(<Panel />)
    expect(
      screen.queryByRole('combobox', { name: /Vergleichs-Kartenausgabe/ }),
    ).not.toBeInTheDocument()
  })

  it('enables compare mode and reveals the compare edition and swipe controls', () => {
    useHistoricalMapsStore.setState({ visible: true })
    render(<Panel />)
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Vergleichsmodus ein-\/ausschalten/ }),
    )
    expect(useHistoricalMapsStore.getState().compareEnabled).toBe(true)
    expect(
      screen.getByRole('combobox', { name: /Vergleichs-Kartenausgabe/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('slider', { name: /Swipe-Position/ }),
    ).toBeInTheDocument()
  })

  it('changes the compare edition', () => {
    useHistoricalMapsStore.setState({ visible: true, compareEnabled: true })
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('combobox', { name: /Vergleichs-Kartenausgabe/ }),
      { target: { value: '1935' } },
    )
    expect(useHistoricalMapsStore.getState().compareTime).toBe('1935')
  })

  it('changes the swipe position', () => {
    useHistoricalMapsStore.setState({ visible: true, compareEnabled: true })
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('slider', { name: /Swipe-Position/ }),
      { target: { value: '30' } },
    )
    expect(useHistoricalMapsStore.getState().swipePosition).toBe(30)
  })
})
