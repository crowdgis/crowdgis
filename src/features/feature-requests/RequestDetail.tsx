import { useEffect, useState } from 'react'
import type {
  Clarification,
  FeatureRequestDetail,
} from '../../../shared/requests'
import { ApiError, getRequest, replyToRequest } from '../../lib/requestsApi'
import { getAnswerKey } from './keys'
import { StatusChip } from './StatusChip'
import { useRequestsUi } from './store'

/** Latest unanswered clarification, only relevant in status "rueckfrage". */
function activeClarification(
  detail: FeatureRequestDetail,
): Clarification | null {
  if (detail.status !== 'rueckfrage') return null
  for (const comment of [...detail.comments].reverse()) {
    if (comment.clarification) return comment.clarification
  }
  return null
}

function AnswerForm({
  clarification,
  number,
  answerKey,
  onAnswered,
}: {
  clarification: Clarification
  number: number
  answerKey: string
  onAnswered: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [freeText, setFreeText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = clarification.questions.every((q) => answers[q.id])

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await replyToRequest(number, answers, freeText, answerKey)
      onAnswered()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Senden fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-signal/40 bg-signal/5 p-3">
      <h4 className="label-micro !text-signal">Rückfrage des Agenten</h4>
      {clarification.questions.map((q) => (
        <fieldset key={q.id} className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm text-black">{q.text}</legend>
          {Object.entries(q.options).map(([key, label]) => (
            <label
              key={key}
              className={`flex cursor-pointer items-baseline gap-2 rounded-[3px] border px-2 py-1.5 text-sm ${
                answers[q.id] === key
                  ? 'border-ink bg-ink/5 text-ink'
                  : 'border-hairline text-black hover:border-stone'
              }`}
            >
              <input
                type="radio"
                name={q.id}
                value={key}
                checked={answers[q.id] === key}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: key }))}
                className="accent-ink"
              />
              <span className="font-mono text-xs text-stone">{key}</span>
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <label className="flex flex-col gap-1">
        <span className="label-micro">Ergänzung (optional)</span>
        <textarea
          className="min-h-16 w-full resize-y rounded-[3px] border border-hairline bg-sheet px-2 py-1.5 text-sm"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          maxLength={1000}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-signal">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={!allAnswered || busy}
        onClick={() => void submit()}
        className="rounded-[3px] bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-strong disabled:opacity-50"
      >
        {busy ? 'Sendet …' : 'Antwort senden'}
      </button>
    </div>
  )
}

/** Detail view: description, conversation and answer form. */
export function RequestDetail({ number }: { number: number }) {
  const show = useRequestsUi((s) => s.show)
  const [detail, setDetail] = useState<FeatureRequestDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    setDetail(null)
    getRequest(number)
      .then(setDetail)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'Laden fehlgeschlagen.'),
      )
  }, [number, reloadToken])

  if (error) {
    return (
      <p role="alert" className="p-4 text-sm text-stone">
        {error}
      </p>
    )
  }
  if (!detail) return <p className="p-4 text-sm text-stone">Lädt …</p>

  const clarification = activeClarification(detail)
  const answerKey = getAnswerKey(number)

  return (
    <div className="flex flex-col gap-4 p-4">
      <button
        type="button"
        onClick={() => show({ kind: 'board' })}
        className="self-start text-xs text-stone hover:text-ink"
      >
        ← Zurück zum Board
      </button>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-black">{detail.title}</h3>
        <StatusChip status={detail.status} />
      </div>

      <p className="text-sm whitespace-pre-wrap text-black">
        {detail.description}
      </p>

      {detail.comments.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="label-micro">Verlauf</h4>
          {detail.comments.map((c, i) => (
            <div
              key={i}
              className={`rounded-[3px] border px-2.5 py-2 text-sm whitespace-pre-wrap ${
                c.author === 'student'
                  ? 'ml-6 border-ink/30 bg-ink/5'
                  : 'mr-6 border-hairline bg-paper'
              }`}
            >
              <span className="label-micro mb-1 block">
                {c.author === 'student' ? 'Du' : 'Agent'}
              </span>
              {c.clarification
                ? c.clarification.questions.map((q) => q.text).join('\n')
                : c.body}
            </div>
          ))}
        </div>
      )}

      {clarification &&
        (answerKey ? (
          <AnswerForm
            clarification={clarification}
            number={number}
            answerKey={answerKey}
            onAnswered={() => setReloadToken((t) => t + 1)}
          />
        ) : (
          <p className="border border-hairline bg-paper px-3 py-2 text-xs text-stone">
            Diese Rückfrage kann nur die Person beantworten, die den Wunsch
            eingereicht hat — über den Link in ihrer E-Mail.
          </p>
        ))}
    </div>
  )
}
