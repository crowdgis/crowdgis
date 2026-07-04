import { randomUUID } from 'node:crypto'
import type { FeatureRequestSummary, SubmitPayload } from '../../shared/requests.js'
import { statusFromLabels } from '../../shared/requests.js'
import {
  allowedMailSuffixes,
  appBaseUrl,
  confirmMailsPerDay,
  courseCode,
  maxOpenPerStudent,
} from '../_lib/env.js'
import { renderEmail } from '../_lib/email-template.js'
import { listFeatureRequests } from '../_lib/github.js'
import { error, json } from '../_lib/http.js'
import {
  kv,
  openSetKey,
  rateLimited,
  storePending,
  upvoteKey,
} from '../_lib/kv.js'
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
    // Brute-force guard on the course code — counted per IP and only on
    // WRONG codes, so students who know the code are never throttled
    // (important: a whole class may share one campus/VPN IP).
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (await rateLimited('badcode-ip', ip, 10, 3600)) {
      return error(
        'Zu viele Fehlversuche mit dem Kurscode. Bitte versuche es später erneut.',
        429,
      )
    }
    return error('Der Kurscode stimmt nicht.', 403)
  }

  // Both KV checks in parallel — one round-trip of latency instead of two.
  // Mail throttle is identity-based (not IP): prevents bombarding an inbox
  // and caps how many new requests one student starts per day. Does not
  // limit the semester total — active participation is explicitly wanted.
  const [mailLimited, openCount] = await Promise.all([
    rateLimited('confirm-mail', email, confirmMailsPerDay(), 86_400),
    kv.scard(openSetKey(email)),
  ])
  if (mailLimited) {
    return error(
      'An diese Adresse wurden heute schon viele Bestätigungsmails geschickt. Bitte versuche es morgen erneut.',
      429,
    )
  }

  if (openCount >= maxOpenPerStudent()) {
    return error(
      `Du hast gerade ${openCount} offene Anfragen. Sobald eine umgesetzt oder abgeschlossen ist, kannst du wieder einreichen.`,
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
  const mail = renderEmail({
    heading: 'Bestätige deinen Feature-Wunsch',
    paragraphs: [
      `Hallo ${pseudonym}, danke für deine Einreichung.`,
      `Du hast den Feature-Wunsch „${title}“ eingereicht. Damit er auf dem CrowdGIS-Board erscheint und bearbeitet wird, bestätige bitte kurz, dass die Einreichung von dir stammt.`,
      'Der Bestätigungslink ist 3 Tage gültig. Wenn die Einreichung nicht von dir war, kannst du diese E-Mail ignorieren.',
    ],
    button: { label: 'Feature-Wunsch bestätigen', url: confirmUrl },
    reason: `Du erhältst diese E-Mail, weil auf crowdgis.ch ein Feature-Wunsch mit deiner Adresse eingereicht wurde.`,
  })
  await sendMail(
    email,
    'Bestätige deinen Feature-Wunsch',
    mail.text,
    mail.html,
  )

  return json({ ok: true, message: 'Bestätigungsmail verschickt.' }, 202)
}
