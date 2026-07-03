import { error, json } from '../../_lib/http.js'
import { kv, upvoteKey, upvoterKey } from '../../_lib/kv.js'

interface UpvotePayload {
  /** Anonymous client id (localStorage), guards against double votes. */
  voter: string
}

/** POST /api/requests/:id/upvote */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const number = Number(params.id)
  if (!Number.isInteger(number) || number <= 0) {
    return error('Ungültige Nummer.', 400)
  }

  let payload: UpvotePayload
  try {
    payload = (await request.json()) as UpvotePayload
  } catch {
    return error('Ungültige Anfrage.', 400)
  }
  const voter = payload.voter?.trim() ?? ''
  if (voter.length < 8 || voter.length > 64) {
    return error('Ungültige Stimme.', 400)
  }

  const marker = upvoterKey(number, voter)
  const isNew = await kv.set(marker, 1, { nx: true })
  if (isNew === null) {
    return error('Du hast bereits abgestimmt.', 409)
  }
  const upvotes = await kv.incr(upvoteKey(number))
  return json({ ok: true, upvotes })
}
