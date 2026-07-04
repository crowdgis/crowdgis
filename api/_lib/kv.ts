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
/** Per-issue secret; required to answer clarifications (reply endpoint). */
export const answerKeyKey = (issueNumber: number) => `answerkey:${issueNumber}`
/** Rate-limit counters (INCR + EXPIRE). */
const rateKey = (scope: string, id: string) => `rl:${scope}:${id}`

export async function storePending(
  token: string,
  request: PendingRequest,
): Promise<void> {
  await kv.set(pendingKey(token), request, { ex: PENDING_TTL_SECONDS })
}

export async function takePending(
  token: string,
): Promise<PendingRequest | null> {
  // Atomic GETDEL: even two concurrent confirmations redeem exactly once
  // (mail-security link scanners tend to fetch links more than once).
  return kv.getdel<PendingRequest>(pendingKey(token))
}

/** Peek at a pending request without consuming it (for the confirm page). */
export async function peekPending(
  token: string,
): Promise<PendingRequest | null> {
  return kv.get<PendingRequest>(pendingKey(token))
}

/**
 * Increment a rate-limit counter; true when the limit is exceeded.
 * The window starts with the first hit and expires automatically.
 */
export async function rateLimited(
  scope: string,
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = rateKey(scope, id)
  // Single round-trip; NX sets the TTL only when the window starts, and
  // never leaves a TTL-less counter behind.
  const [count] = await kv
    .pipeline()
    .incr(key)
    .expire(key, windowSeconds, 'NX')
    .exec<[number, 0 | 1]>()
  return count > limit
}
