import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSentinel2TimetravelStore } from './store'
import sentinel2Timetravel from './index'

const Panel = sentinel2Timetravel.SidebarPanel!

const SCENES = [
  { id: 'clear', datetime: '2023-05-01T10:00:00Z', cloudCover: 2, visualUrl: 'a.tif' },
  { id: 'cloudy', datetime: '2023-06-01T10:00:00Z', cloudCover: 80, visualUrl: 'b.tif' },
]

beforeEach(() => {
  useSentinel2TimetravelStore.setState({
    drawing: false,
    aoi: null,
    scenes: [],
    selectedSceneId: null,
    loading: false,
    error: null,
    opacity: 1,
  })
})

describe('Sentinel2Panel', () => {
  it('invites to draw an AOI when none is set', () => {
    render(<Panel />)
    expect(screen.getByText(/Zeichne auf der Karte ein Gebiet/)).toBeInTheDocument()
  })

  it('starts drawing from the sidebar button', () => {
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: /Gebiet zeichnen/ }))
    expect(useSentinel2TimetravelStore.getState().drawing).toBe(true)
  })

  it('shows a loading message while searching', () => {
    useSentinel2TimetravelStore.setState({
      aoi: { type: 'Polygon', coordinates: [] },
      loading: true,
    })
    render(<Panel />)
    expect(screen.getByText(/Suche Aufnahmen/)).toBeInTheDocument()
  })

  it('shows an error message when the search failed', () => {
    useSentinel2TimetravelStore.setState({
      aoi: { type: 'Polygon', coordinates: [] },
      error: 'Keine Sentinel-2-Aufnahmen für dieses Gebiet gefunden.',
    })
    render(<Panel />)
    expect(screen.getByText(/Keine Sentinel-2-Aufnahmen/)).toBeInTheDocument()
  })

  it('lists scenes sorted by cloud cover and selects one', () => {
    useSentinel2TimetravelStore.setState({
      aoi: { type: 'Polygon', coordinates: [] },
      scenes: SCENES,
      selectedSceneId: 'clear',
    })
    render(<Panel />)
    expect(screen.getByText('☁ 2%')).toBeInTheDocument()
    expect(screen.getByText('☁ 80%')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /80%/ }))
    expect(useSentinel2TimetravelStore.getState().selectedSceneId).toBe('cloudy')
  })

  it('changes the opacity of the displayed scene', () => {
    useSentinel2TimetravelStore.setState({
      aoi: { type: 'Polygon', coordinates: [] },
      scenes: SCENES,
      selectedSceneId: 'clear',
    })
    render(<Panel />)
    fireEvent.change(
      screen.getByRole('slider', { name: /Transparenz der Sentinel-2-Ebene/ }),
      { target: { value: '0.5' } },
    )
    expect(useSentinel2TimetravelStore.getState().opacity).toBe(0.5)
  })

  it('resets the AOI and results', () => {
    useSentinel2TimetravelStore.setState({
      aoi: { type: 'Polygon', coordinates: [] },
      scenes: SCENES,
      selectedSceneId: 'clear',
    })
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: /Gebiet neu zeichnen/ }))
    expect(useSentinel2TimetravelStore.getState().aoi).toBeNull()
    expect(useSentinel2TimetravelStore.getState().scenes).toEqual([])
  })
})
