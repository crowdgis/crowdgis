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

Der Feature-Request-Workflow (Formular → GitHub Issue → Triage → Freigabe →
automatische Implementierung → PR → Preview → Merge) ist im
Implementierungsplan dokumentiert und wird in den Meilensteinen M3–M5 gebaut.
