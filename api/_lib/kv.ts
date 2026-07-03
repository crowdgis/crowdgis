import { Redis } from '@upstash/redis'

/**
 * Private key-value store (Upstash Redis).
 * Holds everything that must NOT appear in public GitHub issues:
 * student e-mail addresses, confirmation tokens, upvote counters.
 * The Vercel Marketplace integration exposes KV_REST_API_* names;
 * plain Upstash setups use UPSTASH_REDIS_REST_*.
 */
function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }
  throw new Error(`Missing environment variable: ${names[0]}`)
}

export const kv = new Redis({
  url: readEnv('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'),
  token: readEnv('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'),
})

export interface PendingRequest {
  title: string
  description: string
  email: string
  pseudonym: string
  createdAt: string
}

const PENDING_TTL_SECONDS = 60 * 60 * 24 * 3 // confirm within 3 days

export const pendingKey = (token: string) => `pending:${token}`
export const emailKey = (issueNumber: number) => `email:${issueNumber}`
export const openSetKey = (email: string) => `open:${email.toLowerCase()}`
export const upvoteKey = (issueNumber: number) => `upvotes:${issueNumber}`
export const upvoterKey = (issueNumber: number, voter: string) =>
  `upvoted:${issueNumber}:${voter}`

export async function storePending(
  token: string,
  request: PendingRequest,
): Promise<void> {
  await kv.set(pendingKey(token), request, { ex: PENDING_TTL_SECONDS })
}

export async function takePending(
  token: string,
): Promise<PendingRequest | null> {
  const key = pendingKey(token)
  const value = await kv.get<PendingRequest>(key)
  if (value) await kv.del(key)
  return value ?? null
}
