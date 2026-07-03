import { createHmac, timingSafeEqual } from 'node:crypto'
import { parseClarification } from '../shared/requests'
import { appBaseUrl, webhookSecret } from './_lib/env'
import { error, json } from './_lib/http'
import { emailKey, kv, openSetKey } from './_lib/kv'
import { sendMail } from './_lib/mail'

/** Verify GitHub's HMAC-SHA256 webhook signature. */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature?.startsWith('sha256=')) return false
  const expected =
    'sha256=' +
    createHmac('sha256', webhookSecret()).update(payload).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

interface WebhookIssue {
  number: number
  title: string
  state: 'open' | 'closed'
}

interface WebhookBody {
  action?: string
  issue?: WebhookIssue
  comment?: { body: string; user: { type: string } }
  label?: { name: string }
}

const NOTIFY_LABELS: Record<string, { subject: string; text: string }> = {
  bereit: {
    subject: 'Dein Feature-Wunsch ist bereit zur Umsetzung',
    text: 'Deine Anforderung ist klar genug und wartet auf die Freigabe.',
  },
  'in-arbeit': {
    subject: 'Dein Feature wird umgesetzt',
    text: 'Der Agent implementiert dein Feature gerade.',
  },
  live: {
    subject: 'Dein Feature ist live! 🎉',
    text: 'Dein Feature wurde umgesetzt und ist jetzt in CrowdGIS verfügbar.',
  },
  verworfen: {
    subject: 'Dein Feature-Wunsch wurde verworfen',
    text: 'Deine Anfrage wurde geschlossen (keine Antwort auf die Rückfrage oder nicht umsetzbar). Du kannst jederzeit einen neuen, präziseren Wunsch einreichen.',
  },
}

/** POST /api/github-webhook — notify students about issue events. */
export async function POST(request: Request): Promise<Response> {
  const raw = await request.text()
  if (!verifySignature(raw, request.headers.get('x-hub-signature-256'))) {
    return error('Ungültige Signatur.', 401)
  }

  const event = request.headers.get('x-github-event')
  const body = JSON.parse(raw) as WebhookBody
  const issue = body.issue
  if (!issue) return json({ ok: true, skipped: 'no issue' })

  const email = await kv.get<string>(emailKey(issue.number))
  const link = `${appBaseUrl()}/?request=${issue.number}`

  // Clarification comment from the agent → notify the student.
  if (event === 'issue_comment' && body.action === 'created' && body.comment) {
    const clarification = parseClarification(body.comment.body)
    if (clarification && email) {
      const questions = clarification.questions
        .map((q) => `– ${q.text}`)
        .join('\n')
      await sendMail(
        email,
        `Rückfrage zu "${issue.title}"`,
        [
          'Dein Feature-Wunsch hat eine Rückfrage:',
          '',
          questions,
          '',
          `Antworte hier: ${link}`,
        ].join('\n'),
      )
    }
    return json({ ok: true })
  }

  // Status label added → notify on the relevant transitions.
  if (event === 'issues' && body.action === 'labeled' && body.label) {
    const notify = NOTIFY_LABELS[body.label.name]
    if (notify && email) {
      await sendMail(
        email,
        `${notify.subject}: "${issue.title}"`,
        [notify.text, '', `Details: ${link}`].join('\n'),
      )
    }
    // Terminal states free up the student's open-request slot.
    if (
      (body.label.name === 'live' || body.label.name === 'verworfen') &&
      email
    ) {
      await kv.srem(openSetKey(email), issue.number)
    }
    return json({ ok: true })
  }

  if (event === 'issues' && body.action === 'closed' && email) {
    await kv.srem(openSetKey(email), issue.number)
    return json({ ok: true })
  }

  return json({ ok: true, skipped: event ?? 'unknown' })
}
