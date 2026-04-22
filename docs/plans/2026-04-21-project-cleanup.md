# Project Cleanup Plan — Soggy Moggy

> **Status (2026-04-21):** Phasen 0–7 ausgeführt auf Branch `chore/project-cleanup-2026-04-21` (Commits f430034 Phase 1 … c26d972 Phase 7). Phase 8 (Doku-Sync) ist dieser Commit. Phase 9 (README + Medienkatalog + Selbstständigkeitserklärung + USB-Ordner) steht noch aus.

**Erstellt:** 2026-04-21
**Ziel:** Projekt-weite Hygiene auf akademischem Best-Practice-Niveau vor Abgabe. Ordnerstruktur, Asset-Archivierung, Code-Cleanup, Doku-Sync.
**Ausgangspunkt:** Audit abgeschlossen (JS-Code, HTML/Assets, docs/plans) am 2026-04-21 via drei parallele Agents. Keine Regressions in laufenden Features zugelassen.
**Baseline:** master + feature/04.3-l2-elevator-interior HEAD am Tag der Plan-Erstellung.
**Hard Rules:**
- Keine Assets endgültig gelöscht — alles wird archiviert (git mv in `_archive/`).
- One-change-per-iteration: jede Phase ein atomarer Commit.
- Gaming-Funktionalität > Ästhetik — jede Phase endet mit Smoke-Test (Browser-Start, L1/L2/L3 spielbar).
- Deadline ist verschoben wenige Tage nach 22.04.2026, aber nicht unbegrenzt.
- Dozent bewertet Arbeitsdateien — Struktur muss selbsterklärend sein.

---

## Phasen-Übersicht

| # | Phase | Blast-Radius | Reversibel? | Smoke-Test danach |
|---|---|---|---|---|
| 0 | Safety Net (Backup-Tag, Branch-Snapshot) | 0 | Ja | — |
| 1 | Archive-Infrastruktur anlegen | Lokal | Ja (git) | — |
| 2 | Level-Ordner-Umbenennung (L2/L3 Swap) | Asset-Pfade | Ja (git mv) | Browser-Start, alle 3 Level |
| 3 | Neue Gruppen characters/ + ui/ | Asset-Pfade | Ja (git mv) | Browser-Start |
| 4 | Fonts-Ordner archivieren | Asset-Pfade | Ja | Dialogue-Text-Render |
| 5 | thought_bubbles/ archivieren + PNG-Migration vorbereiten | dialogue.js | Ja | Dialogue-Bubble-Render |
| 6 | Code-Cleanup: L2-Rocket, keys.shoot, Debug-Output | src/*.js | Ja | Full-Gameplay |
| 7 | pipes_bottom.png Feature-Fix (erste Pipe über Aufzugsdecke) | background.js | Ja | L2 visuell |
| 8 | Doku-Sync: STYLE_GUIDE, ROADMAP, Superseded-Banner | docs/ | Ja | — |
| 9 | Schul-Abgabe-Artefakte: README.md, Medienkatalog, Selbstständigkeitserklärung | repo-root | Ja | — |

---

## Phase 0 — Safety Net

**Intention:** Vor jeder Änderung einen Ankerpunkt schaffen zu dem jederzeit zurückgekehrt werden kann. Git-Tag auf aktuellen master HEAD; branch-snapshot auf feature/04.3.

**Deliverables:** Tag `pre-cleanup-2026-04-21` auf master, dokumentierter HEAD auf feature/04.3-l2-elevator-interior.

---

## Phase 1 — Archive-Infrastruktur

**Intention:** Zentrales `PixelArt/_archive/` anlegen mit erklärendem README, das jedem Betrachter (Dozent) zeigt was archiviert wurde, wann, warum, und wie es wiederherzustellen wäre. Keine Assets verschoben in dieser Phase — nur die Struktur.

**Deliverables:** `PixelArt/_archive/README.md` mit Abschnitten (Was, Wann, Warum, Recovery). Zentrales `PixelArt/README.md` das die Top-Level-Ordnerstruktur erklärt (Variante C aus Brainstorming). `PixelArt/NAMING.md` bleibt unberührt.

---

## Phase 2 — Level-Ordner-Umbenennung

**Intention:** Aktuelle Ordnernamen spiegeln das alte Level-Mapping wider (L2=See, L3=Schacht). Faktisch ist es seit Wochen L2=Schacht, L3=See. Korrektur per `git mv` für saubere Nachvollziehbarkeit.

**Deliverables:**
- `PixelArt/backgrounds/level2_see/` → `PixelArt/backgrounds/level_3_sea/`
- `PixelArt/backgrounds/level3_shaft/` → `PixelArt/backgrounds/level_2_shaft/`
- `PixelArt/platforms/level2_lift/` → `PixelArt/platforms/level_2_lift/` (Präfix-Konsistenz)
- Alle Referenzen in `src/background.js`, `src/platforms.js`, `src/enemies.js` angepasst.

**Smoke-Test:** L1/L2/L3 starten, Backgrounds + Platforms + Enemies rendern.

---

## Phase 3 — Neue Asset-Gruppen

**Intention:** Derzeit liegen Cat-Sprites direkt in `PixelArt/`, UI-Elemente (HUD, Lives, Game-Over) verstreut. Eine flache Struktur ist für den Dozenten schwer zu navigieren. Zwei neue Gruppen bringen Ordnung ohne Funktionalität zu ändern.

**Deliverables:**
- `PixelArt/characters/cat/` (aktuelle Cat-Sprites)
- `PixelArt/characters/wasp/` (wasp_sheet.png + Varianten)
- `PixelArt/ui/hud/` (Herzen, Score)
- `PixelArt/ui/screens/` (Start, Game-Over, Level-Complete)
- Alle `src/*.js` Pfad-Referenzen gefixt.

**Smoke-Test:** Cat-Rendering + Wasp-Rendering + HUD + Screens.

---

## Phase 4 — Fonts-Ordner archivieren

**Intention:** Code lädt nur noch zwei Font-PNGs (`alphabet_pixel_retro_video_game_style.png`, `alphabet_black_230px.png`). Der restliche `fonts/`-Ordner enthält Vecteezy-Quelldateien, alte EPS, PDFs — das ist Arbeitsspur, gehört ins Archiv mit Attribution-Hinweis.

**Deliverables:** `PixelArt/fonts/Archive/` komplett nach `_archive/fonts_source_files/` verschoben. Die zwei aktiven PNGs + `.ai`-Quelldateien bleiben live. README-Eintrag in `_archive/` dokumentiert die Vecteezy-Attribution.

**Smoke-Test:** Dialogue-Titel + Body-Text rendern korrekt.

---

## Phase 5 — thought_bubbles archivieren + PNG-Migration

**Intention:** `thought-bubbles.png`/`.pxo` war die erste Iteration, wird ersetzt durch 8 individuelle PNGs aus Illustrator (`dialogue_bubbles.ai`). Alte Bubbles archivieren, Code auf neuen PNG-Loader vorbereiten. PNGs selbst werden erst nach Illustrator-Export eingecheckt (nicht Teil dieser Phase).

**Deliverables:**
- `PixelArt/thought_bubbles/thought-bubbles.{png,pxo}` → `_archive/thought_bubbles_v1/`
- `PixelArt/thought_bubbles/dialogues/` Ordner angelegt (leer, bereit für Illustrator-Export)
- `src/dialogue.js` 4 pending Fixes umgesetzt (Font-Dateinamen, Debug-Entfernung)

**Smoke-Test:** Dialogue-System zeigt Text ohne Bubbles (PNGs fehlen noch — erwartet). Keine Console-Errors.

---

## Phase 6 — Code-Cleanup

**Intention:** L2-Rocket-Subsystem (abandoned feature), `keys.shoot` (tot), Debug-Output (production readiness). DRY-Refactors nur wo risikoarm.

**Deliverables:**
- L2-Rocket-Code und -Assets vollständig entfernt oder explizit als Future-Feature markiert.
- `keys.shoot` Entfernung in `src/main.js` + `src/player.js`.
- Alle `console.log` in `src/*.js` entfernt (oder hinter `DEBUG`-Flag).
- Offensichtliche Duplikate konsolidiert, solange keine Semantik geändert wird.

**Smoke-Test:** Vollständiges Gameplay L1 → L2 → L3 → Win-Screen ohne Console-Errors.

---

## Phase 7 — pipes_bottom.png Feature-Fix

**Intention:** `pipes_bottom.png` ist aktuell als dead asset geladen aber nicht gerendert. Korrekt wäre: erste Pipe-Kachel direkt über der Aufzugsdecke (y=96), darüber stapelt `pipes_mid.png`, oben schließt `pipes_top.png`.

**Deliverables:** `src/background.js` `_drawL3Mid` um Bottom-Pipe-Tile erweitert. Rendering getestet am Übergang Aufzug-Interior ↔ Shaft.

**Smoke-Test:** L2 Übergang vom Aufzug in den Schacht zeigt durchgehende Pipe ohne Lücke.

---

## Phase 8 — Doku-Sync

**Intention:** Drift zwischen Code-Realität und Doku abbauen. ROADMAP, STATE, REQUIREMENTS, PROJECT sind heute bereits gefixt. Hier folgen STYLE_GUIDE, alte Plan-Dateien, GDD-Deadline.

**Deliverables:**
- `docs/STYLE_GUIDE.md` Sprite-Dimensionen aktualisiert (Cat, Wasp, Platforms L1/L2/L3, Hazards).
- Ältere `docs/plans/*.md` die durch spätere Dokumente abgelöst wurden bekommen Superseded-Banner.
- `Dokumente_Schule/Completed/GDD_Julian_Gomez.md` Deadline angepasst.
- `docs/plans/README.md` Index-Datei mit Kurz-Beschreibung pro Plan, sortiert nach Datum.

---

## Phase 9 — Schul-Abgabe-Artefakte

**Intention:** Die vom Dozenten geforderten Deliverables fehlen noch. Jedes wird als eigenständiger Commit mit klarer Diff-Geschichte angelegt.

**Deliverables:**
- `README.md` auf Repo-Root: Projektbeschreibung, Controls, wie-zu-starten, Credits (Vecteezy, andere), Lizenz-Hinweis, Screenshot.
- `Dokumente_Schule/Medienkatalog.md` — Tabelle aller Assets mit Herkunft/Lizenz.
- `Dokumente_Schule/Selbstständigkeitserklärung_Julian_Gomez.pdf` — Pflicht-Dokument für Abgabe.
- `USB-Abgabe-Struktur.md` — Notiz für finale USB-Zusammenstellung.
- Gameplay-Video-Script (welche Szenen, welche Reihenfolge) als `docs/video_script.md`.

---

## Verifikations-Gates

Nach jeder Phase:

1. `git status` — erwartete Datei-Diffs, keine zusätzlichen.
2. Browser-Reload auf `index.html` — Fehler-Check Console + visueller Smoke-Test (jeweils phasenspezifisch).
3. Atomarer Commit mit präzisem Message-Format: `cleanup(phaseN): <Kurzbeschreibung>`.
4. Checkpoint vor Phase N+1 — kurzer Status ins Chat-Fenster.

---

## Nicht Teil dieses Plans

- Wasp-Sprite-Scaling (Known Issue aus Memory — eigenes Ticket).
- L2 C3 Collider Bugfix (eigenes Ticket).
- Phase 5 (Push/HUD) Gameplay-Ausbau.
- Phase 6 (Audio) Implementation.
- Phase 7 (Hosting) Deployment.
- Illustrator-Arbeit selbst (läuft parallel, Output wird in Phase 5-Fortsetzung eingecheckt).

---

*Stand: Skelett. Phasen-Details werden vor Ausführung pro Phase per separatem `Edit`-Call gefüllt (Outline-first-Pattern per CLAUDE.md).*
