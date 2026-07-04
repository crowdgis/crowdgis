/**
 * Shared e-mail layout for all outbound mails.
 *
 * Produces BOTH a plain-text and an HTML part (multipart/alternative),
 * which improves deliverability and trust versus a bare-link plain text:
 * clean brand layout, a real call-to-action button, and a footer that
 * explains who sends this and why the recipient got it.
 */

import { escapeHtml, INK, SIGNAL, STONE } from './html.js'

export interface EmailButton {
  label: string
  url: string
}

export interface EmailContent {
  /** Bold heading at the top of the message body. */
  heading: string
  /** Body paragraphs (plain sentences, no markup). */
  paragraphs: string[]
  /** Optional call-to-action button (also rendered as a visible link). */
  button?: EmailButton
  /** Footer line telling the recipient why they received this mail. */
  reason: string
}

const FOOTER_LINE =
  'CrowdGIS – ein Lehrprojekt an der ZHAW. Diese Nachricht wurde automatisch versendet.'

export function renderEmail(content: EmailContent): {
  text: string
  html: string
} {
  const text = [
    content.heading,
    '',
    ...content.paragraphs,
    ...(content.button
      ? ['', `${content.button.label}:`, content.button.url]
      : []),
    '',
    '—',
    content.reason,
    FOOTER_LINE,
  ].join('\n')

  const paragraphsHtml = content.paragraphs
    .map(
      (p) =>
        `<tr><td style="padding:0 0 14px;color:#111111;font-size:15px;line-height:1.55;">${escapeHtml(p).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('')

  const buttonHtml = content.button
    ? `<tr><td style="padding:6px 0 20px;">
           <a href="${escapeHtml(content.button.url)}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:4px;">${escapeHtml(content.button.label)}</a>
         </td></tr>
         <tr><td style="padding:0 0 6px;color:${STONE};font-size:12px;line-height:1.5;">Falls der Button nicht funktioniert, öffne diesen Link im Browser:<br>
           <a href="${escapeHtml(content.button.url)}" style="color:${INK};word-break:break-all;">${escapeHtml(content.button.url)}</a></td></tr>`
    : ''

  const html = `<!doctype html>
<html lang="de">
<body style="margin:0;padding:0;background:#f6f6f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #d9d9d2;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="padding:22px 28px 0;">
          <span style="font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.3px;">CrowdGIS</span>
          <div style="height:3px;width:28px;background:${SIGNAL};margin-top:6px;line-height:3px;font-size:0;">&nbsp;</div>
        </td></tr>
        <tr><td style="padding:18px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 12px;font-size:17px;font-weight:700;color:#111111;">${escapeHtml(content.heading)}</td></tr>
            ${paragraphsHtml}
            ${buttonHtml}
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 22px;border-top:1px solid #d9d9d2;color:${STONE};font-size:12px;line-height:1.55;">
          ${escapeHtml(content.reason)}<br>${escapeHtml(FOOTER_LINE)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { text, html }
}
