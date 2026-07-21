import type { GwrBuilding } from './api'

/** Union of attribute keys across all buildings, in first-seen order. */
export function collectColumns(buildings: GwrBuilding[]): string[] {
  const keys = new Set<string>()
  for (const b of buildings) {
    for (const key of Object.keys(b)) keys.add(key)
  }
  return [...keys]
}

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/** Serialize buildings as RFC 4180 CSV; columns are the union of all attribute keys. */
export function buildingsToCsv(buildings: GwrBuilding[]): string {
  const columns = collectColumns(buildings)
  const header = columns.map(escapeCsvField).join(',')
  const rows = buildings.map((b) =>
    columns.map((c) => escapeCsvField(b[c])).join(','),
  )
  return [header, ...rows].join('\r\n')
}

/** Trigger a browser download of the buildings as a CSV file. */
export function downloadGwrCsv(buildings: GwrBuilding[]) {
  const blob = new Blob([buildingsToCsv(buildings)], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gwr-gebaeude.csv'
  a.click()
  URL.revokeObjectURL(url)
}
