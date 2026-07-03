import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useLayerStore } from '../../state/layerStore'
import layerManager from './index'

const Panel = layerManager.SidebarPanel!

beforeEach(() => {
  useLayerStore.setState({ layers: [], zoomTarget: null })
})

describe('LayerListPanel', () => {
  it('shows an inviting empty state', () => {
    render(<Panel />)
    expect(screen.getByText(/Noch keine Ebenen geladen/)).toBeInTheDocument()
  })

  it('lists layers and toggles visibility', () => {
    useLayerStore.getState().addLayer({
      name: 'Gemeinden',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: { type: 'FeatureCollection', features: [] },
      },
    })
    render(<Panel />)
    expect(screen.getByText('Gemeinden')).toBeInTheDocument()

    const checkbox = screen.getByRole('checkbox', {
      name: /Gemeinden ein-\/ausblenden/,
    })
    fireEvent.click(checkbox)
    expect(useLayerStore.getState().layers[0].visible).toBe(false)
  })

  it('removes a layer', () => {
    useLayerStore.getState().addLayer({
      name: 'Gemeinden',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: { type: 'FeatureCollection', features: [] },
      },
    })
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: /Gemeinden entfernen/ }))
    expect(useLayerStore.getState().layers).toHaveLength(0)
  })
})
