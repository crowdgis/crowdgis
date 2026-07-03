import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useLayerStore } from '../../state/layerStore'
import bufferFeature from './index'

const Panel = bufferFeature.SidebarPanel!

beforeEach(() => {
  useLayerStore.setState({ layers: [], zoomTarget: null })
})

describe('BufferPanel', () => {
  it('shows a hint when no vector layer is loaded', () => {
    render(<Panel />)
    expect(screen.getByText(/Lade zuerst eine Vektorebene/)).toBeInTheDocument()
  })

  it('creates a new buffered layer from the selected layer and distance', () => {
    useLayerStore.getState().addLayer({
      name: 'Punkte',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: [8.5417, 47.3769] },
            },
          ],
        },
      },
    })
    render(<Panel />)

    fireEvent.change(screen.getByLabelText('Ebene für Puffer wählen'), {
      target: { value: useLayerStore.getState().layers[0].id },
    })
    fireEvent.change(screen.getByLabelText('Pufferabstand in Metern'), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Puffer erstellen' }))

    const layers = useLayerStore.getState().layers
    expect(layers).toHaveLength(2)
    expect(layers[1].name).toBe('Punkte (Puffer 100 m)')
    expect(layers[1].source.kind).toBe('vector')
    // Original layer stays untouched.
    expect(layers[0].source.kind === 'vector' && layers[0].source.geojson.features[0].geometry.type).toBe(
      'Point',
    )
  })
})
