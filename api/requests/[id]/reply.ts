import { formatAnswerComment, statusFromLabels } from '../../../shared/requests'
import { addComment, getIssue, setLabels } from '../../_lib/github'
import { error, json } from '../../_lib/http'

interface ReplyPayload {
  answers: Record<string, string>
  freeText?: string
}

/** POST /api/requests/:id/reply — student answers a clarification. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const number = Number(params.id)
  if (!Number.isInteger(number) || number <= 0) {
    return error('Ungültige Nummer.', 400)
  }

  let payload: ReplyPayload
  try {
    payload = (await request.json()) as ReplyPayload
  } catch {
    return error('Ungültige Anfrage.', 400)
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
