/** JSON response helper. Board data must always be fresh — never cache. */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

/** German user-facing error as JSON. */
export function error(message: string, status: number): Response {
  return json({ error: message }, status)
}

/**
 * Extract the request number from a `/api/requests/<id>/...` URL.
 * Vercel's Web-handler runtime does not pass Next.js-style `params`,
 * so dynamic routes read the id from the path themselves.
 * Returns null when the segment after "requests" is not a positive integer.
 */
export function requestIdFromUrl(url: string): number | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  const idx = segments.indexOf('requests')
  const raw = idx >= 0 ? segments[idx + 1] : undefined
  const number = Number(raw)
  return Number.isInteger(number) && number > 0 ? number : null
}
