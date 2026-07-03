import { optionalEnv, requireEnv } from './env'

/**
 * Outbound-only mail (notifications with a link into the app).
 * Students never reply by mail; they answer inside the app.
 *
 * Primary provider: AgentMail (dedicated project inbox, API-based,
 * enables inbound webhooks as a future intake channel).
 * Fallback: classic SMTP via nodemailer when SMTP env vars are set
 * and no AgentMail key is configured.
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  if (process.env.AGENTMAIL_API_KEY) {
    await sendViaAgentMail(to, `[CrowdGIS] ${subject}`, text)
    return
  }
  await sendViaSmtp(to, `[CrowdGIS] ${subject}`, text)
}

async function sendViaAgentMail(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const inboxId = requireEnv('CROWDGIS_MAIL_INBOX_ID')
  const res = await fetch(
    `https://api.agentmail.to/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${requireEnv('AGENTMAIL_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text }),
    },
  )
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`AgentMail send failed: ${res.status} ${detail.slice(0, 200)}`)
  }
}

async function sendViaSmtp(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const { default: nodemailer } = await import('nodemailer')
  const port = Number(requireEnv('CROWDGIS_SMTP_PORT'))
  const transporter = nodemailer.createTransport({
    host: requireEnv('CROWDGIS_SMTP_HOST'),
    port,
    secure: port === 465,
    auth: {
      user: requireEnv('CROWDGIS_SMTP_USER'),
      pass: requireEnv('CROWDGIS_SMTP_PASS'),
    },
  })
  await transporter.sendMail({
    from: optionalEnv('CROWDGIS_SMTP_FROM', requireEnv('CROWDGIS_SMTP_USER')),
    to,
    subject,
    text,
  })
}
