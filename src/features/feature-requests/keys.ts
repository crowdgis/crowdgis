/**
 * Per-issue answer keys, stored locally.
 *
 * The confirm redirect and every notification mail carry a per-issue
 * secret (?key=…). Only requests to /reply that include it are accepted,
 * so nobody can answer someone else's clarification. We remember the key
 * in localStorage so the submitter can answer directly from the app.
 */

const STORAGE_KEY = 'crowdgis-answer-keys'

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
      string,
      string
    >
  } catch {
    return {}
  }
}

export function saveAnswerKey(issueNumber: number, key: string): void {
  const all = readAll()
  all[String(issueNumber)] = key
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getAnswerKey(issueNumber: number): string | null {
  return readAll()[String(issueNumber)] ?? null
}
