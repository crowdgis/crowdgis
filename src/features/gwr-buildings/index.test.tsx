import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGwrBuildingsStore } from './store'
import gwrBuildings from './index'

const SidebarPanel = gwrBuildings.SidebarPanel!
const BottomPanel = gwrBuildings.BottomPanel!

beforeEach(() => {
  useGwrBuildingsStore.setState({
    drawing: false,
    loading: false,
    error: null,
    buildings: null,
    clearToken: 0,
  })
})

describe('GwrSidebarPanel', () => {
  it('invites to draw an area when nothing was queried yet', () => {
    render(<SidebarPanel />)
    expect(screen.getByText(/Zeichne mit dem/)).toBeInTheDocument()
  })

  it('shows the loading state while a query is in flight', () => {
    useGwrBuildingsStore.setState({ loading: true })
    render(<SidebarPanel />)
    expect(screen.getByText('Lade GWR-Daten…')).toBeInTheDocument()
  })

  it('shows the error message on a failed query', () => {
    useGwrBuildingsStore.setState({ error: 'GWR-Abfrage fehlgeschlagen (Status 500).' })
    render(<SidebarPanel />)
    expect(
      screen.getByText('GWR-Abfrage fehlgeschlagen (Status 500).'),
    ).toBeInTheDocument()
  })

  it('shows the count and offers CSV export and clearing when buildings were found', () => {
    useGwrBuildingsStore.setState({ buildings: [{ egid: '1' }, { egid: '2' }] })
    render(<SidebarPanel />)
    expect(screen.getByText('2 Gebäude gefunden')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Als CSV exportieren' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Gebiet löschen' }))
    expect(useGwrBuildingsStore.getState().buildings).toBeNull()
    expect(useGwrBuildingsStore.getState().clearToken).toBe(1)
  })

  it('reports when no buildings were found in the drawn area', () => {
    useGwrBuildingsStore.setState({ buildings: [] })
    render(<SidebarPanel />)
    expect(
      screen.getByText('Keine Gebäude im gezeichneten Gebiet gefunden.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Als CSV exportieren' })).toBeDisabled()
  })
})

describe('GwrBottomPanel', () => {
  it('renders nothing when no buildings were queried', () => {
    const { container } = render(<BottomPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the query found no buildings', () => {
    useGwrBuildingsStore.setState({ buildings: [] })
    const { container } = render(<BottomPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists every attribute column found across the buildings', () => {
    useGwrBuildingsStore.setState({
      buildings: [
        { egid: '1', strname: 'Technikumstrasse' },
        { egid: '2', gbaup: '8021' },
      ],
    })
    render(<BottomPanel />)
    expect(screen.getByText('egid')).toBeInTheDocument()
    expect(screen.getByText('strname')).toBeInTheDocument()
    expect(screen.getByText('gbaup')).toBeInTheDocument()
    expect(screen.getByText('Technikumstrasse')).toBeInTheDocument()
    expect(screen.getAllByText('–')).toHaveLength(2)
  })
})
