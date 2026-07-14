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
})
