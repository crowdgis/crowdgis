import { describe, expect, it } from 'vitest'
import {
  formatAnswerComment,
  parseClarification,
  statusFromLabels,
} from './requests.js'

describe('statusFromLabels', () => {
  it('defaults to eingereicht', () => {
    expect(statusFromLabels(['feature-request'])).toBe('eingereicht')
  })

  it('picks the status label', () => {
    expect(statusFromLabels(['feature-request', 'rueckfrage'])).toBe('rueckfrage')
  })

  it('prefers the later lifecycle stage when multiple are present', () => {
    expect(statusFromLabels(['eingereicht', 'live'])).toBe('live')
  })
})

describe('parseClarification', () => {
  const valid = [
    'Dein Feature braucht noch Details:',
    '```json',
    JSON.stringify({
      type: 'rueckfrage',
      questions: [
        {
          id: 'q1',
          text: 'Welche Geometrien?',
          options: { A: 'Punkte', B: 'Alle' },
        },
      ],
    }),
    '```',
  ].join('\n')

  it('parses a valid clarification block', () => {
    const c = parseClarification(valid)
    expect(c).not.toBeNull()
    expect(c!.questions[0].id).toBe('q1')
    expect(c!.questions[0].options.B).toBe('Alle')
  })

  it('returns null without a json block', () => {
    expect(parseClarification('nur Text')).toBeNull()
  })

  it('returns null for other json blocks', () => {
    expect(parseClarification('```json\n{"type":"other"}\n```')).toBeNull()
  })

  it('returns null for malformed questions', () => {
    const bad = '```json\n{"type":"rueckfrage","questions":[{"id":1}]}\n```'
    expect(parseClarification(bad)).toBeNull()
  })
})

describe('formatAnswerComment', () => {
  it('formats answers machine-parsable', () => {
    expect(formatAnswerComment({ q1: 'B', q2: 'A' })).toBe('Antwort: q1=B, q2=A')
  })
})
