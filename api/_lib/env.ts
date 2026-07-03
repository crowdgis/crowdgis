/** Read a required environment variable, throwing a clear error if unset. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

/** "owner/repo" of the GitHub repository holding the issues. */
export const githubRepo = () => requireEnv('CROWDGIS_GITHUB_REPO')
export const githubToken = () => requireEnv('CROWDGIS_GITHUB_TOKEN')
export const courseCode = () => requireEnv('CROWDGIS_COURSE_CODE')
export const appBaseUrl = () => requireEnv('CROWDGIS_APP_BASE_URL')
export const webhookSecret = () => requireEnv('CROWDGIS_WEBHOOK_SECRET')
/** Mail suffixes students may use, comma-separated, e.g. "zhaw.ch,gmail.com". */
export const allowedMailSuffixes = () =>
  optionalEnv('CROWDGIS_MAIL_SUFFIX', 'zhaw.ch')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
/**
 * Maximum simultaneously OPEN requests per student (not a semester total).
 * A slot frees up as soon as a request goes live or is rejected, so this
 * only limits how many a student has in flight at once.
 */
export const maxOpenPerStudent = () =>
  Number(optionalEnv('CROWDGIS_MAX_OPEN_PER_STUDENT', '5'))

/** New confirmation mails a single address may trigger per day. */
export const confirmMailsPerDay = () =>
  Number(optionalEnv('CROWDGIS_CONFIRM_MAILS_PER_DAY', '15'))
