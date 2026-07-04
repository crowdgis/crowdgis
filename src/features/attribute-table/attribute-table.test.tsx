import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Feature } from 'geojson'
import { useLayerStore } from '../../state/layerStore'
import attributeTable, { collectColumns } from './index'

const Panel = attributeTable.BottomPanel!

function makeFeature(props: Record<string, unknown>): Feature {
  return {
    type: 'Feature',
    properties: props,
    geometry: { type: 'Point', coordinates: [8.5, 47.4] },
  }
}

beforeEach(() => {
  useLayerStore.setState({
    layers: [],
    zoomTarget: null,
    attributeTableLayerId: null,
  })
})

describe('collectColumns', () => {
  it('unions property keys across features', () => {
    const cols = collectColumns([
      makeFeature({ name: 'A' }),
      makeFeature({ name: 'B', typ: 'Park' }),
    ])
    expect(cols).toEqual(['name', 'typ'])
  })
})

describe('AttributeTablePanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Panel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the table for the selected layer and closes', () => {
    const id = useLayerStore.getState().addLayer({
      name: 'Gemeinden',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: {
          type: 'FeatureCollection',
          features: [makeFeature({ name: 'Zürich', einwohner: 447_082 })],
        },
      },
    })
    useLayerStore.getState().setAttributeTableLayer(id)
    render(<Panel />)

    expect(screen.getByText('Attributtabelle')).toBeInTheDocument()
    expect(screen.getByText('Zürich')).toBeInTheDocument()
    expect(screen.getByText('einwohner')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Attributtabelle schliessen/ }),
    )
    expect(useLayerStore.getState().attributeTableLayerId).toBeNull()
  })

  it('filters rows by the entered expression', () => {
    const id = useLayerStore.getState().addLayer({
      name: 'Gemeinden',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: {
          type: 'FeatureCollection',
          features: [
            makeFeature({ name: 'Zürich', einwohner: 447_082 }),
            makeFeature({ name: 'Uster', einwohner: 35_000 }),
          ],
        },
      },
    })
    useLayerStore.getState().setAttributeTableLayer(id)
    render(<Panel />)

    fireEvent.change(screen.getByLabelText('Attribute filtern'), {
      target: { value: 'einwohner > 100000' },
    })

    expect(screen.getByText('Zürich')).toBeInTheDocument()
    expect(screen.queryByText('Uster')).not.toBeInTheDocument()
    expect(screen.getByText('1 von 2 Objekten')).toBeInTheDocument()
  })

  it('shows an error message for an invalid filter expression', () => {
    const id = useLayerStore.getState().addLayer({
      name: 'Gemeinden',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: {
          type: 'FeatureCollection',
          features: [makeFeature({ name: 'Zürich', einwohner: 447_082 })],
        },
      },
    })
    useLayerStore.getState().setAttributeTableLayer(id)
    render(<Panel />)

    fireEvent.change(screen.getByLabelText('Attribute filtern'), {
      target: { value: 'einwohner >' },
    })

    expect(screen.queryByText('Zürich')).not.toBeInTheDocument()
    expect(screen.getByText('Wert erwartet')).toBeInTheDocument()
  })

  it('requests a zoom when a row is clicked', () => {
    const id = useLayerStore.getState().addLayer({
      name: 'Punkte',
      bounds: null,
      source: {
        kind: 'vector',
        geojson: {
          type: 'FeatureCollection',
          features: [makeFeature({ name: 'A' })],
        },
      },
    })
    useLayerStore.getState().setAttributeTableLayer(id)
    render(<Panel />)
    fireEvent.click(screen.getByText('A'))
    expect(useLayerStore.getState().zoomTarget).not.toBeNull()
  })
})
