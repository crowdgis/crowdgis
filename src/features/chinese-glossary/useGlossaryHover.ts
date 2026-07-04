import { useEffect, useState } from 'react'
import { GLOSSARY_MAP } from './glossary'

export interface GlossaryHover {
  zh: string
  x: number
  y: number
}

const MAX_ANCESTOR_DEPTH = 6
const MAX_LEAF_TEXT_LENGTH = 60

/**
 * Walks up from `target` looking for the closest ancestor whose `title`,
 * `aria-label`, or own leaf text (no child elements) exactly matches a
 * known German UI term. Leaf-text matching avoids picking up large
 * container text (paragraphs, sections) that isn't a glossary term.
 */
function findGlossaryMatch(target: EventTarget | null): string | null {
  let el = target instanceof Element ? target : null
  let depth = 0
  while (el && depth < MAX_ANCESTOR_DEPTH) {
    const title = el.getAttribute('title')
    if (title && GLOSSARY_MAP.has(title)) return GLOSSARY_MAP.get(title)!.zh

    const ariaLabel = el.getAttribute('aria-label')
    if (ariaLabel && GLOSSARY_MAP.has(ariaLabel)) return GLOSSARY_MAP.get(ariaLabel)!.zh

    if (el.children.length === 0) {
      const text = el.textContent?.trim()
      if (text && text.length <= MAX_LEAF_TEXT_LENGTH && GLOSSARY_MAP.has(text)) {
        return GLOSSARY_MAP.get(text)!.zh
      }
    }

    el = el.parentElement
    depth += 1
  }
  return null
}

/**
 * Tracks the mouse across the whole document and reports the Chinese
 * explanation for whichever glossary term is currently under the
 * cursor, if any. Runs as a global listener so it works for every
 * feature's UI without touching that feature's own files.
 */
export function useGlossaryHover(): GlossaryHover | null {
  const [hover, setHover] = useState<GlossaryHover | null>(null)

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const zh = findGlossaryMatch(e.target)
      setHover(zh ? { zh, x: e.clientX, y: e.clientY } : null)
    }
    function handleLeave() {
      setHover(null)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeave)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return hover
}
