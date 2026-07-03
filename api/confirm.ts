import { appBaseUrl } from './_lib/env'
import { createIssue } from './_lib/github'
import { error } from './_lib/http'
import { emailKey, kv, openSetKey, takePending } from './_lib/kv'

/**
 * GET /api/confirm?token=… — e-mail confirmation link.
 * Creates the public GitHub issue (without PII) and redirects to the app.
 */
export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return error('Token fehlt.', 400)

  const pending = await takePending(token)
  if (!pending) {
    return new Response(
      'Dieser Bestätigungslink ist abgelaufen oder wurde bereits verwendet.',
      { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
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
  await kv.set(emailKey(issueNumber), pending.email)
  await kv.sadd(openSetKey(pending.email), issueNumber)

  return Response.redirect(
    `${appBaseUrl()}/?bestaetigt=${issueNumber}`,
    303,
  )
}
