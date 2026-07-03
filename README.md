# CrowdGIS

Ein Lehrexperiment der ZHAW: Studierende reichen Feature-Anforderungen für
dieses Web-GIS ein. Ein KI-Agent analysiert die Anforderungen, stellt bei
Unklarheiten strukturierte Rückfragen und implementiert die Features
automatisch. Lernziel: präzises Formulieren von Anforderungen.

## Stack

- React 19 + TypeScript (strict) + Vite + Tailwind CSS
- Leaflet / react-leaflet, zustand, proj4 (LV95)
- Tests: Vitest (+ Playwright geplant)
- Hosting: Vercel (Preview-Deployment pro PR)
- Agent: Claude Code GitHub Action (Triage + Implementierung)

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server
npm test           # Unit-Tests
npm run lint       # Oxlint
npm run typecheck  # TypeScript
npm run build      # Produktions-Build
```

## Architektur

Features sind eigenständige Module unter `src/features/<id>/` und werden über
die Registry (`src/features/registry.ts`) eingehängt — Details und verbindliche
Regeln für den Agenten in [CLAUDE.md](CLAUDE.md).

## Feature-Request-Pipeline

```
Formular (App) → Bestätigungsmail → GitHub Issue (öffentlich, ohne PII)
  → triage.yml (Agent: Rückfragen als JSON / "bereit")
  → Hanno setzt Label "freigegeben" (1 Klick)
  → implement.yml (Agent: Branch + Feature + Tests) → PR + Preview
  → Merge = live, Mail an Studierende
```

Status-Labels: `eingereicht → rueckfrage ↔ eingereicht → bereit → freigegeben
→ in-arbeit → testing → live` | `verworfen`

## Setup (einmalig, nach dem Push in die Org)

1. **Labels anlegen:**
   ```bash
   for l in feature-request eingereicht rueckfrage bereit freigegeben in-arbeit testing live verworfen; do
     gh label create "$l" --repo CrowdGIS/crowdgis || true
   done
   ```
2. **Repo-Secret** `CLAUDE_CODE_OAUTH_TOKEN` setzen (`claude setup-token`).
3. **Vercel:** Repo importieren (Framework Vite), Upstash Redis über den
   Marketplace verbinden, Env-Vars gemäss [.env.example](.env.example) setzen.
4. **GitHub-Webhook** (Repo → Settings → Webhooks): URL
   `https://<app>/api/github-webhook`, Content type `application/json`,
   Secret = `CROWDGIS_WEBHOOK_SECRET`, Events: *Issues*, *Issue comments*.
5. **Branch Protection** auf `main`: CI-Check erforderlich, 1 Review.

## Hinweise

- `npm audit` meldet Findings in der webpack4-Kette von `georaster` —
  das sind falsch deklarierte Build-Zeit-Abhängigkeiten, die nicht ins
  Browser-Bundle gelangen.
- E-Mail-Adressen der Studierenden landen nie in GitHub; die Zuordnung
  Issue↔Mail liegt ausschliesslich im privaten Upstash-Store.
