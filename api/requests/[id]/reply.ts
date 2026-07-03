import { formatAnswerComment, statusFromLabels } from '../../../shared/requests.js'
import { addComment, getIssue, setLabels } from '../../_lib/github.js'
import { error, json, requestIdFromUrl } from '../../_lib/http.js'
import { answerKeyKey, kv } from '../../_lib/kv.js'

interface ReplyPayload {
  answers: Record<string, string>
  freeText?: string
  /** Per-issue secret from the submitter's mail link (see confirm.ts). */
  key?: string
}

/** POST /api/requests/:id/reply — student answers a clarification. */
export async function POST(request: Request): Promise<Response> {
  const number = requestIdFromUrl(request.url)
  if (number === null) {
    return error('Ungültige Nummer.', 400)
  }

  let payload: ReplyPayload
  try {
    payload = (await request.json()) as ReplyPayload
  } catch {
    return error('Ungültige Anfrage.', 400)
  }

  // Only the original submitter may answer: their mail links carry a
  // per-issue secret that was generated at confirmation time.
  const expectedKey = await kv.get<string>(answerKeyKey(number))
  if (!expectedKey || payload.key !== expectedKey) {
    return error(
      'Antworten ist nur über deinen persönlichen Link aus der E-Mail möglich.',
      403,
    )
  }

  const answers = payload.answers ?? {}
  const freeText = payload.freeText?.trim() ?? ''
  if (Object.keys(answers).length === 0 && freeText === '') {
    return error('Keine Antwort angegeben.', 400)
  }
  if (freeText.length > 1000) {
    return error('Die Ergänzung ist zu lang (max. 1000 Zeichen).', 400)
  }

  const issue = await getIssue(number)
  const status = statusFromLabels(issue.labels.map((l) => l.name))
  if (status !== 'rueckfrage') {
    return error('Für diese Anfrage ist keine Rückfrage offen.', 409)
  }

  const lines: string[] = []
  if (Object.keys(answers).length > 0) {
    lines.push(formatAnswerComment(answers))
  }
  if (freeText) lines.push('', `Ergänzung: ${freeText}`)

  await addComment(number, lines.join('\n'))
  // Back to triage: the agent re-evaluates with the new answers.
  await setLabels(number, ['eingereicht'], ['rueckfrage'])

  return json({ ok: true })
}
