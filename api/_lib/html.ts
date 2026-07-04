/**
 * Shared helpers for server-rendered HTML (mails, confirm page).
 * Single home for the brand tokens and the XSS escaper so the mail and
 * the confirm page — seen seconds apart in the same flow — cannot drift.
 */

/** Brand palette — keep in sync with src/index.css (@theme). */
export const INK = '#2b336a'
export const SIGNAL = '#870010'
export const STONE = '#7c7c6b'
export const PAPER = '#f6f6f3'
export const HAIRLINE = '#d9d9d2'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
