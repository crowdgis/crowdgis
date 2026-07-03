import { randomUUID } from 'node:crypto'
import type { FeatureRequestSummary, SubmitPayload } from '../../shared/requests.js'
import { statusFromLabels } from '../../shared/requests.js'
import {
  allowedMailSuffixes,
  appBaseUrl,
  courseCode,
  maxOpenPerStudent,
} from '../_lib/env.js'
import { listFeatureRequests } from '../_lib/github.js'
import { error, json } from '../_lib/http.js'
import { kv, openSetKey, storePending, upvoteKey } from '../_lib/kv.js'
import { sendMail } from '../_lib/mail.js'

/** GET /api/requests — board data (no PII, no comments). */
export async function GET(): Promise<Response> {
  const issues = await listFeatureRequests()
  const upvotes = issues.length
    ? await kv.mget<(number | null)[]>(
        ...issues.map((i) => upvoteKey(i.number)),
      )
    : []
  const summaries: FeatureRequestSummary[] = issues.map((issue, i) => ({
    number: issue.number,
    title: issue.title,
    status: statusFromLabels(issue.labels.map((l) => l.name)),
    createdAt: issue.created_at,
    upvotes: upvotes[i] ?? 0,
  }))
  return json(summaries)
}

/** POST /api/requests — validate and hold pending until e-mail confirm. */
export async function POST(request: Request): Promise<Response> {
  let payload: SubmitPayload
  try {
    payload = (await request.json()) as SubmitPayload
  } catch {
    return error('Ungültige Anfrage.', 400)
  }

  const title = payload.title?.trim() ?? ''
  const description = payload.description?.trim() ?? ''
  const email = payload.email?.trim().toLowerCase() ?? ''
  const pseudonym = payload.pseudonym?.trim() ?? ''

  if (title.length < 5 || title.length > 120) {
    return error('Der Titel muss 5–120 Zeichen lang sein.', 400)
  }
  if (description.length < 30) {
    return error(
      'Beschreibe dein Feature etwas ausführlicher (mind. 30 Zeichen).',
      400,
    )
  }
  if (description.length > 5000) {
    return error('Die Beschreibung ist zu lang (max. 5000 Zeichen).', 400)
  }
  if (pseudonym.length < 2 || pseudonym.length > 30) {
    return error('Bitte gib ein Kürzel mit 2–30 Zeichen an.', 400)
  }
  const suffixes = allowedMailSuffixes()
  const emailAllowed = suffixes.some(
    (s) => email.endsWith(`@${s}`) || email.endsWith(`.${s}`),
  )
  if (!emailAllowed) {
    return error(
      `Bitte verwende deine Hochschul-Mailadresse (…${suffixes.join(' oder …')}).`,
      400,
    )
  }
  if (
    payload.courseCode?.trim().toLowerCase() !== courseCode().toLowerCase()
  ) {
    return error('Der Kurscode stimmt nicht.', 403)
  }

  const openCount = await kv.scard(openSetKey(email))
  if (openCount >= maxOpenPerStudent()) {
    return error(
      `Du hast bereits ${openCount} offene Anfragen. Warte, bis eine abgeschlossen ist.`,
      429,
    )
  }

  const token = randomUUID()
  await storePending(token, {
    title,
    description,
    email,
    pseudonym,
    createdAt: new Date().toISOString(),
  })

  const confirmUrl = `${appBaseUrl()}/api/confirm?token=${token}`
  await sendMail(
    email,
    'Bitte bestätige deinen Feature-Wunsch',
    [
      `Hallo ${pseudonym}`,
      '',
      `Du hast den Feature-Wunsch "${title}" eingereicht.`,
      'Bitte bestätige ihn mit diesem Link (gültig 3 Tage):',
      '',
      confirmUrl,
      '',
      'Wenn das nicht du warst, ignoriere diese Mail einfach.',
    ].join('\n'),
  )

  return json({ ok: true, message: 'Bestätigungsmail verschickt.' }, 202)
}
