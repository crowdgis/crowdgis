# Semester-Reset — sauberer Neustart

Der Branch **`baseline`** (und der Tag **`v1.0-baseline`**) hält den sauberen
Ausgangszustand fest: die reine Basis-App plus die gesamte Infrastruktur
(Mail, Domain, Pipeline, Workflows), aber **ohne** die Features, die während
des Betriebs von Studierenden eingereicht und implementiert wurden.

Ein Reset zu Semesterstart hat **zwei Teile** — Code und Daten.

## 1. Code zurücksetzen

Ziel: alle im Betrieb dazugekommenen Feature-Module entfernen, Infrastruktur
behalten. Dank der Modul-Konvention (`src/features/<id>/` + ein Eintrag in
`src/features/registry.ts`) ist das sauber trennbar.

**Variante A — harter Reset auf die Baseline** (verwirft alles seit dem Nullpunkt):

```bash
git checkout main
git reset --hard baseline
git push --force origin main
```

> ⚠️ Destruktiv: verwirft auch Infrastruktur-Verbesserungen, die nach dem
> Setzen der Baseline auf `main` gemacht wurden. Wenn es solche gab, vorher
> in die Baseline übernehmen (siehe unten) oder Variante B nutzen.

**Variante B — nur die Studierenden-Features entfernen** (behält Infra-Änderungen):
Lösche jeden Feature-Ordner unter `src/features/`, der **nicht** zur Baseline
gehört, und entferne dessen Import + Array-Eintrag aus `registry.ts`.
Baseline-Features (dürfen bleiben):
`data-import`, `layer-manager`, `sketching`, `measure`, `attribute-table`,
`basemaps`, `coordinates`, `feature-requests`, `map-overview`.

> ⚠️ **Grenze von Variante B:** Der Agent integriert manche Wünsche in
> BESTEHENDE Baseline-Module statt einen eigenen Ordner anzulegen
> (Beispiel: Shapefile-Import wurde Teil von `data-import`). Solche
> Erweiterungen entfernt nur **Variante A** zuverlässig. Im Zweifel:
> `git diff baseline main -- src/ package.json` zeigt alles, was seit
> der Baseline dazukam. Variante A ist der Normalfall für den
> Semester-Reset; Variante B nur für punktuelles Aufräumen.

Danach `npm run lint && npm run typecheck && npm test && npm run build` — muss grün sein.

## 2. Daten zurücksetzen (leeres Board)

- **GitHub-Issues schliessen:**
  ```bash
  gh issue list --repo crowdgis/crowdgis --state open --label feature-request \
    --json number -q '.[].number' | xargs -I{} gh issue close {} --repo crowdgis/crowdgis
  ```
  (Optional zusätzlich Issues löschen statt nur schliessen.)
- **KV-Speicher leeren** (Upstash): Upvotes, Mail-Zuordnungen, offene Requests,
  Bestätigungs-Tokens. Am einfachsten in der Upstash-Konsole „Flush Database",
  oder per Redis-CLI `FLUSHDB`. Enthält nur transiente CrowdGIS-Daten.

## Baseline aktuell halten

Wenn während des Betriebs eine **Infrastruktur**-Verbesserung entsteht (kein
Studierenden-Feature, z. B. ein Pipeline-Fix), sollte sie auch in `baseline`
landen — per Cherry-Pick:

```bash
git checkout baseline
git cherry-pick <commit>
git push origin baseline
```

So bleibt der Nullpunkt technisch aktuell, ohne Studierenden-Features aufzunehmen.
