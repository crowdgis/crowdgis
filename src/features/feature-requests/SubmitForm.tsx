import { useState } from 'react'
import type { SubmitPayload } from '../../../shared/requests'
import { ApiError, submitRequest } from '../../lib/requestsApi'
import { validateSubmit } from './validate'

const FIELD_CLASSES =
  'w-full rounded-[3px] border border-hairline bg-sheet px-2 py-1.5 text-sm text-black placeholder:text-stone/70'

/** Submission form for a new feature request. */
export function SubmitForm() {
  const [payload, setPayload] = useState<SubmitPayload>({
    title: '',
    description: '',
    email: '',
    courseCode: '',
    pseudonym: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function update<K extends keyof SubmitPayload>(key: K, value: string) {
    setPayload((p) => ({ ...p, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateSubmit(payload)
    if (validationError) {
      setError(validationError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await submitRequest(payload)
      setSent(true)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Senden fehlgeschlagen.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold text-ink">Fast geschafft!</h3>
        <p className="text-sm text-black">
          Wir haben dir eine Mail geschickt. Bestätige deinen Wunsch über den
          Link darin — erst dann erscheint er auf dem Board.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3 p-4">
      <p className="text-xs text-stone">
        Beschreibe dein Feature so präzise, dass ein KI-Agent es bauen kann:
        Was soll es tun? Warum brauchst du es? Wie verhält es sich genau?
      </p>

      <label className="flex flex-col gap-1">
        <span className="label-micro">Titel</span>
        <input
          className={FIELD_CLASSES}
          value={payload.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="z.B. Distanzmessung mit Zwischensummen"
          maxLength={120}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-micro">Beschreibung</span>
        <textarea
          className={`${FIELD_CLASSES} min-h-36 resize-y`}
          value={payload.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder={
            'Was: …\nWarum: …\nErwartetes Verhalten: …\nGrenzfälle: …'
          }
          maxLength={5000}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="label-micro">Kürzel (öffentlich)</span>
          <input
            className={FIELD_CLASSES}
            value={payload.pseudonym}
            onChange={(e) => update('pseudonym', e.target.value)}
            placeholder="z.B. mm"
            maxLength={30}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-micro">Kurscode</span>
          <input
            className={FIELD_CLASSES}
            value={payload.courseCode}
            onChange={(e) => update('courseCode', e.target.value)}
            placeholder="aus dem Unterricht"
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="label-micro">ZHAW-E-Mail (bleibt privat)</span>
        <input
          type="email"
          className={FIELD_CLASSES}
          value={payload.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="vorname.nachname@students.zhaw.ch"
          required
        />
      </label>

      {error && (
        <p role="alert" className="text-xs text-signal">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-[3px] bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-strong disabled:opacity-60"
      >
        {busy ? 'Sendet …' : 'Feature-Wunsch einreichen'}
      </button>
    </form>
  )
}
