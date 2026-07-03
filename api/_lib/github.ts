import { githubRepo, githubToken } from './env'

const API = 'https://api.github.com'

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub ${init?.method ?? 'GET'} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export interface GhLabel {
  name: string
}

export interface GhIssue {
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  created_at: string
  labels: GhLabel[]
}

export interface GhComment {
  body: string
  created_at: string
  user: { login: string; type: string }
}

/** Create a feature-request issue; returns the issue number. */
export async function createIssue(
  title: string,
  body: string,
): Promise<number> {
  const issue = await gh<GhIssue>(`/repos/${githubRepo()}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      labels: ['feature-request', 'eingereicht'],
    }),
  })
  return issue.number
}

export async function listFeatureRequests(): Promise<GhIssue[]> {
  return gh<GhIssue[]>(
    `/repos/${githubRepo()}/issues?labels=feature-request&state=all&per_page=100&sort=created&direction=desc`,
  )
}

export async function getIssue(number: number): Promise<GhIssue> {
  return gh<GhIssue>(`/repos/${githubRepo()}/issues/${number}`)
}

export async function listComments(number: number): Promise<GhComment[]> {
  return gh<GhComment[]>(
    `/repos/${githubRepo()}/issues/${number}/comments?per_page=100`,
  )
}

export async function addComment(number: number, body: string): Promise<void> {
  await gh(`/repos/${githubRepo()}/issues/${number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

export async function setLabels(
  number: number,
  add: string[],
  remove: string[],
): Promise<void> {
  if (add.length > 0) {
    await gh(`/repos/${githubRepo()}/issues/${number}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labels: add }),
    })
  }
  for (const label of remove) {
    await gh(
      `/repos/${githubRepo()}/issues/${number}/labels/${encodeURIComponent(label)}`,
      { method: 'DELETE' },
    ).catch(() => {
      // Removing a label that is not present is fine.
    })
  }
}
