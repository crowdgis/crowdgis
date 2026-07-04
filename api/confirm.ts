import { randomUUID } from 'node:crypto'
import { appBaseUrl } from './_lib/env.js'
import { createIssue } from './_lib/github.js'
import { escapeHtml, HAIRLINE, INK, PAPER, SIGNAL } from './_lib/html.js'
import { error } from './_lib/http.js'
import {
  answerKeyKey,
  emailKey,
  kv,
  openSetKey,
  peekPending,
  takePending,
} from './_lib/kv.js'

/**
 * E-mail confirmation, scanner-safe in two steps:
 *
 *   GET  /api/confirm?token=…  → small branded page with a confirm button.
 *        Mail-security scanners (e.g. Outlook Safe Links) only issue GETs,
 *        so they can no longer redeem tokens or create issues.
 *   POST /api/confirm?token=…  → atomically redeems the token, creates the
 *        public GitHub issue (no PII) and redirects into the app.
 */

function page(title: string, bodyHtml: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} – CrowdGIS</title></head>
<body style="margin:0;background:${PAPER};font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:10vh auto;background:#fff;border:1px solid ${HAIRLINE};border-radius:6px;padding:28px;">
    <div style="font-size:20px;font-weight:700;color:${INK};">CrowdGIS</div>
    <div style="height:3px;width:28px;background:${SIGNAL};margin-top:6px;"></div>
    <div style="margin-top:18px;color:#111;font-size:15px;line-height:1.55;">${bodyHtml}</div>
  </div>
</body></html>`
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return error('Token fehlt.', 400)

  const pending = await peekPending(token)
  if (!pending) {
    return page(
      'Link abgelaufen',
      `<strong>Dieser Bestätigungslink ist abgelaufen oder wurde bereits verwendet.</strong>
       <p>Falls du deinen Wunsch schon bestätigt hast, findest du ihn auf dem
       <a href="${appBaseUrl()}" style="color:${INK};">Feature-Board</a>.
       Andernfalls kannst du ihn einfach neu einreichen.</p>`,
      410,
    )
  }

  return page(
    'Feature-Wunsch bestätigen',
    `<strong>Fast geschafft, ${escapeHtml(pending.pseudonym)}!</strong>
     <p>Bestätige jetzt deinen Feature-Wunsch<br>„${escapeHtml(pending.title)}“.</p>
     <form method="POST" action="/api/confirm?token=${encodeURIComponent(token)}">
       <button type="submit" style="background:${INK};color:#fff;border:0;border-radius:4px;padding:12px 22px;font-size:15px;font-weight:600;cursor:pointer;">
         Feature-Wunsch bestätigen
       </button>
     </form>`,
  )
}

export async function POST(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return error('Token fehlt.', 400)

  const pending = await takePending(token)
  if (!pending) {
    return page(
      'Link abgelaufen',
      '<strong>Dieser Bestätigungslink ist abgelaufen oder wurde bereits verwendet.</strong>',
      410,
    )
  }

  const body = [
    `**Eingereicht von:** ${pending.pseudonym}`,
    '',
    '## Anforderung',
    '',
    pending.description,
    '',
    '---',
    '_Eingereicht über das CrowdGIS-Formular. Die Antworten der Studierenden',
    'kommen als Kommentare im Format `Antwort: q1=B` zurück._',
  ].join('\n')

  const issueNumber = await createIssue(pending.title, body)
  // Per-issue secret: only the submitter (via mail links / this redirect)
  // may answer clarifications for this issue.
  const answerKey = randomUUID()
  await Promise.all([
    kv.set(emailKey(issueNumber), pending.email),
    kv.set(answerKeyKey(issueNumber), answerKey),
    kv.sadd(openSetKey(pending.email), issueNumber),
  ])

  return Response.redirect(
    `${appBaseUrl()}/?bestaetigt=${issueNumber}&key=${answerKey}`,
    303,
  )
}
