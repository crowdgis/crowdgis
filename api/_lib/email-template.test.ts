import { describe, expect, it } from 'vitest'
import { renderEmail } from './email-template.js'

describe('renderEmail', () => {
  const mail = renderEmail({
    heading: 'Bestätige deinen Feature-Wunsch',
    paragraphs: ['Hallo hr, danke für deine Einreichung.', 'Zweiter Absatz.'],
    button: { label: 'Bestätigen', url: 'https://crowdgis.ch/api/confirm?token=abc' },
    reason: 'Du erhältst diese E-Mail, weil …',
  })

  it('produces both text and html parts', () => {
    expect(mail.text.length).toBeGreaterThan(0)
    expect(mail.html).toContain('<!doctype html>')
  })

  it('includes the button url in both parts', () => {
    expect(mail.text).toContain('https://crowdgis.ch/api/confirm?token=abc')
    expect(mail.html).toContain('https://crowdgis.ch/api/confirm?token=abc')
  })

  it('includes heading, paragraphs and footer', () => {
    expect(mail.html).toContain('Bestätige deinen Feature-Wunsch')
    expect(mail.text).toContain('Zweiter Absatz.')
    expect(mail.html).toContain('Lehrprojekt an der ZHAW')
  })

  it('renders newlines inside paragraphs as <br>', () => {
    const multi = renderEmail({
      heading: 'H',
      paragraphs: ['Zeile 1\nZeile 2'],
      reason: 'r',
    })
    expect(multi.html).toContain('Zeile 1<br>Zeile 2')
  })

  it('escapes HTML in user-provided content', () => {
    const evil = renderEmail({
      heading: 'Titel <script>alert(1)</script>',
      paragraphs: ['a & b < c'],
      reason: 'r',
    })
    expect(evil.html).not.toContain('<script>')
    expect(evil.html).toContain('&lt;script&gt;')
    expect(evil.html).toContain('a &amp; b &lt; c')
  })
})
