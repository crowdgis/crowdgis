import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import chineseGlossaryFeature from './index'
import { GLOSSARY, GLOSSARY_MAP } from './glossary'

const Panel = chineseGlossaryFeature.SidebarPanel!
const Tooltip = chineseGlossaryFeature.Overlay!

describe('glossary data', () => {
  it('has a unique, non-empty Chinese explanation for every German term', () => {
    expect(GLOSSARY.length).toBeGreaterThan(0)
    for (const entry of GLOSSARY) {
      expect(entry.zh.length).toBeGreaterThan(0)
    }
    expect(GLOSSARY_MAP.size).toBe(GLOSSARY.length)
  })
})

describe('GlossaryPanel', () => {
  it('lists all known German terms grouped by category', () => {
    render(<Panel />)
    expect(screen.getByText('Ebenen')).toBeInTheDocument()
    expect(screen.getAllByText('Feature-Wünsche').length).toBeGreaterThan(0)
  })

  it('filters entries by search query', () => {
    render(<Panel />)
    fireEvent.change(screen.getByLabelText('Glossar durchsuchen'), {
      target: { value: 'Puffer' },
    })
    expect(screen.getByText('Puffer')).toBeInTheDocument()
    expect(screen.queryByText('Skizzieren')).not.toBeInTheDocument()
  })

  it('shows a hint when nothing matches', () => {
    render(<Panel />)
    fireEvent.change(screen.getByLabelText('Glossar durchsuchen'), {
      target: { value: 'xyz-nicht-vorhanden' },
    })
    expect(screen.getByText('Keine Treffer.')).toBeInTheDocument()
  })
})

describe('GlossaryTooltip', () => {
  it('shows the Chinese explanation when hovering a known button', () => {
    render(
      <div>
        <button type="button" title="Puffer erstellen">
          Puffer erstellen
        </button>
        <Tooltip />
      </div>,
    )

    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 10, clientY: 10 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('创建缓冲区')
  })

  it('renders nothing while hovering unknown elements', () => {
    render(
      <div>
        <button type="button">Ein unbekannter Text</button>
        <Tooltip />
      </div>,
    )

    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 10, clientY: 10 })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('clears the tooltip once the pointer leaves the document', () => {
    render(
      <div>
        <button type="button" title="Puffer erstellen">
          Puffer erstellen
        </button>
        <Tooltip />
      </div>,
    )

    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 10, clientY: 10 })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(document)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
