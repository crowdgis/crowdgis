import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { usePanelStore } from '../state/panelStore'
import { SidebarPanels } from './SidebarPanels'

beforeEach(() => {
  localStorage.removeItem('crowdgis-panels')
  usePanelStore.setState({ mode: 'stack', open: {}, activeRailId: null })
})

describe('SidebarPanels (stack mode)', () => {
  it('opens core panels by default and keeps the rest collapsed', () => {
    render(<SidebarPanels />)

    const ebenen = screen.getByRole('button', { name: 'Ebenen' })
    expect(ebenen).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Noch keine Ebenen geladen/)).toBeInTheDocument()

    const messen = screen.getByRole('button', { name: 'Messen' })
    expect(messen).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Zeichne eine Linie/)).not.toBeInTheDocument()
  })

  it('collapses and expands a panel via its header', () => {
    render(<SidebarPanels />)

    const ebenen = screen.getByRole('button', { name: 'Ebenen' })
    fireEvent.click(ebenen)
    expect(ebenen).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText(/Noch keine Ebenen geladen/),
    ).not.toBeInTheDocument()

    fireEvent.click(ebenen)
    expect(screen.getByText(/Noch keine Ebenen geladen/)).toBeInTheDocument()
  })
})

describe('SidebarPanels (rail mode)', () => {
  it('switches to the icon rail and opens exactly one panel', () => {
    render(<SidebarPanels />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Kompakte Seitenleiste' }),
    )

    // Rail shows one button per panel feature, no panel content yet.
    const ebenenButton = screen.getByRole('button', { name: 'Ebenen' })
    expect(ebenenButton).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByText(/Noch keine Ebenen geladen/),
    ).not.toBeInTheDocument()

    fireEvent.click(ebenenButton)
    expect(ebenenButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Noch keine Ebenen geladen/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ebenen' }),
    ).toBeInTheDocument()

    // Opening another panel replaces the first (exactly one open).
    fireEvent.click(screen.getByRole('button', { name: 'Messen' }))
    expect(
      screen.queryByText(/Noch keine Ebenen geladen/),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Zeichne eine Linie/)).toBeInTheDocument()
  })

  it('falls back to a label monogram when a feature sets no icon', () => {
    usePanelStore.setState({ mode: 'rail' })
    render(<SidebarPanels />)

    // 'Messen' has no icon → monogram 'M'.
    expect(screen.getByRole('button', { name: 'Messen' })).toHaveTextContent(
      'M',
    )
  })

  it('returns to the stacked list', () => {
    usePanelStore.setState({ mode: 'rail' })
    render(<SidebarPanels />)

    fireEvent.click(screen.getByRole('button', { name: 'Breite Seitenleiste' }))
    expect(
      screen.getByRole('button', { name: 'Ebenen' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
