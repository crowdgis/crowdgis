import type { FeatureRequestDetail, RequestComment } from '../../../shared/requests.js'
import { parseClarification, statusFromLabels } from '../../../shared/requests.js'
import { getIssue, listComments } from '../../_lib/github.js'
import { error, json, requestIdFromUrl } from '../../_lib/http.js'
import { kv, upvoteKey } from '../../_lib/kv.js'

/** GET /api/requests/:id — request detail incl. conversation. */
export async function GET(request: Request): Promise<Response> {
  const number = requestIdFromUrl(request.url)
  if (number === null) {
    return error('Ungültige Nummer.', 400)
  }

  const issue = await getIssue(number)
  const isFeatureRequest =
    !issue.pull_request &&
    issue.labels.some((l) => l.name === 'feature-request')
  if (!isFeatureRequest) return error('Nicht gefunden.', 404)

  const ghComments = await listComments(number)
  const comments: RequestComment[] = ghComments.map((c) => ({
    author: c.body.startsWith('Antwort:') ? 'student' : 'agent',
    body: c.body,
    createdAt: c.created_at,
    clarification: parseClarification(c.body),
  }))

  const detail: FeatureRequestDetail = {
    number: issue.number,
    title: issue.title,
    status: statusFromLabels(issue.labels.map((l) => l.name)),
    createdAt: issue.created_at,
    upvotes: (await kv.get<number>(upvoteKey(number))) ?? 0,
    description: issue.body ?? '',
    comments,
  }
  return json(detail)
}
