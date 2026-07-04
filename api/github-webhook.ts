import { createHmac, timingSafeEqual } from 'node:crypto'
import { parseClarification } from '../shared/requests.js'
import { renderEmail } from './_lib/email-template.js'
import { appBaseUrl, webhookSecret } from './_lib/env.js'
import { listComments } from './_lib/github.js'
import { error, json } from './_lib/http.js'
import { answerKeyKey, emailKey, kv, openSetKey } from './_lib/kv.js'
import { sendMail } from './_lib/mail.js'

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

interface StatusMail {
  subject: string
  paragraphs: string[]
  buttonLabel: string
  /** Quote the agent's latest issue comment (the reasoning) in the mail. */
  includeAgentComment?: boolean
}

const NOTIFY_LABELS: Record<string, StatusMail> = {
  bereit: {
    subject: 'Dein Feature-Wunsch ist bereit zur Umsetzung',
    paragraphs: [
      'Gute Nachricht: Deine Anforderung ist klar und vollständig beschrieben.',
      'Sie wartet jetzt auf die Freigabe durch das CrowdGIS-Team. Danach implementiert der KI-Agent dein Feature automatisch — du bekommst eine Nachricht, sobald es so weit ist.',
    ],
    buttonLabel: 'Zum Feature-Board',
  },
  'in-arbeit': {
    subject: 'Dein Feature wird jetzt umgesetzt',
    paragraphs: [
      'Dein Feature-Wunsch wurde freigegeben — der KI-Agent implementiert ihn gerade.',
      'Sobald das Feature getestet und live ist, melden wir uns wieder.',
    ],
    buttonLabel: 'Status verfolgen',
  },
  live: {
    subject: 'Dein Feature ist live! 🎉',
    paragraphs: [
      'Geschafft: Dein Feature wurde umgesetzt, hat alle Tests bestanden und ist ab sofort für alle in CrowdGIS verfügbar.',
      'Probier es gleich aus — und danke, dass du CrowdGIS mitgestaltest!',
    ],
    buttonLabel: 'Feature ansehen',
  },
  verworfen: {
    subject: 'Dein Feature-Wunsch kann leider nicht umgesetzt werden',
    paragraphs: [
      'Wir haben deinen Wunsch geprüft, können ihn aber nicht umsetzen. Die Begründung findest du unten.',
    ],
    buttonLabel: 'Details ansehen',
    includeAgentComment: true,
  },
}

const ENCOURAGEMENT =
  'Lass dich davon nicht entmutigen: Formuliere gerne einen neuen, präziseren Wunsch. Genau dieses Präzisieren ist Teil dessen, was CrowdGIS vermitteln möchte.'

/**
 * Latest agent comment on the issue (the human-readable reasoning),
 * with any machine-readable JSON blocks stripped. Null when unavailable.
 */
async function latestAgentComment(issueNumber: number): Promise<string | null> {
  try {
    const comments = await listComments(issueNumber)
    for (const comment of [...comments].reverse()) {
      if (comment.body.startsWith('Antwort:')) continue // student replies
      const cleaned = comment.body
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      if (cleaned.length > 0) {
        return cleaned.length > 700 ? `${cleaned.slice(0, 700)} …` : cleaned
      }
    }
  } catch {
    // Mail still goes out, just without the quote.
  }
  return null
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

  // One round-trip for both private lookups. The answer key rides along in
  // mail links so the submitter can act from any device; the app stores it
  // locally (see feature-requests/keys.ts).
  const [email, answerKey] = await kv.mget<(string | null)[]>(
    emailKey(issue.number),
    answerKeyKey(issue.number),
  )
  const link = answerKey
    ? `${appBaseUrl()}/?request=${issue.number}&key=${answerKey}`
    : `${appBaseUrl()}/?request=${issue.number}`

  // Clarification comment from the agent → notify the student.
  if (event === 'issue_comment' && body.action === 'created' && body.comment) {
    const clarification = parseClarification(body.comment.body)
    if (clarification && email) {
      const questions = clarification.questions.map((q) => `• ${q.text}`)
      const mail = renderEmail({
        heading: `Rückfrage zu „${issue.title}“`,
        paragraphs: [
          'Damit wir dein Feature genau richtig umsetzen, brauchen wir noch ein paar Angaben von dir:',
          questions.join('\n'),
          'Öffne dein Feature auf dem Board und beantworte die Fragen dort mit einem Klick.',
        ],
        button: { label: 'Rückfrage beantworten', url: link },
        reason:
          'Du erhältst diese E-Mail, weil dein CrowdGIS-Feature-Wunsch eine Rückfrage hat.',
      })
      await sendMail(email, `Rückfrage zu „${issue.title}“`, mail.text, mail.html)
    }
    return json({ ok: true })
  }

  // Status label added → notify on the relevant transitions.
  if (event === 'issues' && body.action === 'labeled' && body.label) {
    const notify = NOTIFY_LABELS[body.label.name]
    if (notify && email) {
      const paragraphs = [...notify.paragraphs]
      if (notify.includeAgentComment) {
        const reason = await latestAgentComment(issue.number)
        if (reason) paragraphs.push(reason)
        paragraphs.push(ENCOURAGEMENT)
      }
      const mail = renderEmail({
        heading: notify.subject,
        paragraphs,
        button: { label: notify.buttonLabel, url: link },
        reason: `Du erhältst diese E-Mail, weil sich der Status deines Feature-Wunsches „${issue.title}“ geändert hat.`,
      })
      await sendMail(email, `${notify.subject}: „${issue.title}“`, mail.text, mail.html)
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
