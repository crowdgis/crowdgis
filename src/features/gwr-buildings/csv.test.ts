import { describe, expect, it } from 'vitest'
import { buildingsToCsv, collectColumns } from './csv'

describe('collectColumns', () => {
  it('unions attribute keys across buildings, first-seen order', () => {
    expect(
      collectColumns([{ egid: '1' }, { egid: '2', gbaup: '8021' }]),
    ).toEqual(['egid', 'gbaup'])
  })

  it('is empty for no buildings', () => {
    expect(collectColumns([])).toEqual([])
  })
})

describe('buildingsToCsv', () => {
  it('writes a header row and one row per building', () => {
    const csv = buildingsToCsv([
      { egid: '1', strname: 'Technikumstrasse' },
      { egid: '2', strname: 'Bahnhofstrasse' },
    ])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('egid,strname')
    expect(lines[1]).toBe('1,Technikumstrasse')
    expect(lines[2]).toBe('2,Bahnhofstrasse')
  })

  it('renders missing values as empty fields', () => {
    const csv = buildingsToCsv([{ egid: '1' }, { egid: '2', gbaup: '8021' }])
    expect(csv.split('\r\n')[1]).toBe('1,')
  })

  it('quotes fields containing commas, quotes or newlines', () => {
    const csv = buildingsToCsv([
      { strname: 'Weg, "beim" Bach\nZürich' },
    ])
    expect(csv.split('\r\n')[1]).toBe('"Weg, ""beim"" Bach\nZürich"')
  })
})
