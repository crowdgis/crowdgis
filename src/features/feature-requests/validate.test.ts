import { describe, expect, it } from 'vitest'
import { validateSubmit } from './validate'

const valid = {
  title: 'Massstabsleiste konfigurierbar machen',
  description:
    'Die Massstabsleiste soll wahlweise metrisch oder imperial anzeigen und per Klick umschaltbar sein.',
  email: 'muster@students.zhaw.ch',
  courseCode: 'GIS-HS26',
  pseudonym: 'mm',
}

describe('validateSubmit', () => {
  it('accepts a valid payload', () => {
    expect(validateSubmit(valid)).toBeNull()
  })

  it('rejects short titles and descriptions', () => {
    expect(validateSubmit({ ...valid, title: 'Kurz' })).toMatch(/Titel/)
    expect(validateSubmit({ ...valid, description: 'zu kurz' })).toMatch(
      /ausführlicher/,
    )
  })

  it('rejects invalid emails and missing course code', () => {
    expect(validateSubmit({ ...valid, email: 'keine-mail' })).toMatch(/E-Mail/)
    expect(validateSubmit({ ...valid, courseCode: ' ' })).toMatch(/Kurscode/)
  })
})
