import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import { get as getProjection } from 'ol/proj'
// Registers the proj4 defs for EPSG:2056 / EPSG:21781 as a side effect.
import './crs'

/**
 * Register ONLY the projections this app needs with OpenLayers.
 *
 * ol's register() walks ALL defs known to proj4 and creates transforms
 * for every pair (O(n²)). Some dependencies flood the shared proj4
 * instance with the full EPSG catalog (thousands of defs), which turns
 * that loop into tens of millions of transform constructions and hangs
 * the page. This facade exposes just our codes while delegating the
 * actual work to the real proj4.
 */
const CODES = ['EPSG:4326', 'EPSG:3857', 'EPSG:2056', 'EPSG:21781']

type Proj4Like = typeof proj4

function scopedProj4(): Proj4Like {
  const facade = ((a: string, b?: string) =>
    (proj4 as (a: string, b?: string) => unknown)(a, b)) as Proj4Like
  const defs = ((code: string) => proj4.defs(code)) as typeof proj4.defs
  for (const code of CODES) {
    ;(defs as unknown as Record<string, unknown>)[code] = proj4.defs(code)
  }
  facade.defs = defs
  return facade
}

register(scopedProj4())

// Validity extent (Switzerland + margin) so OL can derive sane defaults.
getProjection('EPSG:2056')?.setExtent([2420000, 1030000, 2900000, 1350000])
