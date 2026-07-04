import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { importFile } from './loaders'

/** Minimal single-Point .shp buffer (ESRI Shapefile Technical Description). */
function buildPointShp(x: number, y: number): ArrayBuffer {
  const headerBytes = 100
  const recordBytes = 8 + 20
  const buf = new ArrayBuffer(headerBytes + recordBytes)
  const view = new DataView(buf)
  view.setInt32(0, 9994, false) // file code (big-endian)
  view.setInt32(24, buf.byteLength / 2, false) // file length in 16-bit words
  view.setInt32(28, 1000, true) // version
  view.setInt32(32, 1, true) // shape type: Point
  view.setFloat64(36, x, true)
  view.setFloat64(44, y, true)
  view.setFloat64(52, x, true)
  view.setFloat64(60, y, true)
  view.setInt32(headerBytes, 1, false) // record number
  view.setInt32(headerBytes + 4, 20 / 2, false) // content length in words
  view.setInt32(headerBytes + 8, 1, true) // shape type: Point
  view.setFloat64(headerBytes + 12, x, true)
  view.setFloat64(headerBytes + 20, y, true)
  return buf
}

/** Minimal one-record .dbf buffer with a single text field "NAME". */
function buildDbf(value: string): ArrayBuffer {
  const fieldLength = 10
  const headerSize = 32 + 32 + 1
  const recordSize = 1 + fieldLength
  const buf = new ArrayBuffer(headerSize + recordSize + 1)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)
  view.setUint8(0, 0x03) // dBase III
  view.setUint32(4, 1, true) // one record
  view.setUint16(8, headerSize, true)
  view.setUint16(10, recordSize, true)
  // field descriptor
  bytes.set(new TextEncoder().encode('NAME'), 32)
  view.setUint8(32 + 11, 0x43) // type 'C'
  view.setUint8(32 + 16, fieldLength)
  bytes[64] = 0x0d // field descriptor terminator
  // record
  bytes[headerSize] = 0x20 // not deleted
  bytes.set(
    new TextEncoder().encode(value.padEnd(fieldLength, ' ').slice(0, fieldLength)),
    headerSize + 1,
  )
  bytes[buf.byteLength - 1] = 0x1a // EOF marker
  return buf
}

const LV95_PRJ =
  'PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903+",DATUM["D_CH1903+",' +
  'SPHEROID["Bessel_1841",6377397.155,299.1528128]]],' +
  'PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"]]'

async function buildShapefileZip(
  files: Record<string, ArrayBuffer | string>,
): Promise<File> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], 'test.zip', { type: 'application/zip' })
}

describe('importFile (shapefile)', () => {
  it('reprojects LV95 coordinates to WGS84', async () => {
    const file = await buildShapefileZip({
      'test.shp': buildPointShp(2683000, 1247700), // near Zürich
      'test.shx': buildPointShp(2683000, 1247700),
      'test.dbf': buildDbf('Punkt'),
      'test.prj': LV95_PRJ,
    })
    const layers = await importFile(file)
    expect(layers).toHaveLength(1)
    const [layer] = layers
    expect(layer.source.kind).toBe('vector')
    if (layer.source.kind !== 'vector') throw new Error('expected vector')
    const [feature] = layer.source.geojson.features
    const [lng, lat] = feature.geometry.type === 'Point' ? feature.geometry.coordinates : []
    expect(lng).toBeGreaterThan(5)
    expect(lng).toBeLessThan(11)
    expect(lat).toBeGreaterThan(45)
    expect(lat).toBeLessThan(48)
    expect(feature.properties?.NAME?.toString().trim()).toBe('Punkt')
  })

  it('assumes WGS84 and adds a note when no .prj is present', async () => {
    const file = await buildShapefileZip({
      'test.shp': buildPointShp(8.5, 47.4),
      'test.shx': buildPointShp(8.5, 47.4),
      'test.dbf': buildDbf('Punkt'),
    })
    const layers = await importFile(file)
    expect(layers[0].note).toMatch(/keine \.prj-Datei/)
  })

  it('fails closed when the .dbf is missing', async () => {
    const file = await buildShapefileZip({
      'test.shp': buildPointShp(8.5, 47.4),
      'test.shx': buildPointShp(8.5, 47.4),
    })
    await expect(importFile(file)).rejects.toThrow(/\.dbf/)
  })

  it('fails closed on an unrecognized projection', async () => {
    const file = await buildShapefileZip({
      'test.shp': buildPointShp(500000, 4649776),
      'test.shx': buildPointShp(500000, 4649776),
      'test.dbf': buildDbf('Punkt'),
      'test.prj': 'PROJCS["NAD_1983_UTM_Zone_10N",...]',
    })
    await expect(importFile(file)).rejects.toThrow(/Koordinatensystem/)
  })
})
