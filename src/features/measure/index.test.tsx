import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Feature } from 'geojson'
import { useSketchStore } from '../../state/sketchStore'
import measure, { measureSegments } from './index'

const Panel = measure.SidebarPanel!

beforeEach(() => {
  useSketchStore.setState({ features: [] })
})

const line: Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [8, 47],
      [8.01, 47],
      [8.01, 47.01],
    ],
  },
}

const square: Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [8, 47],
        [8.01, 47],
        [8.01, 47.01],
        [8, 47.01],
        [8, 47],
      ],
    ],
  },
}

describe('measureSegments', () => {
  it('returns one length per line segment', () => {
    expect(measureSegments(line)).toHaveLength(2)
  })

  it('returns one length per polygon edge, ignoring the closing point', () => {
    expect(measureSegments(square)).toHaveLength(4)
  })

  it('is empty for points', () => {
    const point: Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [8, 47] },
    }
    expect(measureSegments(point)).toEqual([])
  })
})

describe('MeasurePanel segment breakdown', () => {
  it('lists each segment of a line alongside the total', () => {
    useSketchStore.getState().setFeatures([line])
    render(<Panel />)
    expect(screen.getByText('Segment 1')).toBeInTheDocument()
    expect(screen.getByText('Segment 2')).toBeInTheDocument()
  })

  it('lists each edge of a polygon outline alongside the total', () => {
    useSketchStore.getState().setFeatures([square])
    render(<Panel />)
    expect(screen.getByText('Kante 1')).toBeInTheDocument()
    expect(screen.getByText('Kante 4')).toBeInTheDocument()
  })
})
