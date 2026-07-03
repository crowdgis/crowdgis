import { useEffect, useRef, useState } from 'react'
import type { FeatureRequestSummary } from '../../../shared/requests'
import { STATUS_ORDER } from '../../../shared/requests'
import { ApiError, listRequests, upvoteRequest } from '../../lib/requestsApi'
import { StatusChip } from './StatusChip'
import { useRequestsUi } from './store'

/** How often to re-fetch while waiting for a just-confirmed request. */
const CONFIRM_POLL_ATTEMPTS = 5

/** Board: all feature requests grouped by lifecycle order. */
export function Board() {
  const show = useRequestsUi((s) => s.show)
  const confirmedNumber = useRequestsUi((s) => s.confirmedNumber)
  const [requests, setRequests] = useState<FeatureRequestSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const attemptRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function load() {
      try {
        const data = await listRequests()
        if (cancelled) return
        setRequests(data)
        setError(null)
        // The GitHub list can lag a moment behind a fresh confirmation —
        // keep polling briefly until the new request shows up.
        const waitingForConfirmed =
          confirmedNumber !== null &&
          !data.some((r) => r.number === confirmedNumber)
        if (waitingForConfirmed && attemptRef.current < CONFIRM_POLL_ATTEMPTS) {
          attemptRef.current += 1
          timer = setTimeout(() => void load(), 1500 * attemptRef.current)
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : 'Laden fehlgeschlagen.')
      }
    }

    void load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [confirmedNumber])

  async function upvote(number: number) {
    try {
      const { upvotes } = await upvoteRequest(number)
      setRequests(
        (prev) =>
          prev?.map((r) => (r.number === number ? { ...r, upvotes } : r)) ??
          null,
      )
    } catch {
      // Double votes are rejected server-side; nothing to update.
    }
  }

  const confirmedVisible =
    confirmedNumber !== null &&
    (requests?.some((r) => r.number === confirmedNumber) ?? false)

  const banner =
    confirmedNumber !== null ? (
      <div className="border-b border-hairline bg-ink/5 px-4 py-2.5 text-sm text-ink">
        <span className="font-semibold">✓ Dein Feature-Wunsch ist bestätigt.</span>{' '}
        {confirmedVisible
          ? 'Er erscheint unten auf dem Board — der Agent prüft ihn jetzt.'
          : 'Er erscheint gleich unten auf dem Board …'}
      </div>
    ) : null

  if (error) {
    return (
      <>
        {banner}
        <p role="alert" className="p-4 text-sm text-stone">
          {error}
        </p>
      </>
    )
  }
  if (requests === null) {
    return (
      <>
        {banner}
        <p className="p-4 text-sm text-stone">Lädt …</p>
      </>
    )
  }
  if (requests.length === 0) {
    return (
      <>
        {banner}
        <p className="p-4 text-sm text-stone">
          Noch keine Feature-Wünsche. Reiche den ersten ein!
        </p>
      </>
    )
  }

  const sorted = [...requests].sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
      b.upvotes - a.upvotes,
  )

  return (
    <>
      {banner}
      <ul className="flex flex-col">
        {sorted.map((r) => (
          <li
            key={r.number}
            className={`flex items-center gap-2 border-b border-hairline px-4 py-2.5 last:border-b-0 ${
              r.number === confirmedNumber ? 'bg-ink/5' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => void upvote(r.number)}
              title="Upvoten"
              aria-label={`${r.title} upvoten`}
              className="flex min-w-8 flex-col items-center rounded-[3px] border border-hairline px-1 py-0.5 text-xs text-stone hover:border-ink hover:text-ink"
            >
              <span aria-hidden>▲</span>
              <span className="font-mono">{r.upvotes}</span>
            </button>
            <button
              type="button"
              onClick={() => show({ kind: 'detail', number: r.number })}
              className="min-w-0 flex-1 truncate text-left text-sm text-black hover:text-ink"
              title={r.title}
            >
              {r.title}
            </button>
            <StatusChip status={r.status} />
          </li>
        ))}
      </ul>
    </>
  )
}
