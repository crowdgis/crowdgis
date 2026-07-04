import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import chineseGlossaryFeature from './index'
import { GLOSSARY, GLOSSARY_MAP } from './glossary'

const Panel = chineseGlossaryFeature.SidebarPanel!

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
  it('is collapsed behind a German toggle by default, showing no Chinese text', () => {
    render(<Panel />)
    expect(screen.getByRole('button', { name: 'Chinesisches Glossar' })).toBeInTheDocument()
    expect(screen.queryByText('Ebenen')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Glossar durchsuchen')).not.toBeInTheDocument()
  })

  it('lists all known German terms grouped by category once opened', () => {
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: 'Chinesisches Glossar' }))
    expect(screen.getByText('Ebenen')).toBeInTheDocument()
    expect(screen.getAllByText('Feature-Wünsche').length).toBeGreaterThan(0)
  })

  it('filters entries by search query', () => {
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: 'Chinesisches Glossar' }))
    fireEvent.change(screen.getByLabelText('Glossar durchsuchen'), {
      target: { value: 'Puffer' },
    })
    expect(screen.getByText('Puffer')).toBeInTheDocument()
    expect(screen.queryByText('Skizzieren')).not.toBeInTheDocument()
  })

  it('shows a hint when nothing matches', () => {
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: 'Chinesisches Glossar' }))
    fireEvent.change(screen.getByLabelText('Glossar durchsuchen'), {
      target: { value: 'xyz-nicht-vorhanden' },
    })
    expect(screen.getByText('Keine Treffer.')).toBeInTheDocument()
  })

  it('closes again when the toggle is clicked a second time', () => {
    render(<Panel />)
    const toggle = screen.getByRole('button', { name: 'Chinesisches Glossar' })
    fireEvent.click(toggle)
    expect(screen.getByText('Ebenen')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.queryByText('Ebenen')).not.toBeInTheDocument()
  })

  it('does not expose an Overlay slot, so no Chinese text leaks outside this panel', () => {
    expect(chineseGlossaryFeature.Overlay).toBeUndefined()
  })
})
