/**
 * Shared types for the feature-request pipeline.
 * Used by the app (src/) and the serverless functions (api/).
 * GitHub Issues are the source of truth; labels encode the status.
 */

export const STATUS_ORDER = [
  'rueckfrage',
  'eingereicht',
  'bereit',
  'freigegeben',
  'in-arbeit',
  'testing',
  'live',
  'verworfen',
] as const

export type RequestStatus = (typeof STATUS_ORDER)[number]

export const STATUS_LABELS: Record<RequestStatus, string> = {
  eingereicht: 'Eingereicht',
  rueckfrage: 'Rückfrage offen',
  bereit: 'Bereit',
  freigegeben: 'Freigegeben',
  'in-arbeit': 'In Arbeit',
  testing: 'Im Test',
  live: 'Live',
  verworfen: 'Verworfen',
}

/** Derive the request status from GitHub issue labels. */
export function statusFromLabels(labels: string[]): RequestStatus {
  // Later lifecycle stages win when multiple labels are present.
  for (const status of [...STATUS_ORDER].reverse()) {
    if (labels.includes(status)) return status
  }
  return 'eingereicht'
}

export interface ClarificationQuestion {
  id: string
  text: string
  options: Record<string, string>
}

export interface Clarification {
  type: 'rueckfrage'
  questions: ClarificationQuestion[]
}

/**
 * Extract a clarification block from an agent comment.
 * The agent posts fenced ```json blocks matching the CLAUDE.md schema.
 */
export function parseClarification(body: string): Clarification | null {
  const match = body.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed: unknown = JSON.parse(match[1])
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { type?: unknown }).type === 'rueckfrage' &&
      Array.isArray((parsed as { questions?: unknown }).questions)
    ) {
      const clarification = parsed as Clarification
      const valid = clarification.questions.every(
        (q) =>
          typeof q.id === 'string' &&
          typeof q.text === 'string' &&
          typeof q.options === 'object' &&
          q.options !== null,
      )
      return valid ? clarification : null
    }
  } catch {
    // fall through
  }
  return null
}

/** Format student answers as a machine-parsable comment body. */
export function formatAnswerComment(answers: Record<string, string>): string {
  const parts = Object.entries(answers).map(([id, value]) => `${id}=${value}`)
  return `Antwort: ${parts.join(', ')}`
}

export interface RequestComment {
  /** 'agent' for bot/token authors, 'student' for proxy answers. */
  author: 'agent' | 'student'
  body: string
  createdAt: string
  clarification: Clarification | null
}

export interface FeatureRequestSummary {
  number: number
  title: string
  status: RequestStatus
  createdAt: string
  upvotes: number
}

export interface FeatureRequestDetail extends FeatureRequestSummary {
  description: string
  comments: RequestComment[]
}

export interface SubmitPayload {
  title: string
  description: string
  email: string
  courseCode: string
  /** Public pseudonym shown on the board; never the email. */
  pseudonym: string
}
