# Phase 3 — Asset-Gruppen `characters/` und `ui/` anlegen

**Erstellt:** 2026-04-21
**Branch:** `chore/project-cleanup-2026-04-21`
**Teil von:** `docs/plans/2026-04-21-project-cleanup.md` — Phase 3
**Commit-Message:** `cleanup(phase3): Asset-Gruppen characters/ und ui/ anlegen`

---

## Goal

Flache `PixelArt/`-Wurzel aufräumen: Katze + Wespe zu `characters/` gruppieren, HUD-Icons aus `collectibles/` nach `ui/hud/` umziehen. Zweck ist rein Struktur; keine Sprites werden verändert, keine Gameplay-Logik berührt. Der Dozent soll in `PixelArt/` auf einen Blick erkennen: "das sind Figuren, das ist UI, das sind Sammel-Objekte, das sind Level-Backgrounds, das sind Plattformen".

Nach dieser Phase sieht die Wurzel so aus:

```
PixelArt/
├── backgrounds/          (unverändert)
├── characters/           NEU
│   ├── cat/              ← ehemals PixelArt/cat/
│   └── wasp/             ← ehemals PixelArt/enemy_wasp/
├── collectibles/         (nur noch balloon.*)
├── fonts/                (unverändert — Phase 4)
├── platforms/            (unverändert)
├── thought_bubbles/      (unverändert — Phase 5)
├── ui/                   NEU
│   └── hud/              ← life_icon.*, life_plush.*
├── _archive/             (unverändert)
├── _dev/                 (unverändert)
├── _wip/                 (unverändert)
├── NAMING.md             (aktualisiert)
└── README.md             (aktualisiert)
```

---

## Mapping Entscheidungen

### `characters/cat/`
Vollständig aus `PixelArt/cat/` migriert.
- `cat/animation_sheet.png` → `characters/cat/animation_sheet.png` **(wired)**
- `cat/animation_sheet.psd` → `characters/cat/animation_sheet.psd`
- `cat/einzel_sprites/*` (alle 14 Dateien: idle/peak/push_peak/push_rise/rise/walk_1/walk_2 je .png + .pxo) → `characters/cat/einzel_sprites/*`

Rationale: Der Unterordner `einzel_sprites/` bleibt als Untergruppe erhalten — die Einzeldateien dienen als Reference-Export und werden nicht vom Spiel geladen (nur `animation_sheet.png` ist wired).

### `characters/wasp/`
Vollständig aus `PixelArt/enemy_wasp/` migriert.
- `enemy_wasp/wasp_sheet.png` → `characters/wasp/wasp_sheet.png` **(wired)**
- `enemy_wasp/wasp_sheet.psd` → `characters/wasp/wasp_sheet.psd`
- `enemy_wasp/einzel_sprites/*` (4 Dateien: wasp_body.png bis wasp_body4.png) → `characters/wasp/einzel_sprites/*`

Rationale: Konsistent mit cat/-Struktur. `enemy_`-Prefix fällt weg — der Ordner `characters/wasp/` ist selbsterklärend.

### `ui/hud/`
Nur HUD-Elemente, die heute im Spiel gerendert werden.
- `collectibles/life_icon.png` → `ui/hud/life_icon.png` **(wired — HUD-Herz)**
- `collectibles/life_icon.pxo` → `ui/hud/life_icon.pxo`
- `collectibles/life_plush.png` → `ui/hud/life_plush.png` (reference only, siehe unten)
- `collectibles/life_plush.pxo` → `ui/hud/life_plush.pxo`

Rationale (aus Code-Analyse):
- `life_icon.png` wird in `src/main.js:40` als `_hudLifeIcon` geladen und in Zeilen 483–488 (HUD Top) und 620–624 (Game-Over Screen) als HUD-Herz gerendert. Gehört klar in `ui/hud/`.
- `life_plush.png` ist **nicht** code-referenziert (Grep in `src/` liefert null Treffer). NAMING.md beschreibt es als "larger plush variant (reference/preview)". Es zieht mit dem Herz mit, weil es der visuelle Design-Vorläufer für das HUD-Icon ist — gehört thematisch zum HUD, nicht zu den spawnbaren Collectibles.

### `ui/screens/`
**Nicht angelegt.** Der Plan sieht diesen Ordner vor für "Start, Game-Over, Level-Complete"-Assets — aber:
- Alle Screens sind in `ASSET_LIST.md` als `canvas-drawn` markiert (System-Font + Rechtecke).
- Kein einziger Sprite existiert für Screens.
- Einen leeren Ordner per `.gitkeep` einzuchecken schafft Verwirrung statt Klarheit ("wozu der leere Ordner?").

**Vorgehen:** `ui/screens/` wird **nicht** erstellt. Falls später echte Screen-Grafiken kommen, kann der Ordner trivial nachgezogen werden. In `PixelArt/README.md` bleibt `ui/` als Gruppe mit Unterordner `hud/` dokumentiert; `screens/` wird als "reserviert für künftige Assets" nur im Text erwähnt.

### `collectibles/` — bleibt bestehen
Nach dem Umzug enthält `collectibles/` nur noch:
- `balloon.png` / `balloon.pxo`

Rationale: `balloon` ist ein In-Game-Pickup (schwebendes Extraleben), kein UI-Element und keine Figur. Der Ordner `collectibles/` ist konzeptuell korrekt für spawnbare Welt-Objekte. Ein einzelnes Objekt-Paar rechtfertigt den Ordner — falls später weitere Collectibles dazukommen (Münzen, Power-ups), haben sie bereits ein Zuhause.

**Nicht** verschoben nach `characters/`: balloon wird vom Code als Item behandelt (spawnt, wird eingesammelt), nicht als Figur mit Animation.

---

## Open Questions for Julian

Keine. Alle Kanten sind entschieden nach Research. Falls Julian mit einer der obigen Entscheidungen nicht einverstanden ist (z. B. `life_plush` lieber in `_archive/` statt `ui/hud/`, oder `ui/screens/` doch als `.gitkeep`-Ordner), kann das vor dem Commit per einfachem `git mv` korrigiert werden.

---

## File move list

Alle Moves per `git mv` in `.claude/run-phase3.ps1`. PowerShell ordnet sie logisch; Git erkennt sie automatisch als Renames.

```
# characters/cat/
PixelArt/cat/                        → PixelArt/characters/cat/
  (rekursiv — inkl. animation_sheet.png/.psd und einzel_sprites/)

# characters/wasp/
PixelArt/enemy_wasp/                 → PixelArt/characters/wasp/
  (rekursiv — inkl. wasp_sheet.png/.psd und einzel_sprites/)

# ui/hud/
PixelArt/collectibles/life_icon.png  → PixelArt/ui/hud/life_icon.png
PixelArt/collectibles/life_icon.pxo  → PixelArt/ui/hud/life_icon.pxo
PixelArt/collectibles/life_plush.png → PixelArt/ui/hud/life_plush.png
PixelArt/collectibles/life_plush.pxo → PixelArt/ui/hud/life_plush.pxo
```

Verbleibend in `collectibles/`: `balloon.png`, `balloon.pxo`.

---

## Code edit list

Alle Edits werden vor dem `git mv` per Edit-Tool angewendet (sonst läuft der Browser kurz mit 404s). Anschließend fängt der `git add` in der Script-Phase die modifizierten Dateien.

### `src/player.js` — 1 Edit
- Zeile 38: `'PixelArt/cat/animation_sheet.png'` → `'PixelArt/characters/cat/animation_sheet.png'`

### `src/enemies.js` — 1 Edit
- Zeile 38: `'PixelArt/enemy_wasp/wasp_sheet.png'` → `'PixelArt/characters/wasp/wasp_sheet.png'`

### `src/main.js` — 1 Edit
- Zeile 40: `'PixelArt/collectibles/life_icon.png'` → `'PixelArt/ui/hud/life_icon.png'`

*Nicht geändert in main.js:* Zeile 43 `balloon.png` — bleibt in `collectibles/`.

### Nicht betroffen
`src/background.js`, `src/platforms.js`, `src/dialogue.js`, `src/font.js`, `src/water.js` — keine cat/wasp/life_icon-Pfade.

---

## Doc edit list

### Aktive Dokumentation (wird aktualisiert)

**`PixelArt/NAMING.md`**
- Folder-Structure-Block (Zeilen 22–35): `cat/` → `characters/cat/`; neue Zeile `characters/wasp/`; neue Zeile `ui/hud/`; Hinweis bei `collectibles/` dass life_* in `ui/hud/` liegt.
- Section "Current Game Assets" (Zeile 83 ff.): Überschrift `### cat/` → `### characters/cat/`; neue Section `### characters/wasp/` mit wasp_sheet.png; neue Section `### ui/hud/`; Section `collectibles/` reduziert auf balloon.

**`PixelArt/README.md`**
- Tabelle: Zeile "characters/" von *(geplant)* auf aktiv ändern — Inhalt "Katze, Wespe". Zeile "ui/" von *(geplant)* auf aktiv — Inhalt "HUD-Elemente (Herzen)". Zeile "enemy_wasp/" entfernen (gemerged in characters/). Collectibles-Beschreibung präzisieren ("Luftballon-Extraleben").

**`docs/ASSET_LIST.md`**
- Section "Cat Character Sprites" Heading: `PixelArt/cat/` → `PixelArt/characters/cat/`.
- File-Pfade in Tabelle: `PixelArt/cat/idle.png` etc. — **Vorsicht:** diese Pfade sind bereits falsch (Dateien liegen in `einzel_sprites/`). Das wird in Phase 8 (Doku-Sync) vollständig gefixt. In Phase 3 nur die Heading-Zeile `PixelArt/cat/` → `PixelArt/characters/cat/`, plus alle Tabellen-Zellen mit `PixelArt/cat/` auf `PixelArt/characters/cat/einzel_sprites/` ziehen (gleichzeitig Phase-8-Drift mit-fixen ist out-of-scope — wir fassen die Tabellen-Zellen nur am Pfad-Prefix an und lassen einzel_sprites/ für Phase 8).
- Section "Collectibles": `life_icon.png` und `life_plush.png` Zeilen entfernen oder mit Hinweis "(moved to ui/hud/)" versehen; Section bleibt mit balloon allein.
- Neue Section "UI / HUD Assets (`PixelArt/ui/hud/`)" mit life_icon und life_plush.
- Wasp ergänzen: **nicht** in ASSET_LIST eingetragen (Grep bestätigt keine Treffer für enemy_wasp). Kein Edit nötig.

**`docs/praesentation_2026-04-16.html`** — aktuelle Review-Presentation
- 11 `PixelArt/cat/…` Refs → `PixelArt/characters/cat/…`
- 5 `PixelArt/enemy_wasp/…` Refs → `PixelArt/characters/wasp/…`
- 3 `PixelArt/collectibles/life_icon.png`, 1 `life_plush.png` → `PixelArt/ui/hud/…`
- `PixelArt/collectibles/balloon.png` bleibt.

### Intentionally not updated (historical record)

**`docs/review-presentations/praesentation_2026-03-25.html`** — archivierte Review-Präsentation vom 25.03.2026, historischer Snapshot für Dozenten-Feedback-Kontext. Paths zeigen bereits jetzt auf nicht-existierende `PixelArt/cat/idle.png` (vor dem `einzel_sprites/`-Move). Wird nicht angefasst — das wäre Geschichts-Revision.

**`docs/plans/2026-04-07-l2-cloud-platforms-design.md`**, **`docs/plans/2026-04-07-l2-cloud-platforms-impl.md`** — alte Plans für abgelöstes L2-Wolkenplattform-Konzept. Superseded. Pfad-Drift akzeptabel.

**`docs/plans/2026-04-18-dialogue-system-design.md`**, **`docs/plans/2026-04-20-dialogue-bubbles-illustrator.md`** — diese referenzieren `PixelArt/fonts/` und `PixelArt/thought_bubbles/`, nicht cat/wasp/collectibles. Keine Edits in Phase 3 nötig.

**`docs/plans/2026-04-21-project-cleanup.md`** — Meta-Plan; Referenzen auf `PixelArt/characters/cat/` etc. beschreiben das Ziel dieser Phase. Keine Edits.

**`docs/STYLE_GUIDE.md`** — referenziert nur `backgrounds/shared/*`, nichts aus dem Phase-3-Scope.

**`.planning/**/*.md`** — Phasen-Planungs-Artefakte (01-foundation, 02-core-mechanics, 04-flood-lives, 04.1-visual-concept, 04.2-l2-lighthouse-redesign). Nicht gegrepped weil historisch; wird in Phase 8 geprüft und ggf. retroaktiv geflaggt. Für Phase 3 out-of-scope.

---

## Execution order

1. Edit-Tool: `src/player.js`, `src/enemies.js`, `src/main.js` (3 targeted Edits).
2. Edit-Tool: `PixelArt/NAMING.md`, `PixelArt/README.md`, `docs/ASSET_LIST.md`, `docs/praesentation_2026-04-16.html`.
3. PowerShell: `.claude/run-phase3.ps1` — `git mv` + `git add` + `git commit` + `git log`.
4. Browser-Smoke-Test (manuell durch Julian): `index.html` öffnen, L1 starten, Katze + HUD-Herzen sichtbar; L2 starten (Aufzugschacht), Wespe sichtbar; L3 starten, Leuchtturm sichtbar. Keine 404 in DevTools-Console.

---

## Smoke-Test Checkliste (post-commit)

- [ ] `index.html` im Browser öffnen
- [ ] Start-Screen lädt ohne Console-Errors
- [ ] L1: Katze rendert (animation_sheet), Wespen flattern, Herzen oben rechts sichtbar
- [ ] Ballon spawnt in L1 (falls im Spawn-Zyklus) und ist einsammelbar
- [ ] L2 (Aufzugschacht): Wespen rendern korrekt
- [ ] Game-Over triggern (z. B. ins Wasser springen) → Herzen im Game-Over-Screen korrekt
- [ ] DevTools Network-Tab: keine 404 auf `PixelArt/cat/`, `PixelArt/enemy_wasp/`, `PixelArt/collectibles/life_*`

---

## Nicht Teil dieser Phase

- `ui/screens/` Unterordner (siehe Mapping-Entscheidung).
- Fix der `PixelArt/cat/idle.png`-Drift in ASSET_LIST.md (Phase 8 Doku-Sync).
- Wasp-Sprite-Scaling (eigenes Ticket, Memory-Known-Issue).
- Updates an `.planning/**/*.md` Snapshots (Phase 8).

---

*Stand: ready for execution. Code + Docs Edits werden unmittelbar vor dem Script-Run angewendet.*
