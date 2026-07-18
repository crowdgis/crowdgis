# GRIMLICHT — Vollständiger Umsetzungsplan

**Projekttyp:** Rasterbasierter Taktik-Dungeon-Crawler (Web, komplett clientseitig)
**Arbeitstitel:** *Grimlicht: Die Tiefen von Vhalen*
**Genre-Vorbilder:** Warhammer Quest (1995), WHQ: Silver Tower (2016), WHQ: Blackstone Fortress (2017) — ausschließlich als Genre-Referenz. **Keine Warhammer-IP**: eigenes Universum, eigene Namen, eigene Lore, eigene Symbolik.
**Ziel:** Ein vollständig spielbarer Dungeon-Crawler mit rasterbasiertem Taktikkampf, prozeduraler Dungeon-Erkundung, Helden-Progression und Kampagne in einem neuen, eigenständigen Universum.

---

## 1. Vision & Design-Säulen

### 1.1 Das Beste aus drei Teilen

| Quelle (Genre-Referenz) | Was übernommen wird (als Mechanik-Idee, nicht als Inhalt) |
|---|---|
| **Warhammer Quest (1995)** | Tiefe Kampagne: Helden reisen zwischen Dungeons in Siedlungen, kaufen aus, trainieren, würfeln Stadtereignisse. Brutale, ereignisgetriebene Dungeons („jede Runde kann etwas passieren"). Loot-Tabellen mit echten Fundmomenten. |
| **Silver Tower (2016)** | Elegante Aktionsökonomie: Aktionswürfel-Pool pro Held und Runde, Fähigkeiten kosten bestimmte Würfelwerte. Renown/Ruhm als Progressionswährung. Klar unterscheidbare Heldenarchetypen mit je einzigartiger Spezialmechanik. |
| **Blackstone Fortress (2017)** | Erkundungs-/Entdeckungsfluss: Expedition → Vorstoß → Rückzug-Entscheidung („noch ein Raum oder sicher raus?"). Verhaltenstabellen-KI für Gegner (deterministisch, lesbar, taktisch ausspielbar). Initiative-Leiste, in der Helden- und Gegneraktivierungen verzahnt sind. |

### 1.2 Design-Säulen (bindend für alle Entscheidungen)

1. **Raster ist König.** Jede Kampfsituation ist auf einem quadratischen Raster lesbar: Position, Reichweite, Sichtlinie, Zonen. Kein Effekt ohne räumliche Bedeutung.
2. **Push your luck.** Der Spieler entscheidet ständig zwischen Gier und Sicherheit (weiter erkunden vs. Rückzug; Würfel für Angriff oder Verteidigung binden).
3. **Lesbare Gegner.** Gegner-KI folgt offenen Verhaltensregeln. Der Spieler kann Züge antizipieren und ausspielen — Taktik statt Zufall.
4. **Jeder Held fühlt sich anders an.** Vier Klassen mit je eigener Sondermechanik, nicht nur anderen Zahlen.
5. **Eigenes Universum.** Keine Anlehnung an geschützte Namen, Fraktionen, Symbole oder Texte. Alles Neue: siehe Lore-Bibel (Phase 6).
6. **Alles clientseitig.** Kein Backend. Speicherstände in IndexedDB, deterministische Seeds, keine Accounts.

### 1.3 Das eigene Universum (Kurzfassung; Ausarbeitung in Phase 6)

> **Die Welt Vhalen** zerbrach vor dreihundert Jahren im „Aschefall", als der unterirdische Sonnenkern erlosch. Seither wuchern unter der erkalteten Oberfläche die **Tiefen**: alte Städte, Maschinenhallen und Tempel, durchdrungen vom **Grimlicht** — einer kalten Restenergie des toten Kerns, die Materie verformt und Kreaturen hervorbringt. Von der letzten freien Stadt **Aschport** aus steigen **Lichtfahrer** (die Helden) in die Tiefen: für Relikte, für Antworten — und um den Kern neu zu entzünden, bevor das Grimlicht die Oberfläche erreicht.

- **Fraktionen der Gegner (neu, eigenständig):** die *Hohlgeborenen* (vom Grimlicht verformte Menschen), der *Rostbund* (fehlgeleitete Maschinenkulte), die *Fahlen* (lichtlose Tiefenkreaturen), die *Kammer der Stille* (Endgegner-Kult, will den Kern für immer löschen).
- **Heldenklassen (neu, eigenständig):** *Bannwart* (Nahkampf-Bollwerk), *Aschjägerin* (Fernkampf/Fallen), *Kernschmied* (Unterstützung/Maschinen), *Lichtsucherin* (Grimlicht-Wirkerin, riskante Magie).

---

## 2. Technische Leitplanken (bindend)

| Bereich | Vorgabe |
|---|---|
| Sprache/Stack | TypeScript (strict), React 19, Vite, Tailwind. Eigenständige App (eigenes Repo/eigener Ordner), **nicht** in bestehende Produkte integriert. |
| Rendering | Spielfeld als eigenes Canvas-/SVG-Rendering (PixiJS erlaubt); UI-Chrome (Menüs, HUD-Panels) in React. |
| State | zustand-Stores; strikte Trennung: `GameState` (Simulation, serialisierbar, UI-frei) vs. `UiState` (Auswahl, Hover, Animationen). |
| Determinismus | Eine zentrale, seedbare PRNG-Instanz (`mulberry32` o. ä.). **Kein** `Math.random()` in der Simulation. Gleicher Seed + gleiche Eingaben ⇒ gleicher Spielverlauf. |
| Architektur | Simulation als reine Funktionen: `reduce(state, action) → state + events`. Renderer/UI konsumieren Events. Keine Simulation im React-Baum. |
| Persistenz | IndexedDB (Bibliothek: `idb`), Save-Schema versioniert mit Migrationspfad. |
| Tests | Vitest für Logik (Pflicht für jede Regel-/Generator-Funktion), Playwright für E2E-Smokes. |
| Qualitäts-Gates | `lint`, `typecheck`, `test`, `build` grün als Abschlusskriterium **jeder** Task. UI-Änderungen zusätzlich E2E-Smoke. |
| Sprache | UI-Texte und Lore Deutsch; Code, Kommentare, Commits Englisch. |
| Assets | Nur selbst erstellte oder klar lizenzfreie (CC0) Assets. Platzhalter: geometrische Formen + Emoji sind ausdrücklich erlaubt bis Phase 7. |

**Definition of Done — global (gilt zusätzlich zu jeder Task-DoD):**
- Alle vier Qualitäts-Gates grün.
- Neue Logik hat Unit-Tests (mindestens Happy Path + 1 Randfall).
- Keine `any`-Typen, keine auskommentierten Codeblöcke, keine TODO-Reste ohne Ticket.
- Feature ist über die laufende App erreichbar und manuell verifiziert (kurzer Verifikationsvermerk im PR).

---

## 3. Phasenübersicht & Meilensteine

| Phase | Titel | Meilenstein („spielbar heißt…") |
|---|---|---|
| 0 | Projektfundament | App startet, leeres Spielfeld rendert, CI grün. |
| 1 | Raster & Taktik-Kern | Eine Heldin bewegt sich regelkonform über ein Test-Raster (Zug, Sichtlinie, Hindernisse). |
| 2 | Kampfsystem | Voller Kampf 4 Helden vs. Gegnerwelle auf Testkarte, Sieg/Niederlage erkannt. |
| 3 | Dungeon & Erkundung | Prozeduraler Dungeon wird Raum für Raum aufgedeckt und durchkämpft, Rückzug möglich. |
| 4 | Helden & Progression | Alle 4 Klassen spielbar, Loot, Level-Ups, Inventar. |
| 5 | Kampagne & Siedlung | Questkette mit Stadtphase; Kampagne von Anfang bis Endboss durchspielbar. |
| 6 | Lore & Content | Voller Content-Umfang: Bestiarium, Items, Quests, Texte — alles im eigenen Universum. |
| 7 | UI/UX, Audio, Polish | Das Spiel sieht nach Spiel aus, klingt, animiert, ist zugänglich. |
| 8 | Balancing, QA, Release | Getunte Schwierigkeit, Savegame-Stabilität, Release-Build. |

Phasen sind sequenziell; innerhalb einer Phase dürfen Tasks parallelisiert werden, wenn ihre Abhängigkeiten (jeweils angegeben) erfüllt sind.

---

## Phase 0 — Projektfundament

**Ziel:** Lauffähiges, getestetes Grundgerüst mit sauberer Architektur-Trennung.

### Task 0.1 — Projekt-Scaffold
**Vorgaben:** Vite + React 19 + TS strict + Tailwind aufsetzen; ESLint (typed rules) + Prettier; Vitest + Playwright konfiguriert; Ordnerstruktur anlegen:
```
src/
├── engine/        → reine Simulation (kein React, kein DOM)
│   ├── core/      → PRNG, Events, Reducer-Infrastruktur
│   ├── grid/      → Raster, Pfadfindung, Sichtlinie
│   ├── combat/    → Kampfregeln
│   ├── dungeon/   → Generierung & Erkundung
│   ├── heroes/    → Klassen, Progression
│   ├── campaign/  → Quests, Siedlung, Meta
│   └── content/   → Daten (Bestiarium, Items, Quests) als typisierte TS-Module
├── render/        → Canvas-/Pixi-Renderer für das Spielfeld
├── ui/            → React-Komponenten (HUD, Menüs, Panels)
├── state/         → zustand-Stores (GameState-Anbindung, UiState)
└── save/          → Persistenz (IndexedDB, Schema-Migrationen)
```
**Subtasks:**
- 0.1.1 Toolchain & Scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`). *DoD:* Alle Scripts laufen lokal fehlerfrei durch; `build`-Output startet via `vite preview`.
- 0.1.2 Import-Grenzen erzwingen: ESLint-Regel (`import/no-restricted-paths`), die Importe aus `ui/`/`render/` nach `engine/` erlaubt, aber **nie** umgekehrt. *DoD:* Verstoß-Testdatei erzeugt Lint-Fehler; Regel dokumentiert im README.
- 0.1.3 CI-Workflow (Lint, Typecheck, Test, Build, E2E-Smoke auf PRs). *DoD:* CI läuft auf einem Test-PR grün; rote Checks blockieren Merge.

**DoD Task 0.1:** Frisches `git clone` + `npm ci` + alle Scripts grün in unter 5 Minuten; Architektur-Ordner existieren mit je einer Platzhalter-Indexdatei.

### Task 0.2 — Deterministischer Kern
**Vorgaben:** Seedbare PRNG-Klasse mit benannten Streams (`combat`, `dungeon`, `loot`, `events`), damit z. B. Dungeon-Layout reproduzierbar bleibt, auch wenn im Kampf unterschiedlich oft gewürfelt wurde. Event-Sourcing-Grundgerüst: `GameAction` (Spieler-Input) → `reduce()` → neuer `GameState` + `GameEvent[]`.
**Subtasks:**
- 0.2.1 PRNG (`mulberry32` + Stream-Splitting via Hash). *DoD:* Unit-Tests: gleicher Seed ⇒ identische Sequenz (1000 Werte); Streams unabhängig; Verteilungstest (Chi-Quadrat grob) für `d6`-Helper.
- 0.2.2 Reducer-Infrastruktur mit Action-/Event-Typen (discriminated unions) und Replay-Funktion `replay(seed, actions[]) → GameState`. *DoD:* Test: Replay von 50 zufälligen Aktionen ergibt byte-identischen Zustand (via `JSON.stringify`-Vergleich).
- 0.2.3 `GameState` vollständig serialisierbar (keine Klasseninstanzen, keine Funktionen, nur JSON-fähige Daten). *DoD:* Test: `structuredClone`-Roundtrip + Serialisierungs-Roundtrip verlustfrei.

**DoD Task 0.2:** Replay-Determinismus per Test bewiesen; Doku-Abschnitt „Simulationsarchitektur" im README.

### Task 0.3 — Render- und App-Shell
**Vorgaben:** App-Layout: zentrales Spielfeld-Canvas, rechte Seitenleiste (Helden-Panel), untere Leiste (Aktionen/Log), Vollbild-tauglich, responsive ab 1024 px Breite. Canvas rendert ein statisches Testraster (z. B. 20×20) mit Kamera-Pan (Drag) und Zoom (Rad, 3 Stufen).
**Subtasks:**
- 0.3.1 Layout-Shell in React inkl. leerer Panel-Slots. *DoD:* E2E-Smoke: App lädt, Shell-Elemente sichtbar, keine Konsolen-Fehler.
- 0.3.2 Canvas-Renderer mit Rasterzeichnung, Pan & Zoom, Hover-Highlight der Zelle unterm Cursor. *DoD:* Manuelle Verifikation + Unit-Test für Screen↔Grid-Koordinatentransformation (inkl. Zoomstufen).

**DoD Phase 0 (Meilenstein):** `npm run dev` zeigt die Shell mit interaktivem Testraster; CI grün; Architektur-Doku vorhanden.

---

## Phase 1 — Raster & Taktik-Kern

**Ziel:** Das rasterbasierte Taktik-Fundament: Bewegung, Sichtlinie, Zonen, Zugreihenfolge. **Das ist das Herzstück des Spielgefühls — hier wird nicht gespart.**

### Task 1.1 — Rastermodell
**Vorgaben:** Quadratraster; Zelle = `{ terrain, occupantId?, features[] }`. Terrain-Typen: `floor`, `wall`, `door(open/closed)`, `hazard` (z. B. Grimlicht-Riss: Schaden beim Betreten), `rubble` (Bewegung +1), `void` (unpassierbar, blockiert keine Sicht). Genau **eine** Einheit pro Zelle. Bewegung orthogonal + diagonal; Diagonale kostet 1, ist aber blockiert, wenn **beide** angrenzenden Orthogonalzellen blockiert sind (kein Eckenschneiden durch Wände).
**Subtasks:**
- 1.1.1 Datenmodell + Zugriffshelfer (`getCell`, `neighbors`, `isPassable(unit, cell)`). *DoD:* Unit-Tests für alle Terrain-Typen und Eckenschneide-Regel (mind. 8 Fälle).
- 1.1.2 Kartendefinition als typisiertes ASCII-Format für Testkarten (`#`=Wand, `.`=Boden, `+`=Tür …) mit Parser. *DoD:* Parser-Tests inkl. Fehlerfälle (unbekanntes Zeichen, unrechteckige Karte ⇒ sauberer Fehler).

**DoD Task 1.1:** Testkarten laden und rendern; alle Regeln testabgedeckt.

### Task 1.2 — Pfadfindung & Bewegungsreichweite
**Vorgaben:** A* für Einzelpfade; Dijkstra-Flood für „alle erreichbaren Zellen mit Budget X" (für die Bewegungs-Vorschau). Belegte Zellen: Verbündete dürfen **durchquert**, aber nicht als Endfeld gewählt werden; Gegner blockieren vollständig. Kosten: Grundkosten 1, `rubble` 2; `hazard` passierbar, wird aber im UI als Gefahr markiert.
**Subtasks:**
- 1.2.1 A* + Flood-Fill mit Prioritätsqueue. *DoD:* Tests: kürzester Pfad um Hindernisse, Unerreichbarkeit ⇒ `null`, Durchqueren-aber-nicht-Stehen auf Verbündeten; Performance-Test: Flood auf 40×40-Karte < 5 ms.
- 1.2.2 Bewegungs-Vorschau im Renderer: erreichbare Zellen highlighten, Pfad-Preview beim Hover, Klick bewegt (animiert, Zelle-für-Zelle, ~80 ms/Schritt). *DoD:* Manuelle Verifikation + E2E: Klickbewegung verändert Einheitenposition.

**DoD Task 1.2:** Bewegung fühlt sich präzise an: Vorschau, Kosten, Animation, keine illegalen Züge möglich.

### Task 1.3 — Sichtlinie (Line of Sight) & Nebel
**Vorgaben:** LOS via Supercover-Bresenham von Zellmitte zu Zellmitte; `wall` und geschlossene `door` blockieren, Einheiten blockieren **nicht** (Fernkampf über Köpfe hinweg — bewusst einfache, lesbare Regel). Kanten-Grenzfall: Verläuft die Linie exakt durch eine Zellecke, gilt LOS als gegeben, wenn **mindestens einer** der beiden Eckwege frei ist (großzügige Regel, pro Spieler). Fog of War in drei Zuständen: `unseen` (schwarz), `explored` (abgedunkelt, Terrain sichtbar, Einheiten nicht), `visible`.
**Subtasks:**
- 1.3.1 LOS-Funktion + Sichtfeld-Berechnung (`computeVisible(unit) → Set<cellId>`, Sichtweite als Einheitenwert). *DoD:* Tabellengetriebene Tests mit ≥ 12 Geometrie-Fällen inkl. Eckdurchgang, Tür offen/zu.
- 1.3.2 Fog-Rendering + Team-Sicht (Summe der Sichtfelder aller Helden). *DoD:* Manuelle Verifikation auf Testkarte; Unit-Test für Zustandsübergänge `unseen→explored→visible→explored`.

**DoD Task 1.3:** Sichtlinie in jeder getesteten Geometrie korrekt und im UI per Hover nachvollziehbar (Linie wird eingezeichnet).

### Task 1.4 — Zugstruktur & Initiative
**Vorgaben:** Rundenmodell nach Blackstone-Vorbild, aber eigenständig: Jede Runde wird eine **Initiativleiste** gebildet — Heldenmarker + Gegner-Gruppenmarker, Reihenfolge teils fix (Heldenwerte), teils gewürfelt (Gegnergruppen). Helden dürfen ihre Aktivierungsreihenfolge untereinander tauschen, wenn ihre Marker benachbart auf der Leiste liegen (taktische Tiefe!). Innerhalb einer Aktivierung gilt die Aktionsökonomie aus Task 2.1.
**Subtasks:**
- 1.4.1 Initiativleisten-Logik (Aufbau, Tausch-Regel, Rundenwechsel, „Hinterhalt"-Flag: Gegnergruppe agiert sofort bei Aufdeckung). *DoD:* Unit-Tests für Aufbau-Determinismus (Seed), Tauschlegalität, Rundenrollover.
- 1.4.2 Initiativleisten-UI (horizontal über dem Spielfeld, aktiver Marker hervorgehoben, Tausch per Drag oder Klick-Klick). *DoD:* E2E: Leiste sichtbar, Aktivierung wandert korrekt weiter.

**DoD Phase 1 (Meilenstein):** Auf einer Testkarte bewegt sich eine Heldengruppe regelkonform in Zügen: Initiative, Bewegung mit Vorschau, LOS-Anzeige, Fog. Alle Regeln unit-getestet; E2E-Smoke grün.

---

## Phase 2 — Kampfsystem

**Ziel:** Vollständiger, spannender Taktikkampf mit Aktionswürfel-Ökonomie und lesbarer Gegner-KI.

### Task 2.1 — Aktionswürfel-Ökonomie (Herz aus Silver Tower, eigenständig umgesetzt)
**Vorgaben:** Zu Aktivierungsbeginn wirft jeder Held seine **Aktionswürfel** (Basis: 4W6, klassenabhängig modifiziert). Aktionen verbrauchen Würfel nach Regeln: *Bewegen* (beliebiger Würfel; Wert ≥ 4 ⇒ +1 Bewegung), *Angreifen* (Würfel ≥ Waffenschwelle), *Fähigkeit* (spezifische Anforderung, z. B. „ein Paar", „Würfel ≤ 2"), *Verteidigen* (Würfel beiseitelegen ⇒ wird Verteidigungsbonus bis zur nächsten Aktivierung), *Fokus* (2 beliebige Würfel ⇒ 1 Würfel neu werfen und Ergebnis +1). Ungenutzte Würfel verfallen. **Ein** Würfel pro Runde darf an einen benachbarten Helden verschenkt werden (Kooperation).
**Subtasks:**
- 2.1.1 Datenmodell Würfelpool + Aktionsvalidierung (`canPay(action, pool) → welche Würfel`). *DoD:* Unit-Tests für jede Aktionsart, Schenk-Regel, Verfall; Property-Test: Validierung akzeptiert nie unbezahlbare Aktionen.
- 2.1.2 Würfelpool-UI: Würfel als klickbare Chips am unteren Rand; Aktion wählen ⇒ passende Würfel pulsieren; Ausgeben animiert. *DoD:* E2E: kompletter Zug (werfen → bewegen → angreifen) per Klicks durchführbar.

**DoD Task 2.1:** Aktionsökonomie vollständig spielbar und regelvalidiert; kein Zustand erreichbar, in dem UI und Engine über den Pool uneins sind (Engine ist Single Source of Truth).

### Task 2.2 — Angriff, Schaden, Statuseffekte
**Vorgaben:** Angriffsablauf: Angreifer zahlt Würfel ≥ Waffenschwelle ⇒ Trefferwurf `1W6 + Angriffswert` vs. `Verteidigung des Ziels (+Verteidigen-Bonus, +Deckung)`; Treffer ⇒ Schaden = Waffenschaden (fix) − Rüstung (min. 1). **Kritisch:** Angriffswürfel war eine 6 ⇒ +2 Schaden und Waffeneffekt löst aus. Deckung: Ziel orthogonal neben Wand relativ zur Angriffslinie ⇒ +1 Verteidigung (nur Fernkampf). Reichweiten: Nahkampf 1 (Diagonale zählt), Fernkampf per Waffenwert, benötigt LOS. Statuseffekte (Dauer in Runden, stapeln nicht, Timer refresht): `brennend` (1 Schaden/Aktivierungsbeginn, 2 Runden), `verlangsamt` (Bewegungskosten ×2, 1 Runde), `geblendet` (−2 Angriff, 1 Runde), `gebrochen` (nur Gegner: flieht von Helden weg, 1 Runde), `stabilisiert` (Held: immun gegen `niedergestreckt`, 2 Runden).
**Subtasks:**
- 2.2.1 Kampf-Resolver als reine Funktion mit vollständigem Event-Output (`AttackResolved{hit, crit, damage, statusApplied}` …). *DoD:* Tabellengetriebene Tests: ≥ 20 Fälle über Treffer/Fehlschlag/Krit/Rüstung/Deckung/Mindestschaden.
- 2.2.2 Statuseffekt-Engine (Anwenden, Ticken, Ablaufen, Interaktion mit Bewegung/Angriff). *DoD:* Unit-Tests je Effekt (Anwendung, Wirkung, Ablauf) + Refresh-statt-Stapeln-Test.
- 2.2.3 Helden-Niederlage: 0 LP ⇒ `niedergestreckt` (liegt, Zelle blockiert, 3-Runden-Zähler); Verbündeter benachbart kann Aktion „Bergen" (1 Würfel ≥ 3) ⇒ 1 LP + `stabilisiert`. Zähler abgelaufen oder alle Helden nieder ⇒ Niederlage der Expedition. *DoD:* Tests für Niederlagen-Erkennung, Bergen, Timer.
- 2.2.4 Kampf-Feedback im Renderer: Trefferzahlen aufsteigend, Krit-Akzent, Status-Icons an Einheiten, Kampflog-Panel (letzte 20 Events, deutsch formatiert). *DoD:* E2E-Smoke: Angriff erzeugt sichtbare Zahl + Logeintrag.

**DoD Task 2.2:** Jede Kampfregel deterministisch getestet; ein kompletter Schlagabtausch ist im Log lückenlos nachvollziehbar.

### Task 2.3 — Gegner-KI mit Verhaltenstabellen
**Vorgaben:** Jeder Gegnertyp hat eine **offene Verhaltenstabelle** (im Bestiarium-Panel einsehbar — Säule „lesbare Gegner"): priorisierte Regelliste, z. B. Fahlenschleicher: „1) Wenn benachbart zu Held mit niedrigsten LP ⇒ angreifen. 2) Wenn in 3 Feldern Held isoliert (kein Verbündeter benachbart) ⇒ auf ihn zu. 3) Sonst: auf nächsten Held zu, bevorzugt außerhalb von dessen LOS." Gruppenaktivierung: alle Gegner einer Initiativgruppe agieren nacheinander (deterministische Reihenfolge: Leseordnung des Rasters). KI nutzt dieselben Engine-Funktionen wie der Spieler (keine Cheats, kein Wallhack außerhalb ihres Sichtsystems: Gegner kennen Heldenpositionen nur in Sichtweite oder wenn `alarmiert`).
**Subtasks:**
- 2.3.1 Verhaltensregel-DSL (typisierte Bedingungs-/Aktions-Bausteine) + Interpreter. *DoD:* Unit-Tests: 3 Beispieltabellen erzeugen auf präparierten Karten exakt die erwarteten Züge (Golden-Tests).
- 2.3.2 Vier Grundverhalten implementieren: *Rusher* (kürzester Weg, angreifen), *Schütze* (hält Distanz ≥ 3, sucht LOS, flieht aus Nahkampf), *Lauerer* (wartet außer Sicht, stürmt bei Annäherung), *Unterstützer* (heilt/pusht stärksten Verbündeten, sonst Abstand). *DoD:* Je Verhalten ≥ 2 Golden-Tests.
- 2.3.3 Alarmsystem: Kampfgeräusch (Angriff, zerstörte Tür) alarmiert Gegner im Umkreis 8 (ignoriert LOS) ⇒ Status `alarmiert` (kennt letzte bekannte Heldenposition, sucht sie auf). *DoD:* Tests: Alarmradius, Verhalten „letzte bekannte Position" bei Sichtverlust.

**DoD Task 2.3:** KI-Züge sind auf Testkarten vollständig vorhersagbar (Golden-Tests) und im Spiel als „lesbar" erlebbar (Verhaltenstabelle im UI einsehbar).

### Task 2.4 — Kampf-Vertikale (Testszenario)
**Vorgaben:** Handgebautes Szenario „Brennende Halle": 4 Helden (vorerst 1 generische Klasse mit 4 Loadouts) vs. 2 Wellen Hohlgeborene auf einer 18×14-Karte mit Türen, Deckung, Hazard. Sieg: alle Gegner besiegt; Niederlage: alle Helden nieder. Ergebnis-Screen mit Statistik (Runden, Schaden, MVP).
**DoD Task 2.4 = DoD Phase 2 (Meilenstein):** Szenario ist von Start bis Sieg/Niederlage komplett per UI spielbar; Replay-Test des Szenarios (feste Action-Sequenz) läuft deterministisch grün in CI; E2E: Szenario laden, einen Zug ausführen, Log prüfen.

---

## Phase 3 — Dungeon-Generierung & Erkundung

**Ziel:** Der Erkundungsloop: Raum für Raum aufdecken, Ereignisse erleben, Rückzug abwägen.

### Task 3.1 — Prozeduraler Dungeon-Generator
**Vorgaben:** Tile-basierte Generierung (WHQ-1995-Gefühl): kuratierter Pool handgebauter **Raum-Schablonen** (je 6–12 pro Größenklasse S/M/L, im ASCII-Format aus 1.1.2, mit markierten Türankern und Spawnzonen) + **Korridor-Stücke**. Generator zieht per Seed aus dem Pool und verbindet über Türanker zu einem Graphen: Startraum → 6–10 Räume → Zielraum (Quest-Raum), max. Abzweigtiefe 2, keine Überlappungen (Kollisionstest auf Weltkoordinaten). Sackgassen enthalten immer etwas (Schatz, Ereignis oder Wache — nie leer).
**Subtasks:**
- 3.1.1 Schablonen-Format + 20 Startschablonen (Räume S/M/L, Korridore I/L/T). *DoD:* Jede Schablone parst, hat ≥ 1 Türanker, Validator-Test läuft über den ganzen Pool.
- 3.1.2 Graph-Generator (Platzierung, Kollision, Verbindungsgarantie, Zielraum am tiefsten Punkt). *DoD:* Property-Tests über 200 Seeds: immer verbunden, nie überlappend, Raumzahl im Sollbereich, Zielraum-Distanz ≥ 4 Räume; Snapshot-Test für 3 fixe Seeds.
- 3.1.3 Population: Gegnergruppen nach Budget (skaliert mit Raumtiefe), Schätze, Hazards in markierte Zonen. *DoD:* Tests: Budget eingehalten, Startraum immer leer, Zielraum enthält Quest-Objekt.

**DoD Task 3.1:** `generateDungeon(seed, questConfig)` liefert validierte, reproduzierbare Dungeons; Debug-Ansicht (Minimap-Graph) vorhanden.

### Task 3.2 — Erkundungsfluss
**Vorgaben:** Dungeon startet mit sichtbarem Startraum; geschlossene Türen sind „Aufdeck-Kanten". Tür öffnen (Aktion, 1 Würfel): Nachbarraum wird aufgedeckt ⇒ Kamera-Schwenk, Gegner spawnen ggf. mit Hinterhalt-Flag (1.4.1), **Erkundungswurf** (1W6): 1 ⇒ Zwischenfall-Ereignis (Task 3.3), 6 ⇒ Fund (kleiner Schatz). Kein Kampf aktiv + alle Räume verbunden erkundbar. Türen können nach Öffnen nicht mehr geschlossen werden (Druck bleibt).
**Subtasks:**
- 3.2.1 Aufdeck-Logik (Raumzustand `hidden/revealed`, Spawn-Trigger, Erkundungswurf). *DoD:* Tests: Aufdeckung idempotent, Spawns deterministisch per Seed, Ereigniswurf nutzt `events`-Stream.
- 3.2.2 Minimap (aufgedeckter Graph als Knoten-Skizze, aktueller Raum markiert). *DoD:* E2E-Smoke: Minimap wächst nach Türöffnung.

**DoD Task 3.2:** Ein kompletter Dungeon lässt sich Raum für Raum aufdecken; jeder Aufdeckmoment hat spürbare Konsequenz (Spawn, Ereignis oder Fund).

### Task 3.3 — Ereignis-System („jede Runde kann etwas passieren")
**Vorgaben:** Der 1995er-Puls, eigenständig: Zu Beginn jeder **Erkundungsrunde** (Runde ohne aktiven Kampf) wird der **Grimlicht-Zähler** um 1 erhöht; bei Wert ≥ 4 wird mit steigender Wahrscheinlichkeit (W6 ≤ Zähler−3) ein Ereignis aus dem Questdeck gezogen und der Zähler zurückgesetzt. Ereignistypen: *Nachzügler* (Gegnertrupp spawnt an aufgedeckter Türkante), *Beben* (zufälliger Korridor stürzt ein ⇒ `rubble`), *Flüstern* (ein Held erhält `geblendet` oder Bonuswürfel — Risiko), *Fund*, *Händlergeist* (Mini-Shop im Dungeon). Ereignisse als typisierte Content-Objekte mit `apply(state)`-Reducer.
**Subtasks:**
- 3.3.1 Zähler + Deck-Mechanik (Ziehen ohne Zurücklegen, Deck pro Quest konfigurierbar). *DoD:* Tests: Wahrscheinlichkeitsfenster korrekt, Deck erschöpft ⇒ Reshuffle, alles seed-deterministisch.
- 3.3.2 Die 5 Ereignistypen implementieren + UI-Präsentation (Ereigniskarte als Modal mit Illustration-Platzhalter, deutscher Text, ggf. Wahl-Optionen). *DoD:* Je Ereignis 1 Test (Zustandseffekt) + E2E-Smoke für das Modal.

**DoD Task 3.3:** Erkundung steht spürbar unter Zeitdruck; Ereignisse feuern regelkonform und sind im Log dokumentiert.

### Task 3.4 — Rückzug & Expeditions-Ende (Push-your-luck-Kern)
**Vorgaben:** Helden können am Startraum-Eingang die Expedition **beenden** (alle Beute sicher). Quest-Ziel erreicht ⇒ „Aufbruchsphase": Grimlicht-Zähler steigt fortan **jede** Runde und Ereignisse werden häufiger (Rückweg unter Druck). Niederlage ⇒ Verlust eines zufälligen Beutestücks pro Held, Quest gescheitert (Kampagne verzweigt, Phase 5).
**DoD Task 3.4 = DoD Phase 3 (Meilenstein):** Voller Loop spielbar: Dungeon generieren → erkunden → kämpfen → Ziel → Rückzug → Ergebnis-Screen mit Beute; Replay-Test eines kompletten Dungeon-Durchlaufs in CI.

---

## Phase 4 — Helden & Progression

**Ziel:** Vier unterscheidbare Klassen, Loot mit Fundmomenten, Levelaufstieg.

### Task 4.1 — Klassensystem
**Vorgaben:** Klassen als Content-Objekte: Werte (LP, Bewegung, Sicht, Verteidigung, Angriff), Aktionswürfel-Profil, 1 **Sondermechanik**, 4 Fähigkeiten (2 ab Start, 2 freischaltbar). Sondermechaniken:
- **Bannwart:** *Schildwall* — beiseitegelegte Verteidigen-Würfel schützen auch benachbarte Verbündete.
- **Aschjägerin:** *Fallennetz* — kann Würfel als Fallen auf Zellen legen (lösen bei Gegnerbetreten: Schaden + `verlangsamt`).
- **Kernschmied:** *Konstrukt* — steuert eine kleine Blechdrohne als zweite Einheit (eigene Zelle, 1 Würfel Übertrag pro Runde).
- **Lichtsucherin:** *Überkanalung* — darf Würfel nachwerfen; jede nachgeworfene 1 füllt die **Grimlast**-Leiste, bei 3 ⇒ Rückschlag-Ereignis (Schaden oder Kontrollverlust 1 Runde).
**Subtasks:**
- 4.1.1 Klassen-Datenmodell + die 4 Klassen mit Werten und je 4 Fähigkeiten (16 Fähigkeiten gesamt, jede mit Würfelkosten, Reichweite, Effekt). *DoD:* Jede Fähigkeit hat ≥ 1 Unit-Test (Kosten + Effekt); Klassenwerte in einer Balancing-Tabelle (`content/balance.ts`) zentralisiert.
- 4.1.2 Die 4 Sondermechaniken in der Engine. *DoD:* Je Mechanik ≥ 3 Tests (Normalfall, Randfall, Interaktion mit bestehender Regel — z. B. Schildwall + Deckung).
- 4.1.3 Heldenauswahl-Screen (4 Slots, Klassenporträt-Platzhalter, Werteübersicht, deutsche Beschreibungen). *DoD:* E2E: Gruppe zusammenstellen und Expedition starten.

**DoD Task 4.1:** Alle 4 Klassen im Szenario aus 2.4 spielbar und mechanisch klar unterscheidbar.

### Task 4.2 — Inventar & Ausrüstung
**Vorgaben:** Slots pro Held: Waffe, Rüstung, Talisman, 3 Verbrauchsgüter. Items als Content-Objekte mit Effekt-Hooks (`onEquip`, `onAttack`, `onDefend`, `onUse`). Seltenheiten: gewöhnlich/besonders/Relikt. Tausch zwischen Helden: benachbart, kostet 1 Würfel; im Lager (Siedlung) frei.
**Subtasks:**
- 4.2.1 Inventar-Engine + Effekt-Hook-System. *DoD:* Tests: Slot-Regeln, Hook-Auslösung, Stapelverbot bei Talismanen.
- 4.2.2 30 Start-Items (10 Waffen, 6 Rüstungen, 6 Talismane, 8 Verbrauchsgüter) mit deutschen Namen/Texten im eigenen Universum. *DoD:* Content-Validator-Test (jedes Item: Name, Text, Effekt, Seltenheit, Icon-Platzhalter); je Effekt-Hook mind. 1 exemplarischer Test.
- 4.2.3 Inventar-UI (Drag & Drop oder Klick-Zuweisen, Tooltip mit Vergleich zum angelegten Item). *DoD:* E2E: Item anlegen ändert Heldenwerte sichtbar.

**DoD Task 4.2:** Ausrüstung verändert Kampfverhalten nachweislich (Test: gleicher Seed, anderes Item ⇒ anderes Kampfergebnis).

### Task 4.3 — Loot & Belohnung
**Vorgaben:** Loot-Tabellen im 1995er-Geist: Schatzzonen und besiegte Elite-Gegner würfeln auf typisierte Tabellen (`common`, `vault`, `boss`), Relikte sind einzigartig pro Kampagne (ohne Zurücklegen). Zusätzlich **Ruhm** (Silver-Tower-Idee): Punkte für Raumaufdeckung, Elite-Kills, questspezifische Heldentaten — Währung für Levelaufstieg.
**Subtasks:**
- 4.3.1 Loot-Tabellen-Engine (`loot`-PRNG-Stream, Unikat-Verwaltung). *DoD:* Tests: Verteilung plausibel (Stichprobe), Unikate nie doppelt, deterministisch.
- 4.3.2 Beute-Präsentation: Fund-Modal mit Rarität-Farbakzent und Item-Text. *DoD:* E2E-Smoke: Schatz öffnen zeigt Modal.

**DoD Task 4.3:** Fundmomente fühlen sich belohnend an; Ruhm wird korrekt verbucht (Test je Quelle).

### Task 4.4 — Levelaufstieg
**Vorgaben:** Stufen 1–6. Aufstieg **nur in der Siedlung** (Phase 5; bis dahin Debug-Knopf) gegen Ruhm (Kostenkurve in `balance.ts`). Pro Stufe: +Werteschritt (fix je Klasse) und ab Stufe 2/4 Wahl je einer der zwei freischaltbaren Fähigkeiten; Stufe 6 schaltet „Meisterzug" frei (einmal pro Expedition, klassenspezifisch).
**DoD Task 4.4 = DoD Phase 4 (Meilenstein):** Volle Vertikale spielbar: Gruppe wählen → Dungeon → Loot & Ruhm → aufsteigen → nächster Dungeon spürbar mit stärkeren Helden. Tests: Kostenkurve, Wertesteigerung, Fähigkeitswahl persistiert.

---

## Phase 5 — Kampagne & Siedlung

**Ziel:** Der Meta-Loop: Questkette mit Geschichte, Siedlungsphase, Endboss.

### Task 5.1 — Questsystem
**Vorgaben:** Quest = Content-Objekt: Titel, Lore-Text (deutsch), Dungeon-Konfiguration (Größe, Gegnerpool, Ereignisdeck, Schablonen-Set), **Zieltyp** + Parameter, Belohnung. Fünf Zieltypen: *Bergung* (Objekt im Zielraum aufnehmen + Rückzug), *Jagd* (benannten Elite-Gegner töten), *Ritual stoppen* (Zielraum vor Runde X erreichen), *Säuberung* (alle Gegnergruppen), *Rettung* (NPC finden + lebend zum Ausgang eskortieren — NPC als einfache Folge-Einheit).
**Subtasks:**
- 5.1.1 Zieltyp-Engine (Fortschritts-Tracking, Sieg-/Niederlagen-Erkennung je Typ, HUD-Anzeige des Ziels). *DoD:* Je Zieltyp ≥ 2 Tests (Erfolg + Fehlschlag); Eskorten-KI (folgt nächstem Helden, Panik bei Gegner-LOS) golden-getestet.
- 5.1.2 Quest-Definition-Validator + 3 Testquests. *DoD:* Validator läuft in CI über allen Quest-Content.

**DoD Task 5.1:** Jeder Zieltyp einzeln durchspielbar (manuelle Verifikation dokumentiert) und testabgedeckt.

### Task 5.2 — Siedlung Aschport (Stadtphase)
**Vorgaben:** Zwischen Quests: Siedlungs-Screen (Illustration-Platzhalter + Menü, kein Raster). Orte: **Markt** (Items kaufen/verkaufen; Sortiment würfelt pro Besuch aus stadtstufen-abhängigem Pool), **Lazarett** (Heilung, Wiederbelebung dauerhaft gefallener Helden gegen hohen Preis), **Gildenhalle** (Levelaufstieg, Fähigkeitswahl, neue Helden rekrutieren), **Archiv** (Lore-Einträge lesen — verknüpft mit Phase 6). Pro Siedlungsbesuch 1 **Stadtereignis** (Tabelle, W6: Steuer, Fest, Diebstahl, Gerücht ⇒ Nebenquest-Hinweis, nichts, Glücksfund).
**Subtasks:**
- 5.2.1 Siedlungs-State + Ökonomie (Goldfluss Kauf/Verkauf 50 %, Preistabellen in `balance.ts`). *DoD:* Tests: Kauf/Verkauf/Heilung verändern Zustand korrekt; kein negatives Gold möglich.
- 5.2.2 Stadtereignis-Tabelle. *DoD:* Je Ereignis 1 Test; Ereignis erscheint als Karte-Modal.
- 5.2.3 Siedlungs-UI (4 Orte, Tastatur-navigierbar). *DoD:* E2E: Kauf-Flow komplett (Markt öffnen → Item kaufen → im Inventar).

**DoD Task 5.2:** Siedlungsphase schließt den Loop Dungeon→Stadt→Dungeon ohne Debug-Werkzeuge.

### Task 5.3 — Kampagnenstruktur
**Vorgaben:** Hauptkampagne **„Der erloschene Kern"**: 8 Hauptquests in 3 Akten + 4 optionale Nebenquests (aus Gerüchten). Struktur als gerichteter Graph: Akt 1 (Q1–Q3, linear, Tutorial-Elemente in Q1), Akt 2 (Q4–Q6, Wahl der Reihenfolge, Fehlschläge erzeugen Weltdruck: +1 Startwert Grimlicht-Zähler in Folgequests), Akt 3 (Q7 Vorbereitung, Q8 Endboss). Kampagnen-Screen: Karte der Tiefen mit Knoten. Scheitern einer Hauptquest ⇒ wiederholbar mit härterem Ereignisdeck (kein Game Over der Kampagne; Game Over nur bei Totalverlust aller Helden + zu wenig Gold zum Rekrutieren).
**Subtasks:**
- 5.3.1 Kampagnen-Graph-Engine (Freischaltung, Weltdruck, Wiederholung). *DoD:* Tests: Freischalt-Logik, Weltdruck-Akkumulation, Game-Over-Bedingung.
- 5.3.2 Kampagnen-Screen (Knotenkarte, Quest-Vorschau mit Lore-Text und Belohnung). *DoD:* E2E: Quest auswählen und starten.
- 5.3.3 Endboss-Encounter: handgebauter Zielraum, Boss *Die Stimme der Stille* mit 3 Phasen (Phasenwechsel bei 66 %/33 % LP: neue Verhaltenstabelle + Arena-Veränderung via Skript-Events), 2 Adds-Wellen. *DoD:* Golden-Test je Bossphase; Boss im Spiel besiegbar (dokumentierter Testlauf).

**DoD Task 5.3 = DoD Phase 5 (Meilenstein):** Die Kampagne ist von Q1 bis zum Endboss-Sieg vollständig durchspielbar (ein dokumentierter kompletter Playthrough); Abspann-Screen mit Kampagnenstatistik.

---

## Phase 6 — Lore & Content-Vollausbau

**Ziel:** Das eigene Universum vollständig und konsistent; Content-Menge auf Zielumfang.

### Task 6.1 — Lore-Bibel
**Vorgaben:** Dokument `docs/lore-bibel.md`: Kosmologie (Sonnenkern, Aschefall, Grimlicht), Zeitleiste (5 Epochen), Aschport (Orte, 6 benannte NPCs), die 4 Gegnerfraktionen (Motivation, Ästhetik, Sprachstil), die 4 Heldenklassen (Herkunft, Gildenkontext), Glossar (≥ 40 Begriffe), **Namenskonventionen** je Fraktion (Silbenlisten für konsistente Neunamen). Negativliste: verbotene Anleihen (keine Begriffe/Namen mit Verwechslungsgefahr zu bestehender IP; Check-Liste im Dokument).
**DoD:** Dokument vollständig (alle genannten Abschnitte), von einem Review-Durchgang auf IP-Nähe geprüft (dokumentiert); alle bis dahin existierenden In-Game-Texte gegen Glossar/Namenskonventionen abgeglichen.

### Task 6.2 — Bestiarium-Vollausbau
**Vorgaben:** 20 Gegnertypen: je Fraktion 4 reguläre + 1 Elite; dazu Boss (5.3.3) — pro Typ: Werte, Verhaltenstabelle, deutscher Lore-Text (2–3 Sätze), Platzhalter-Token. Elite-Typen haben je 1 Sonderregel (z. B. Rostbund-Koloss: explodiert beim Tod, 2 Schaden im Umkreis 1).
**DoD:** Content-Validator grün über alle 20; je Fraktion 1 Golden-Test eines typischen Encounters; Bestiarium-Panel im Spiel zeigt entdeckte Gegner mit Verhaltenstabelle (Entdeckungs-Tracking getestet).

### Task 6.3 — Item- & Ereignis-Vollausbau
**Vorgaben:** Items auf 60 erweitern (davon 8 Relikte mit Build-verändernden Effekten); Ereignisdecks auf 24 Ereignisse (8 pro Akt, aktabhängig härter); Stadtereignisse auf 12; alle Texte deutsch, lore-konform.
**DoD:** Validatoren grün; jeder neue Effekt-Hook getestet; Stichproben-Review von 10 Texten gegen Lore-Bibel dokumentiert.

### Task 6.4 — Quest-Texte & Dialoge
**Vorgaben:** Alle 12 Quests mit Briefing (Auftraggeber-NPC, 80–150 Wörter), Zwischentexten (Aufdeckung Zielraum) und Debriefing (Sieg/Niederlage-Variante). Archiv-Einträge (5.2): 12 freischaltbare Lore-Texte, verknüpft an Kampagnenfortschritt.
**DoD Phase 6 (Meilenstein):** Kein Platzhaltertext („Lorem", „TODO") mehr im Spiel (CI-Grep-Check); komplette Kampagne liest sich als zusammenhängende Geschichte (Review-Playthrough dokumentiert).

---

## Phase 7 — UI/UX, Grafik, Audio & Polish

**Ziel:** Aus dem funktionalen Spiel ein stimmungsvolles machen.

### Task 7.1 — Visuelle Identität
**Vorgaben:** Art-Direction-Guide (1 Seite): Farbwelt (kalte Asche-Töne + Grimlicht-Türkis als Akzent), Token-Stil (Flat-Icon-Silhouetten je Einheit, per Code/SVG erzeugbar — keine externen IP-nahen Assets), Tileset für Terrain (selbst erstellt, 2 Biome: Aschegewölbe, Rosthallen). Alle Platzhalter aus Phasen 0–6 ersetzen.
**Subtasks:**
- 7.1.1 Tileset + Auto-Tiling (Wandverbindungen). *DoD:* Beide Biome im Spiel; E2E-Screenshot-Vergleich (Playwright `toHaveScreenshot`) als Regressionstest.
- 7.1.2 Einheiten-Tokens (24 Silhouetten: 4 Helden, 20 Gegner) + Status-Icons. *DoD:* Alle Einheiten unterscheidbar auf einem Screenshot; kein Bild-404 (E2E prüft geladene Ressourcen).

### Task 7.2 — Game Feel
**Vorgaben:** Animations-/Feedback-Paket: Trefferblitz + Screen-Shake (dezent, abschaltbar), Würfelwurf-Animation, Tür-Aufdeck-Schwenk mit kurzem „Reveal"-Moment, Todesanimation (Auflösen in Asche), Grimlicht-Zähler pulsiert bei hohem Stand. Alle Animationen unterbrechbar (Klick überspringt), Simulationsgeschwindigkeit unabhängig von Animationen.
**DoD:** Manuelle Verifikationsliste (10 Punkte) abgehakt; Einstellungs-Toggle „Reduzierte Animationen"; kein Animations-Zustand kann Input dauerhaft blockieren (Timeout-Test).

### Task 7.3 — Audio
**Vorgaben:** Web Audio (howler.js o. ä.): 12 SFX (Schlag, Schuss, Krit, Tür, Fund, Würfel, Alarm, Bosswechsel …), 3 Ambient-Loops (Erkundung, Kampf, Siedlung) mit Crossfade, Lautstärkeregler (Master/SFX/Musik) persistiert. Nur CC0-/eigenerzeugte Sounds, Quellenliste in `docs/credits.md`.
**DoD:** Alle Events vertont; Regler funktionieren (E2E: Mute setzt `volume=0`); Credits vollständig.

### Task 7.4 — Zugänglichkeit & Komfort
**Vorgaben:** Vollständige Tastatursteuerung (Zellenkursor, Tab-Reihenfolge, Hotkeys für Aktionen), Farbfehlsicht-sichere Zustandskodierung (nie Farbe allein: immer Icon/Muster dazu), Textskalierung 100/125/150 %, Undo für reine Bewegungsaktionen (solange nichts aufgedeckt/gewürfelt wurde), Tooltip-Lexikon für jeden Regelbegriff.
**DoD Phase 7 (Meilenstein):** Kompletter Dungeon nur mit Tastatur spielbar (dokumentierter Testlauf); axe-Audit der UI-Screens ohne kritische Befunde; Undo-Regel getestet (nie nach Informationsgewinn).

---

## Phase 8 — Persistenz, Balancing, QA & Release

**Ziel:** Stabil, fair, veröffentlichbar.

### Task 8.1 — Speichersystem (final)
**Vorgaben:** Autosave: nach jeder Heldenaktivierung (Kampf) bzw. jedem Raumwechsel (Erkundung) und in der Siedlung; 3 manuelle Slots + „Weiterspielen". Save = `{schemaVersion, seed, actionLog}` (Event-Sourcing: Laden = Replay) **plus** periodischer State-Snapshot als Beschleuniger (Replay ab Snapshot). Migrationstest: Saves der Vorversion laden.
**DoD:** Absturz-Simulation (Reload mitten im Kampf) verliert maximal die laufende Aktivierung; Lade-Zeit eines Endgame-Saves < 2 s; Migrations-Test in CI mit eingefrorenem Alt-Save.

### Task 8.2 — Balancing-Pass
**Vorgaben:** Headless-Simulations-Harness: KI spielt beide Seiten (einfache Helden-Heuristik) über 500 Auto-Läufe pro Akt; Metriken: Siegquote, mittlere Rundenzahl, Downs pro Quest, Item-Nutzungsquote. Zielkorridore: Akt 1 Siegquote 75–90 %, Akt 2 55–75 %, Akt 3 40–60 %; keine Klasse gewinnt in Solo-Metrik > 15 % mehr Kämpfe als die schwächste. Stellschrauben ausschließlich in `content/balance.ts`.
**DoD:** Harness läuft als CI-Job (nightly, nicht PR-blockierend); alle Zielkorridore erreicht; Balancing-Änderungen als dokumentierte Tabelle im PR.

### Task 8.3 — QA-Härtung
**Vorgaben:** E2E-Suite ausbauen: Kritischer Pfad (Neues Spiel → Q1 komplett → Siedlung → Speichern → Laden → Q2 starten) als ein Playwright-Lauf; Fuzz-Test: 10 000 zufällige, validierte Aktionen gegen die Engine ohne Exception/Invariantenbruch (Invarianten: LP ≤ Max, keine Doppelbelegung von Zellen, Würfelpool nie negativ); Fehlerbericht-Export (Zustand + Action-Log als JSON-Download).
**DoD:** Kritischer Pfad in CI grün; Fuzz-Lauf ohne Befund (Invarianten als Assertions); Export-Knopf in den Einstellungen funktioniert.

### Task 8.4 — Release
**Vorgaben:** Produktions-Build < 3 MB JS (gzip) ohne Assets; Ladezeit-Budget: interaktiv < 3 s auf Mittelklasse-Laptop; statisches Hosting (GitHub Pages o. ä.); `README` mit Spielanleitung (deutsch), Screenshots, Lizenzhinweisen; Versionierung `1.0.0` + CHANGELOG.
**DoD Phase 8 = Projekt-DoD:** Öffentliche URL erreichbar; ein vollständiger Kampagnen-Playthrough auf dem Produktions-Build ohne Blocker (dokumentiert); alle CI-Jobs grün; README vollständig.

---

## 4. Definition of Done — Gesamtprojekt (Abnahmekriterien)

Das Projekt gilt als fertig, wenn **alle** folgenden Punkte erfüllt sind:

1. **Spielbarkeit:** Die Kampagne „Der erloschene Kern" ist von Neustart bis Abspann ohne Entwicklerwerkzeuge durchspielbar — inklusive aller 5 Zieltypen, Siedlungsloop und Endboss.
2. **Rastertaktik-Kern:** Bewegung, Sichtlinie, Deckung, Initiative, Aktionswürfel und Gegner-Verhaltenstabellen funktionieren regelkonform und sind vollständig unit-getestet.
3. **Eigenes Universum:** Kein Name, Text oder Symbol mit Verwechslungsgefahr zu Warhammer oder anderer geschützter IP (Review gegen Negativliste der Lore-Bibel dokumentiert).
4. **Content-Umfang:** 4 Klassen, 20 Gegnertypen + Boss, 60 Items, 12 Quests, 24 Dungeon-Ereignisse, 12 Stadtereignisse, 2 Biome — alle durch Content-Validatoren in CI abgesichert.
5. **Qualität:** Lint, Typecheck, Unit-Tests, Build und E2E-Suite grün; Fuzz-Test ohne Invariantenbruch; Determinismus per Replay-Tests bewiesen.
6. **Persistenz:** Speichern/Laden verlustarm (max. eine Aktivierung), Schema-Migration getestet.
7. **Balance:** Simulations-Zielkorridore erreicht und dokumentiert.
8. **Zugänglichkeit:** Vollständig tastaturspielbar, farbfehlsicht-tauglich, reduzierte Animationen verfügbar.
9. **Release:** Öffentlich gehostet, dokumentiert, versioniert.

---

## 5. Risiken & Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Scope-Explosion (Content-Phasen wachsen) | Projekt wird nie fertig | Content-Zielzahlen sind fix (Abschnitt 4.4); Neues nur nach Streichung von Gleichwertigem. |
| Regel-Interaktions-Bugs (Status × Fähigkeit × Item) | Frust, Vertrauensverlust | Effekt-Hook-Architektur + Fuzz-Test (8.3) + Golden-Tests je neuer Interaktion. |
| KI wirkt dumm statt lesbar | Kern-Säule verfehlt | Verhaltenstabellen sind Content, nicht Code — schnell iterierbar; Golden-Tests sichern Absicht. |
| Determinismus bricht (versteckter `Math.random`, Iterationsreihenfolge) | Replays/Saves kaputt | Lint-Ban auf `Math.random` in `engine/`; Replay-Tests in CI ab Phase 0. |
| IP-Nähe schleicht sich in Texte ein | Rechtsrisiko | Negativliste + Namenskonventionen (6.1); Review-Gate vor Release (Punkt 3 der Abnahme). |
| Performance auf großen Karten | Ruckeln zerstört Taktikgefühl | Kartengröße gedeckelt (max. 40×40 aktiv); Perf-Budgets in Tests (1.2.1); Dirty-Rect-Rendering. |

---

## 6. Empfohlene Reihenfolge & Abhängigkeiten (Kurzreferenz)

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
                                          │            │         │
                                          └────────────┴────► Phase 6 (Content, parallelisierbar ab Ende Phase 4)
Phase 6 ──► Phase 7 ──► Phase 8
```

- Phasen 0–3 sind strikt sequenziell (jede baut auf der Engine der vorigen auf).
- Phase 6 (Content) kann parallel zu Phase 5 beginnen, sobald die Content-Formate (Bestiarium, Items, Quests) aus Phasen 2–5 stabil sind.
- Phase 7 erst nach Content-Stabilität (sonst doppelte Asset-Arbeit); Phase 8 immer zuletzt.

*Ende des Plans.*
