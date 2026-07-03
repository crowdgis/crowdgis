/** JSON response helper. */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

/** German user-facing error as JSON. */
export function error(message: string, status: number): Response {
  return json({ error: message }, status)
}
