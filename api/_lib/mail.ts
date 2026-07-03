import { optionalEnv, requireEnv } from './env.js'

/**
 * Outbound-only mail (notifications with a link into the app).
 * Students never reply by mail; they answer inside the app.
 *
 * Every mail is sent multipart (plain text + HTML) — see email-template.ts.
 *
 * Provider selection (in order):
 * 1. SMTP — used as soon as host + password are configured. This is the
 *    production path (custom domain sender mail@crowdgis.ch via Infomaniak,
 *    which authenticates SPF/DKIM/DMARC for reliable delivery to ZHAW).
 * 2. AgentMail — fallback while SMTP is not yet fully set up.
 *
 * This ordering lets us switch from AgentMail to SMTP by simply adding the
 * SMTP password in Vercel — no code change and no downtime in between.
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const withPrefix = `[CrowdGIS] ${subject}`
  if (process.env.CROWDGIS_SMTP_HOST && process.env.CROWDGIS_SMTP_PASS) {
    await sendViaSmtp(to, withPrefix, text, html)
    return
  }
  if (process.env.AGENTMAIL_API_KEY) {
    await sendViaAgentMail(to, withPrefix, text, html)
    return
  }
  throw new Error('No mail provider configured (set SMTP or AgentMail env vars).')
}

async function sendViaAgentMail(
  to: string,
  subject: string,
  text: string,
  html?: string,
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
      body: JSON.stringify(html ? { to, subject, text, html } : { to, subject, text }),
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
  html?: string,
): Promise<void> {
  const { default: nodemailer } = await import('nodemailer')
  const port = Number(requireEnv('CROWDGIS_SMTP_PORT'))
  const from = optionalEnv('CROWDGIS_SMTP_FROM', requireEnv('CROWDGIS_SMTP_USER'))
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
    from,
    // A monitored Reply-To on our own domain reads as trustworthy to filters.
    replyTo: from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  })
}
