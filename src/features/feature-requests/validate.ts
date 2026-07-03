import type { SubmitPayload } from '../../../shared/requests'

/**
 * Client-side validation, mirroring the server rules.
 * Returns a German error message or null when valid.
 */
export function validateSubmit(payload: SubmitPayload): string | null {
  if (payload.title.trim().length < 5) {
    return 'Der Titel muss mindestens 5 Zeichen lang sein.'
  }
  if (payload.title.trim().length > 120) {
    return 'Der Titel darf höchstens 120 Zeichen lang sein.'
  }
  if (payload.description.trim().length < 30) {
    return 'Beschreibe dein Feature etwas ausführlicher (mind. 30 Zeichen): Was soll es tun? Warum? Wie verhält es sich?'
  }
  if (payload.pseudonym.trim().length < 2) {
    return 'Bitte gib ein Kürzel an (wird öffentlich angezeigt).'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email.trim())) {
    return 'Bitte gib eine gültige E-Mail-Adresse an.'
  }
  if (payload.courseCode.trim().length === 0) {
    return 'Bitte gib den Kurscode aus dem Unterricht an.'
  }
  return null
}
