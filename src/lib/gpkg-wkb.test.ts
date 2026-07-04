import { describe, expect, it } from 'vitest'
import type { LineString, MultiPolygon, Polygon, Position } from 'geojson'
import { linearizeCircularString, parseGpkgGeometry } from './gpkg-wkb'
import { CHUR_CURVEPOLYGON_HEX } from './gpkg-wkb.fixture'

/** Minimal WKB writer for building test blobs. */
class W {
  private parts: number[] = []
  u8(v: number) {
    this.parts.push(v)
    return this
  }
  u32(v: number) {
    const b = new ArrayBuffer(4)
    new DataView(b).setUint32(0, v, true)
    this.parts.push(...new Uint8Array(b))
    return this
  }
  f64(v: number) {
    const b = new ArrayBuffer(8)
    new DataView(b).setFloat64(0, v, true)
    this.parts.push(...new Uint8Array(b))
    return this
  }
  xy(...coords: number[]) {
    for (const c of coords) this.f64(c)
    return this
  }
  bytes(): number[] {
    return this.parts
  }
}

/** Wrap raw WKB bytes in a minimal GPKG header (no envelope, little endian). */
function gpkgBlob(wkb: number[]): Uint8Array {
  return new Uint8Array([0x47, 0x50, 0x00, 0x01, 0, 0, 0, 0, ...wkb])
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function shoelace(ring: Position[]): number {
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area / 2)
}

describe('linearizeCircularString', () => {
  it('samples a half circle within tolerance', () => {
    // Arc (0,0) → (1,1) → (2,0): center (1,0), radius 1, upper semicircle.
    const pts = linearizeCircularString(
      [
        [0, 0],
        [1, 1],
        [2, 0],
      ],
      0.001,
    )
    expect(pts[0]).toEqual([0, 0])
    expect(pts[pts.length - 1]).toEqual([2, 0])
    expect(pts.length).toBeGreaterThan(10)
    for (const [x, y] of pts) {
      expect(Math.hypot(x - 1, y - 0)).toBeCloseTo(1, 2)
      expect(y).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it('keeps collinear "arcs" as straight lines', () => {
    const pts = linearizeCircularString(
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      0.001,
    )
    expect(pts).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
  })
})

describe('parseGpkgGeometry — synthetic curve blobs', () => {
  it('parses a CircularString (type 8) into a LineString', () => {
    const wkb = new W()
      .u8(1)
      .u32(8)
      .u32(3)
      .xy(0, 0)
      .xy(1, 1)
      .xy(2, 0)
      .bytes()
    const g = parseGpkgGeometry(gpkgBlob(wkb), 0.001) as LineString
    expect(g.type).toBe('LineString')
    expect(g.coordinates.length).toBeGreaterThan(10)
  })

  it('parses a CurvePolygon with a CompoundCurve ring and preserves the area', () => {
    // Ring: straight base (0,0)→(4,0), then arc (4,0)→(2,2)→(0,0).
    // Enclosed area = semicircle r=2 → 2π.
    const wkb = new W()
      .u8(1)
      .u32(10) // CurvePolygon
      .u32(1) // 1 ring
      .u8(1)
      .u32(9) // CompoundCurve
      .u32(2) // 2 components
      .u8(1)
      .u32(2) // LineString
      .u32(2)
      .xy(0, 0)
      .xy(4, 0)
      .u8(1)
      .u32(8) // CircularString
      .u32(3)
      .xy(4, 0)
      .xy(2, 2)
      .xy(0, 0)
      .bytes()
    const g = parseGpkgGeometry(gpkgBlob(wkb), 0.0005) as Polygon
    expect(g.type).toBe('Polygon')
    const ring = g.coordinates[0]
    expect(ring[0]).toEqual(ring[ring.length - 1]) // closed
    expect(shoelace(ring)).toBeCloseTo(2 * Math.PI, 1)
  })

  it('parses a MultiSurface (type 12) mixing Polygon and CurvePolygon', () => {
    const wkb = new W()
      .u8(1)
      .u32(12) // MultiSurface
      .u32(2)
      // plain unit square Polygon
      .u8(1)
      .u32(3)
      .u32(1)
      .u32(5)
      .xy(10, 10)
      .xy(11, 10)
      .xy(11, 11)
      .xy(10, 11)
      .xy(10, 10)
      // CurvePolygon: full circle r=1 around (0,0)
      .u8(1)
      .u32(10)
      .u32(1)
      .u8(1)
      .u32(8)
      .u32(3)
      .xy(1, 0)
      .xy(-1, 0)
      .xy(1, 0)
      .bytes()
    const g = parseGpkgGeometry(gpkgBlob(wkb), 0.0005) as MultiPolygon
    expect(g.type).toBe('MultiPolygon')
    expect(g.coordinates).toHaveLength(2)
    expect(shoelace(g.coordinates[0][0])).toBeCloseTo(1, 6)
    expect(shoelace(g.coordinates[1][0])).toBeCloseTo(Math.PI, 1)
  })

  it('returns null for the empty-geometry flag', () => {
    const blob = new Uint8Array([0x47, 0x50, 0x00, 0x11, 0, 0, 0, 0])
    expect(parseGpkgGeometry(blob, 0.05)).toBeNull()
  })

  it('throws on unsupported geometry types', () => {
    const wkb = new W().u8(1).u32(17).u32(0).bytes() // Triangle
    expect(() => parseGpkgGeometry(gpkgBlob(wkb), 0.05)).toThrow(/17/)
  })

  it('parses plain Z geometries by dropping Z', () => {
    const wkb = new W()
      .u8(1)
      .u32(1001) // Point Z
      .xy(2600000, 1200000, 555)
      .bytes()
    const g = parseGpkgGeometry(gpkgBlob(wkb), 0.05)
    expect(g).toEqual({ type: 'Point', coordinates: [2600000, 1200000] })
  })
})

describe('parseGpkgGeometry — real Chur CurvePolygon (regression)', () => {
  it('parses the fixture the upstream library could not read', () => {
    const g = parseGpkgGeometry(hexToBytes(CHUR_CURVEPOLYGON_HEX), 0.05) as Polygon
    expect(g.type).toBe('Polygon')
    expect(g.coordinates.length).toBeGreaterThanOrEqual(1)
    const ring = g.coordinates[0]
    expect(ring.length).toBeGreaterThan(20)
    expect(ring[0]).toEqual(ring[ring.length - 1])
    // Every vertex must lie in a plausible LV95 box around Chur.
    for (const [e, n] of ring) {
      expect(e).toBeGreaterThan(2_740_000)
      expect(e).toBeLessThan(2_780_000)
      expect(n).toBeGreaterThan(1_170_000)
      expect(n).toBeLessThan(1_210_000)
    }
  })
})
