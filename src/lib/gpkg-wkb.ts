import type { Geometry, Position } from 'geojson'

/**
 * Parser for GeoPackage geometry BLOBs (GP header + ISO WKB).
 *
 * Exists because the upstream GeoPackage library cannot read curve
 * geometries (CircularString, CompoundCurve, CurvePolygon, MultiCurve,
 * MultiSurface) and silently dropped those features. GeoJSON has no curve
 * primitives, so arcs are LINEARIZED here — sampled into short straight
 * segments within a chord tolerance, the same approach QGIS uses when
 * drawing curves.
 *
 * Completeness is the contract: every geometry type allowed in a
 * GeoPackage (WKB base types 1–12) is either converted or the caller gets
 * a thrown error — never a silent skip.
 */

const TAU = Math.PI * 2

/** Highest linearization density: at least this many segments per circle. */
const MIN_SEGMENTS_PER_CIRCLE = 16
/** Safety cap per individual arc. */
const MAX_SEGMENTS_PER_ARC = 1024

interface Cursor {
  o: number
}

/**
 * Parse a GeoPackage geometry blob to a GeoJSON geometry in the blob's
 * native CRS. Returns null for explicitly empty geometries.
 * @param arcTolerance max chord deviation when flattening arcs, in CRS units
 *   (e.g. 0.05 for meter-based CRS, ~5e-7 for degree-based CRS).
 */
export function parseGpkgGeometry(
  blob: Uint8Array,
  arcTolerance: number,
): Geometry | null {
  if (blob.length < 8 || blob[0] !== 0x47 || blob[1] !== 0x50) {
    throw new Error('Kein GeoPackage-Geometrie-Blob (GP-Magic fehlt).')
  }
  const flags = blob[3]
  if (flags & 0x20) {
    throw new Error('Erweiterte GeoPackage-Geometrie wird nicht unterstützt.')
  }
  if ((flags >> 4) & 0x01) return null // empty geometry flag

  const envelopeIndicator = (flags >> 1) & 0x07
  if (envelopeIndicator > 4) {
    throw new Error(`Ungültiger Envelope-Indikator ${envelopeIndicator}.`)
  }
  const envelopeSize = [0, 32, 48, 48, 64][envelopeIndicator]

  const dv = new DataView(blob.buffer, blob.byteOffset, blob.byteLength)
  const cursor: Cursor = { o: 8 + envelopeSize }
  return readGeometry(dv, cursor, arcTolerance)
}

function readGeometry(dv: DataView, cur: Cursor, tol: number): Geometry {
  const little = dv.getUint8(cur.o) === 1
  cur.o += 1
  let type = dv.getUint32(cur.o, little)
  cur.o += 4

  // EWKB dimension/SRID flags (defensive; GPKG mandates ISO WKB).
  let hasZ = (type & 0x80000000) !== 0
  let hasM = (type & 0x40000000) !== 0
  if (type & 0x20000000) cur.o += 4 // skip embedded SRID
  type = type & 0x0fffffff

  // ISO WKB dimension encoding: +1000 Z, +2000 M, +3000 ZM.
  const dimCode = Math.floor(type / 1000)
  if (dimCode === 1 || dimCode === 3) hasZ = true
  if (dimCode === 2 || dimCode === 3) hasM = true
  const base = type % 1000
  const dims = 2 + (hasZ ? 1 : 0) + (hasM ? 1 : 0)

  switch (base) {
    case 1: // Point
      return { type: 'Point', coordinates: readPosition(dv, cur, little, dims) }
    case 2: // LineString
      return { type: 'LineString', coordinates: readPositions(dv, cur, little, dims) }
    case 3: // Polygon
      return { type: 'Polygon', coordinates: readPolygonRings(dv, cur, little, dims) }
    case 4: { // MultiPoint
      const points = readSubGeometries(dv, cur, little, tol, 'Point')
      return {
        type: 'MultiPoint',
        coordinates: points.map((g) => (g as { coordinates: Position }).coordinates),
      }
    }
    case 5: // MultiLineString
    case 11: { // MultiCurve — sub-curves already arrive as LineStrings
      const lines = readSubGeometries(dv, cur, little, tol, 'LineString')
      return {
        type: 'MultiLineString',
        coordinates: lines.map((g) => (g as { coordinates: Position[] }).coordinates),
      }
    }
    case 6: // MultiPolygon
    case 12: { // MultiSurface — sub-surfaces already arrive as Polygons
      const polys = readSubGeometries(dv, cur, little, tol, 'Polygon')
      return {
        type: 'MultiPolygon',
        coordinates: polys.map((g) => (g as { coordinates: Position[][] }).coordinates),
      }
    }
    case 7: { // GeometryCollection
      const count = readCount(dv, cur, little)
      const geometries: Geometry[] = []
      for (let i = 0; i < count; i++) geometries.push(readGeometry(dv, cur, tol))
      return { type: 'GeometryCollection', geometries }
    }
    case 8: { // CircularString → linearized LineString
      const pts = readPositions(dv, cur, little, dims)
      return { type: 'LineString', coordinates: linearizeCircularString(pts, tol) }
    }
    case 9: { // CompoundCurve → LineString (continuous components, concatenated)
      const count = readCount(dv, cur, little)
      const coords: Position[] = []
      for (let i = 0; i < count; i++) {
        const seg = readCurveAsLine(dv, cur, tol)
        if (coords.length > 0 && seg.length > 0) {
          const last = coords[coords.length - 1]
          // Components share endpoints; drop the duplicated joint.
          const startIdx =
            last[0] === seg[0][0] && last[1] === seg[0][1] ? 1 : 0
          for (let j = startIdx; j < seg.length; j++) coords.push(seg[j])
        } else {
          coords.push(...seg)
        }
      }
      return { type: 'LineString', coordinates: coords }
    }
    case 10: { // CurvePolygon → Polygon
      const ringCount = readCount(dv, cur, little)
      const rings: Position[][] = []
      for (let i = 0; i < ringCount; i++) {
        rings.push(closeRing(readCurveAsLine(dv, cur, tol)))
      }
      return { type: 'Polygon', coordinates: rings }
    }
    default:
      throw new Error(`WKB-Geometrietyp ${base} wird nicht unterstützt.`)
  }
}

/**
 * Read `count` sub-geometries (each with its own WKB header).
 * The count field belongs to the parent and uses the parent's byte order.
 */
function readSubGeometries(
  dv: DataView,
  cur: Cursor,
  little: boolean,
  tol: number,
  expect: 'Point' | 'LineString' | 'Polygon',
): Geometry[] {
  const count = readCount(dv, cur, little)
  const out: Geometry[] = []
  for (let i = 0; i < count; i++) {
    const g = readGeometry(dv, cur, tol)
    if (g.type !== expect) {
      throw new Error(`Unerwarteter Untertyp ${g.type} (erwartet ${expect}).`)
    }
    out.push(g)
  }
  return out
}

function readCount(dv: DataView, cur: Cursor, little: boolean): number {
  const n = dv.getUint32(cur.o, little)
  cur.o += 4
  return n
}

function readPosition(
  dv: DataView,
  cur: Cursor,
  little: boolean,
  dims: number,
): Position {
  const x = dv.getFloat64(cur.o, little)
  const y = dv.getFloat64(cur.o + 8, little)
  cur.o += 8 * dims // skip Z/M — display is 2D
  return [x, y]
}

function readPositions(
  dv: DataView,
  cur: Cursor,
  little: boolean,
  dims: number,
): Position[] {
  const n = readCount(dv, cur, little)
  const out: Position[] = new Array(n)
  for (let i = 0; i < n; i++) out[i] = readPosition(dv, cur, little, dims)
  return out
}

function readPolygonRings(
  dv: DataView,
  cur: Cursor,
  little: boolean,
  dims: number,
): Position[][] {
  const n = readCount(dv, cur, little)
  const rings: Position[][] = new Array(n)
  for (let i = 0; i < n; i++) rings[i] = readPositions(dv, cur, little, dims)
  return rings
}

/** Read a curve component (LineString/CircularString/CompoundCurve) as line coords. */
function readCurveAsLine(dv: DataView, cur: Cursor, tol: number): Position[] {
  const g = readGeometry(dv, cur, tol)
  if (g.type !== 'LineString') {
    throw new Error(`Unerwarteter Kurventyp ${g.type}.`)
  }
  return g.coordinates as Position[]
}

function closeRing(coords: Position[]): Position[] {
  if (coords.length === 0) return coords
  const [fx, fy] = coords[0]
  const [lx, ly] = coords[coords.length - 1]
  if (fx !== lx || fy !== ly) return [...coords, [fx, fy]]
  return coords
}

/** CircularString: consecutive point triplets define arcs. */
export function linearizeCircularString(pts: Position[], tol: number): Position[] {
  if (pts.length < 3) return pts.map((p) => [p[0], p[1]])
  const out: Position[] = [[pts[0][0], pts[0][1]]]
  for (let i = 0; i + 2 < pts.length; i += 2) {
    appendArc(pts[i], pts[i + 1], pts[i + 2], tol, out)
  }
  return out
}

/** Append the arc p0→(through p1)→p2 to `out` (p0 already present). */
function appendArc(
  p0: Position,
  p1: Position,
  p2: Position,
  tol: number,
  out: Position[],
): void {
  const [ax, ay] = p0
  const [bx, by] = p1
  const [cx, cy] = p2

  const scale = Math.max(Math.abs(ax), Math.abs(ay), Math.abs(bx), Math.abs(by), 1)

  // Full circle: start == end, the circle's diameter is p0 ↔ p1.
  if (Math.hypot(cx - ax, cy - ay) < 1e-9 * scale) {
    const fx = (ax + bx) / 2
    const fy = (ay + by) / 2
    const fr = Math.hypot(ax - fx, ay - fy)
    if (fr > 0) {
      const start = Math.atan2(ay - fy, ax - fx)
      const n = segmentCount(TAU, fr, tol)
      for (let i = 1; i < n; i++) {
        const angle = start + (TAU * i) / n
        out.push([fx + fr * Math.cos(angle), fy + fr * Math.sin(angle)])
      }
    }
    out.push([cx, cy])
    return
  }

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  if (Math.abs(d) < 1e-12 * scale * scale) {
    // Collinear — degenerate arc, keep as straight segments.
    out.push([bx, by], [cx, cy])
    return
  }

  const aSq = ax * ax + ay * ay
  const bSq = bx * bx + by * by
  const cSq = cx * cx + cy * cy
  const ux = (aSq * (by - cy) + bSq * (cy - ay) + cSq * (ay - by)) / d
  const uy = (aSq * (cx - bx) + bSq * (ax - cx) + cSq * (bx - ax)) / d
  const r = Math.hypot(ax - ux, ay - uy)

  const a0 = Math.atan2(ay - uy, ax - ux)
  const a1 = Math.atan2(by - uy, bx - ux)
  const a2 = Math.atan2(cy - uy, cx - ux)

  let dEnd = (((a2 - a0) % TAU) + TAU) % TAU
  const dMid = (((a1 - a0) % TAU) + TAU) % TAU
  if (dEnd < 1e-12) dEnd = TAU // start == end → full circle
  const sweep = dMid <= dEnd ? dEnd : dEnd - TAU

  const n = segmentCount(Math.abs(sweep), r, tol)
  for (let i = 1; i < n; i++) {
    const angle = a0 + (sweep * i) / n
    out.push([ux + r * Math.cos(angle), uy + r * Math.sin(angle)])
  }
  out.push([cx, cy])
}

/** Segments for an arc of `sweep` radians from chord tolerance (sagitta). */
function segmentCount(sweep: number, r: number, tol: number): number {
  let step =
    r > tol ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tol / r))) : Math.PI / 2
  if (!(step > 0)) step = Math.PI / MIN_SEGMENTS_PER_CIRCLE
  step = Math.min(step, TAU / MIN_SEGMENTS_PER_CIRCLE)
  return Math.min(MAX_SEGMENTS_PER_ARC, Math.max(2, Math.ceil(sweep / step)))
}
