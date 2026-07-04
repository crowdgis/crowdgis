import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSketchStore } from '../../state/sketchStore'
import { useSketchToolStore } from './sketchToolStore'
import { initialHistory } from './history'
import { DEFAULT_STYLE } from './style'
import sketching from './index'

const Panel = sketching.SidebarPanel!

beforeEach(() => {
  useSketchStore.setState({ features: [], clearToken: 0 })
  useSketchToolStore.setState({
    map: null,
    presetStyle: DEFAULT_STYLE,
    labelMode: 'none',
    selected: null,
    history: initialHistory(),
  })
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

  it('lets the user preset a color and line width for new shapes', () => {
    render(<Panel />)
    fireEvent.change(screen.getByLabelText('Farbe'), { target: { value: '#00ff00' } })
    expect(useSketchToolStore.getState().presetStyle.color).toBe('#00ff00')
  })

  it('toggles label placement modes exclusively', () => {
    render(<Panel />)
    const freeButton = screen.getByRole('button', { name: 'Textmarker setzen' })
    fireEvent.click(freeButton)
    expect(useSketchToolStore.getState().labelMode).toBe('free')

    fireEvent.click(screen.getByRole('button', { name: 'Beschriftung anhängen' }))
    expect(useSketchToolStore.getState().labelMode).toBe('attach')

    fireEvent.click(screen.getByRole('button', { name: 'Beschriftung anhängen' }))
    expect(useSketchToolStore.getState().labelMode).toBe('none')
  })

  it('disables undo/redo when there is nothing to undo or redo', () => {
    render(<Panel />)
    expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Wiederholen' })).toBeDisabled()
  })
})
