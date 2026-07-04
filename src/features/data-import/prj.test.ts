import { describe, expect, it } from 'vitest'
import { detectEpsgFromPrj } from './prj'

describe('detectEpsgFromPrj', () => {
  it('recognizes WGS84', () => {
    const wkt =
      'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],' +
      'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
    expect(detectEpsgFromPrj(wkt)).toBe(4326)
  })

  it('recognizes Web Mercator', () => {
    const wkt =
      'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",...],' +
      'PROJECTION["Mercator_Auxiliary_Sphere"]]'
    expect(detectEpsgFromPrj(wkt)).toBe(3857)
  })

  it('recognizes LV95 (CH1903+)', () => {
    const wkt = 'PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903+",DATUM["D_CH1903+",...]]]'
    expect(detectEpsgFromPrj(wkt)).toBe(2056)
  })

  it('recognizes LV03 (CH1903) without matching LV95', () => {
    const wkt = 'PROJCS["CH1903_LV03",GEOGCS["GCS_CH1903",DATUM["D_CH1903",...]]]'
    expect(detectEpsgFromPrj(wkt)).toBe(21781)
  })

  it('recognizes bare EPSG codes', () => {
    expect(detectEpsgFromPrj('AUTHORITY["EPSG","2056"]')).toBe(2056)
    expect(detectEpsgFromPrj('AUTHORITY["EPSG","21781"]')).toBe(21781)
  })

  it('returns null for unrecognized CRS', () => {
    expect(detectEpsgFromPrj('PROJCS["NAD_1983_UTM_Zone_10N",...]')).toBeNull()
  })
})
