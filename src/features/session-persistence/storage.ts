import type { Feature } from 'geojson'
import type { AppLayer, LayerBounds, LayerSource } from '../../state/layerStore'

const STORAGE_KEY = 'crowdgis.session.v1'

export interface PersistedView {
  center: [number, number]
  zoom: number
}

export interface PersistedLayer {
  name: string
  visible: boolean
  bounds: LayerBounds | null
  source: LayerSource
}

export interface PersistedSession {
  version: 1
  savedAt: number
  basemapId: string
  view: PersistedView | null
  layers: PersistedLayer[]
  sketches: Feature[]
}

/** Builds the plain, JSON-serializable snapshot of the current work session. */
export function serializeSession(input: {
  basemapId: string
  view: PersistedView | null
  layers: AppLayer[]
  sketches: Feature[]
}): PersistedSession {
  return {
    version: 1,
    savedAt: Date.now(),
    basemapId: input.basemapId,
    view: input.view,
    layers: input.layers.map(({ name, visible, bounds, source }) => ({
      name,
      visible,
      bounds,
      source,
    })),
    sketches: input.sketches,
  }
}

/**
 * Writes the session to localStorage. Raster pixel data can be large enough
 * to exceed the browser's storage quota, so on failure we retry without
 * rasters, then without any layers/sketches, rather than losing the save
 * entirely (map view + basemap always survive).
 */
export function writeSession(session: PersistedSession): boolean {
  const attempts: PersistedSession[] = [
    session,
    { ...session, layers: session.layers.filter((l) => l.source.kind !== 'raster') },
    { ...session, layers: [], sketches: [] },
  ]
  for (const attempt of attempts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
      return true
    } catch {
      continue
    }
  }
  return false
}

function isPersistedSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.version === 1 && Array.isArray(v.layers) && Array.isArray(v.sketches)
}

/** Reads a previously saved session, or null if there is none or it is corrupt. */
export function readSession(): PersistedSession | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isPersistedSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Delays calls to `fn` until `delayMs` have passed without another call. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delayMs)
  }
}
