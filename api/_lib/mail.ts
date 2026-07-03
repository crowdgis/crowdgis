import nodemailer from 'nodemailer'
import { requireEnv } from './env'

/**
 * Outbound-only mail (notifications with a link into the app).
 * Students never reply by mail; they answer inside the app.
 */
function transporter() {
  return nodemailer.createTransport({
    host: requireEnv('CROWDGIS_SMTP_HOST'),
    port: Number(requireEnv('CROWDGIS_SMTP_PORT')),
    secure: Number(requireEnv('CROWDGIS_SMTP_PORT')) === 465,
    auth: {
      user: requireEnv('CROWDGIS_SMTP_USER'),
      pass: requireEnv('CROWDGIS_SMTP_PASS'),
    },
  })
}

export async function sendMail(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  await transporter().sendMail({
    from: requireEnv('CROWDGIS_SMTP_FROM'),
    to,
    subject: `[CrowdGIS] ${subject}`,
    text,
  })
}
