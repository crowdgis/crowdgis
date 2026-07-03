import { beforeEach, describe, expect, it } from 'vitest'
import { getAnswerKey, saveAnswerKey } from './keys'

beforeEach(() => {
  localStorage.clear()
})

describe('answer keys', () => {
  it('stores and retrieves keys per issue', () => {
    saveAnswerKey(12, 'secret-a')
    saveAnswerKey(13, 'secret-b')
    expect(getAnswerKey(12)).toBe('secret-a')
    expect(getAnswerKey(13)).toBe('secret-b')
  })

  it('returns null for unknown issues', () => {
    expect(getAnswerKey(99)).toBeNull()
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('crowdgis-answer-keys', 'kein json')
    expect(getAnswerKey(1)).toBeNull()
    saveAnswerKey(1, 'x')
    expect(getAnswerKey(1)).toBe('x')
  })
})
