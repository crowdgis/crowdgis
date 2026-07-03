import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSketchStore } from '../../state/sketchStore'
import sketching from './index'

const Panel = sketching.SidebarPanel!

beforeEach(() => {
  useSketchStore.setState({ features: [], clearToken: 0 })
})

describe('SketchPanel', () => {
  it('invites to draw when empty', () => {
    render(<Panel />)
    expect(screen.getByText(/Zeichne mit den Werkzeugen/)).toBeInTheDocument()
  })

  it('shows count and requests clearing', () => {
    useSketchStore.getState().setFeatures([
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [8, 47] },
      },
    ])
    render(<Panel />)
    expect(screen.getByText(/1 Objekt gezeichnet/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Alle löschen/ }))
    expect(useSketchStore.getState().clearToken).toBe(1)
  })
})
