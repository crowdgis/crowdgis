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
  it('renders content only, no own heading or collapse toggle', () => {
    render(<Panel />)
    expect(screen.queryByRole('button', { name: 'Chinesisches Glossar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

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

  it('does not expose an Overlay slot, so no Chinese text leaks outside this panel', () => {
    expect(chineseGlossaryFeature.Overlay).toBeUndefined()
  })

  it('is not opened by default, so the sidebar stays fully German until a student opens this panel', async () => {
    const { DEFAULT_OPEN } = await import('../../state/panelStore')
    expect(DEFAULT_OPEN).not.toContain(chineseGlossaryFeature.id)
  })
})
