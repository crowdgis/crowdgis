import { useMemo, useState } from 'react'
import { GLOSSARY, GLOSSARY_CATEGORIES } from './glossary'

/**
 * Content of the Chinese glossary sidebar panel. The core frames this in
 * its own collapsible section (stack mode) or icon-rail tab (rail mode),
 * closed by default — so Chinese text only appears once a student
 * explicitly opens this panel, never mixed into the rest of the UI.
 */
export function GlossaryPanel() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GLOSSARY
    return GLOSSARY.filter(
      (entry) => entry.de.toLowerCase().includes(q) || entry.zh.includes(query.trim()),
    )
  }, [query])

  return (
    <section>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Deutschen Begriff suchen…"
        aria-label="Glossar durchsuchen"
        className="mb-2 w-full rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black"
      />
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {GLOSSARY_CATEGORIES.map((category) => {
          const entries = filtered.filter((entry) => entry.category === category)
          if (entries.length === 0) return null
          return (
            <div key={category}>
              <p className="mb-1 text-xs font-medium text-stone">{category}</p>
              <ul className="flex flex-col">
                {entries.map((entry) => (
                  <li key={entry.de} className="border-b border-hairline py-1 last:border-b-0">
                    <p className="text-sm text-black">{entry.de}</p>
                    <p className="text-xs text-stone">{entry.zh}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-xs text-stone">Keine Treffer.</p>}
      </div>
    </section>
  )
}
