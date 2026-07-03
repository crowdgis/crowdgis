import { useEffect, useState } from 'react'
import type { FeatureRequestSummary } from '../../../shared/requests'
import { STATUS_ORDER } from '../../../shared/requests'
import { ApiError, listRequests, upvoteRequest } from '../../lib/requestsApi'
import { StatusChip } from './StatusChip'
import { useRequestsUi } from './store'

/** Board: all feature requests grouped by lifecycle order. */
export function Board() {
  const show = useRequestsUi((s) => s.show)
  const [requests, setRequests] = useState<FeatureRequestSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listRequests()
      .then(setRequests)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'Laden fehlgeschlagen.'),
      )
  }, [])

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

  if (error) {
    return (
      <p role="alert" className="p-4 text-sm text-stone">
        {error}
      </p>
    )
  }
  if (requests === null) {
    return <p className="p-4 text-sm text-stone">Lädt …</p>
  }
  if (requests.length === 0) {
    return (
      <p className="p-4 text-sm text-stone">
        Noch keine Feature-Wünsche. Reiche den ersten ein!
      </p>
    )
  }

  const sorted = [...requests].sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
      b.upvotes - a.upvotes,
  )

  return (
    <ul className="flex flex-col">
      {sorted.map((r) => (
        <li
          key={r.number}
          className="flex items-center gap-2 border-b border-hairline px-4 py-2.5 last:border-b-0"
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
  )
}
