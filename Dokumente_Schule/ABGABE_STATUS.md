# Abgabe-Status: Soggy Moggy / Gato Sin Botas

**Letztes Update:** 2026-04-22
**Branch:** chore/project-cleanup-2026-04-21
**Deadline:** verschoben, neues Datum ausstehend (Stand 21.04.2026)
**Zweck dieser Datei:** Zukünftigen Claude-Sessions sofortigen Überblick geben, was fertig ist und was noch fehlt. Vor jeder neuen Session hier schauen.

---

## Pflichtdokumente

| Dokument | Pfad | Status | Notizen |
|---|---|---|---|
| Themeneinreichung | `Dokumente_Schule/Einreichung/Themeneinreichung_Julian_Gomez.pdf` | Vorhanden | Eingereicht und abgestempelt |
| Projektplan | `Dokumente_Schule/Ausgefuellt/Projektplan_Julian_Gomez.docx` | Vorhanden | Stand Anfang Projekt |
| Arbeitsprotokoll | `Dokumente_Schule/Ausgefuellt/Arbeitsprotokoll_Julian_Gomez.docx` | Täglich aktualisieren | Muss bis Abgabetag fortlaufend geführt sein |
| GDD (Word) | `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.docx` | Vorhanden | Word-Version für Schulabgabe |
| GDD (Markdown) | `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.md` | Vorhanden, Phase 8 synced | Deadline auf „verschoben" gesetzt |
| Medienkatalog | `Dokumente_Schule/Medienkatalog.md` | Vorhanden (Phase 9) | Alle Assets verifiziert gegen Dateisystem-Stand 21.04.2026 |
| USB-Abgabe-Struktur | `Dokumente_Schule/USB-Abgabe-Struktur.md` | Vorhanden (Phase 9) | Checkliste für den finalen Stick |
| README | `README.md` | Vorhanden (Phase 9) | Vecteezy-Attribution, Controls, Starten, Credits |
| Video-Skript | `docs/video_script.md` | Vorhanden (Phase 9) | 7 Szenen, ca. 2:35 min geplant |
| Selbstständigkeitserklärung | nicht im Repo | BLOCKIERT | Handunterschrift erforderlich, muss manuell ausgefüllt und gescannt werden |
| Gameplay-Video | nicht im Repo | FEHLT | Noch nicht aufgenommen; Skript liegt in `docs/video_script.md` |

---

## Code-Status

| Bereich | Status | Notizen |
|---|---|---|
| L1 Gameplay | Fertig (Phases 1–4) | Stadt, Smog, Jalousie-Plattformen, 10 Wespen |
| L2 Gameplay | Fertig (Phase 04.3) | Aufzugschacht, Elektrizität, Pipe-Rendering, 15 Wespen |
| L3 Gameplay | Fertig | Leuchtturm, Flut, Brücken-Collider, 20 Wespen |
| Dialogue-System | Teilweise | `src/dialogue.js` fertig; 8 PNG-Bubbles fehlen noch (Illustrator-Export ausstehend) |
| Dialogue PNGs | FEHLEN | `PixelArt/thought_bubbles/dialogues/*.png` — alle 8 leer (Ordner da, `.gitkeep`). Quelle: `PixelArt/thought_bubbles/dialogue_bubbles.ai` |
| Dialogue Smoke-Test | Noch offen | 7-Schritt-Test in `docs/plans/2026-04-18-dialogue-system-design.md` |
| Audio | Phase 6 geplant | Keine Assets, keine Implementierung |
| GitHub Pages Hosting | Phase 7 geplant | Noch nicht deployed |
| Wasp-Sprite-Scaling | Bekanntes Problem | Sprite zu klein (ca. 2× zu skalieren); L2 fehlt Top-Wasp-Sprite |
| L2 C3 Collider | Bekanntes Problem | Katze passiert Schacht-Oberseite bei goalY+80 — kein Fix bisher |
| Linker Aufzug-Griff CHL | Bekanntes Problem | Rechts (CHR) erledigt, links (PIL x=0..98 y=464) fehlt |

---

## Offene Punkte (nach Priorität)

1. **Dialogue PNGs exportieren** — Illustrator `dialogue_bubbles.ai` öffnen, 8 Artboards als PNG exportieren nach `PixelArt/thought_bubbles/dialogues/`. Dateinamen: `l1_intro`, `l2_intro`, `l3_intro`, `l1_outro`, `l2_outro`, `l3_outro`, `life_hazard`, `life_wasp`.
2. **Dialogue Smoke-Test** — 7 Schritte in `docs/plans/2026-04-18-dialogue-system-design.md` durchführen, nachdem PNGs da sind.
3. **Gameplay-Video aufnehmen** — Skript in `docs/video_script.md`. OBS, 60 fps, MP4. Länge: 2–4 Minuten.
4. **Selbstständigkeitserklärung** — Formular der SRH ausdrucken, handschriftlich unterzeichnen, einscannen, als PDF in `Dokumente_Schule/Ausgefuellt/` ablegen.
5. **Arbeitsprotokoll** — täglich pflegen bis Abgabetag.
6. **L2 C3 Collider fixen** — eigenes Ticket/Session.
7. **Wasp-Sprite 2× skalieren** — eigenes Ticket/Session.
8. **L2 Hazard-Cap prüfen** — aktuell 22px, Empfehlung 60–80px ausprobieren.
9. **Audio (Phase 6)** — nach Dialogue-PNGs und Video.
10. **GitHub Pages (Phase 7)** — nach Phase 6.

---

## Cleanup-Phasen-Überblick

| Phase | Beschreibung | Status |
|---|---|---|
| 0 | Safety Net (Tag, Branch) | Branch existiert; Tag `pre-cleanup-2026-04-21` — Status unklar |
| 1 | Archive-Infrastruktur (`_archive/`) | Erledigt |
| 2 | Level-Ordner umbenennen (L2/L3 Swap) | Erledigt |
| 3 | Neue Gruppen `characters/` + `ui/` | Erledigt |
| 4 | Fonts archivieren | Erledigt |
| 5 | thought_bubbles archivieren + PNG-Migration vorbereiten | Erledigt |
| 6 | Code-Cleanup (Rocket, keys.shoot, console.log) | Erledigt |
| 7 | pipes_bottom Fix | Erledigt |
| 8 | Doku-Sync | Erledigt |
| 9 | Schul-Abgabe-Artefakte | Erledigt (dieser Commit) |

---

## Nächste Schritte (erste Session nach dieser hier)

1. Illustrator öffnen, `dialogue_bubbles.ai` fertigstellen, 8 PNGs exportieren.
2. PNGs in `PixelArt/thought_bubbles/dialogues/` ablegen, committen.
3. Dialogue Smoke-Test ausführen (7 Schritte).
4. Danach: Gameplay-Video aufnehmen.
5. Danach: Selbstständigkeitserklärung unterschreiben und scannen.
6. USB-Stick nach Checkliste in `Dokumente_Schule/USB-Abgabe-Struktur.md` zusammenstellen.
