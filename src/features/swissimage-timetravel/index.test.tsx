import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSwissimageTimetravelStore } from './store'
import swissimageTimetravel from './index'

const Panel = swissimageTimetravel.SidebarPanel!

beforeEach(() => {
  useSwissimageTimetravelStore.setState({
    visible: false,
    opacity: 1,
    time: 'current',
    availableTimes: ['current', '2023', '1998'],
    compareEnabled: false,
    compareTime: '1998',
    swipePosition: 50,
  })
})

describe('SwissimageTimetravelPanel', () => {
  it('toggles the layer on', () => {
    render(<Panel />)
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /SwissImage-Zeitreise ein-\/ausblenden/,
      }),
    )
    expect(useSwissimageTimetravelStore.getState().visible).toBe(true)
  })

  it('lists the available years with German labels', () => {
    render(<Panel />)
    const select = screen.getByRole('combobox', { name: /Aufnahmejahr/ })
    expect(select).toHaveTextContent('Aktuell')
    expect(select).toHaveTextContent('2023')
    expect(select).toHaveTextContent('1998')
  })

  it('changes the selected year', () => {
    render(<Panel />)
    fireEvent.change(screen.getByRole('combobox', { name: /Aufnahmejahr/ }), {
      target: { value: '2023' },
    })
    expect(useSwissimageTimetravelStore.getState().time).toBe('2023')
  })

  it('changes the opacity', () => {
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('slider', { name: /Transparenz der Luftbild-Ebene/ }),
      { target: { value: '0.5' } },
    )
    expect(useSwissimageTimetravelStore.getState().opacity).toBe(0.5)
  })

  it('hides the compare controls until compare mode is enabled', () => {
    render(<Panel />)
    expect(
      screen.queryByRole('combobox', { name: /Vergleichsjahr/ }),
    ).not.toBeInTheDocument()
  })

  it('enables compare mode and reveals the compare year and swipe controls', () => {
    useSwissimageTimetravelStore.setState({ visible: true })
    render(<Panel />)
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Vergleichsmodus ein-\/ausschalten/ }),
    )
    expect(useSwissimageTimetravelStore.getState().compareEnabled).toBe(true)
    expect(
      screen.getByRole('combobox', { name: /Vergleichsjahr/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('slider', { name: /Swipe-Position/ }),
    ).toBeInTheDocument()
  })

  it('changes the compare year', () => {
    useSwissimageTimetravelStore.setState({ visible: true, compareEnabled: true })
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('combobox', { name: /Vergleichsjahr/ }),
      { target: { value: '2023' } },
    )
    expect(useSwissimageTimetravelStore.getState().compareTime).toBe('2023')
  })

  it('changes the swipe position', () => {
    useSwissimageTimetravelStore.setState({ visible: true, compareEnabled: true })
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('slider', { name: /Swipe-Position/ }),
      { target: { value: '30' } },
    )
    expect(useSwissimageTimetravelStore.getState().swipePosition).toBe(30)
  })
})
