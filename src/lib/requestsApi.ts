import type {
  FeatureRequestDetail,
  FeatureRequestSummary,
  SubmitPayload,
} from '../../shared/requests'

/** Error whose message is safe to show to students (German). */
export class ApiError extends Error {}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    try {
      return (await res.json()) as T
    } catch {
      // ok-status but no JSON: dev server without serverless functions
      throw new ApiError(
        'Backend nicht verbunden. Das Feature-Board ist erst im Deployment aktiv.',
      )
    }
  }
  let message = 'Unerwarteter Fehler.'
  try {
    const data = (await res.json()) as { error?: string }
    if (data.error) message = data.error
  } catch {
    // non-JSON error body
  }
  throw new ApiError(message)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError('Backend nicht erreichbar. Bitte später erneut versuchen.')
  }
  return handle<T>(res)
}

export function listRequests(): Promise<FeatureRequestSummary[]> {
  return request('/api/requests')
}

export function getRequest(number: number): Promise<FeatureRequestDetail> {
  return request(`/api/requests/${number}`)
}

export function submitRequest(
  payload: SubmitPayload,
): Promise<{ ok: boolean; message: string }> {
  return request('/api/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function replyToRequest(
  number: number,
  answers: Record<string, string>,
  freeText: string,
): Promise<{ ok: boolean }> {
  return request(`/api/requests/${number}/reply`, {
    method: 'POST',
    body: JSON.stringify({ answers, freeText }),
  })
}

const VOTER_KEY = 'crowdgis-voter'

/** Stable anonymous voter id for upvote deduplication. */
export function voterId(): string {
  let id = localStorage.getItem(VOTER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VOTER_KEY, id)
  }
  return id
}

export function upvoteRequest(
  number: number,
): Promise<{ ok: boolean; upvotes: number }> {
  return request(`/api/requests/${number}/upvote`, {
    method: 'POST',
    body: JSON.stringify({ voter: voterId() }),
  })
}
