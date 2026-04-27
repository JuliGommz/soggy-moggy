# Submission Status: Soggy Moggy

**Last updated:** 2026-04-27 (overnight cleanup pass)
**Branch:** master
**Deadline:** postponed, new date pending (as of 22.04.2026)
**Purpose:** Quick overview of what is done, in progress, and still missing.

---

## Required Documents

| Document | Path | Status | Notes |
|---|---|---|---|
| Topic submission | `Dokumente_Schule/Einreichung/Themeneinreichung_Julian_Gomez.pdf` | Done | Submitted and stamped |
| Project plan | `Dokumente_Schule/Ausgefuellt/Projektplan_Julian_Gomez.docx` | Done | State at project start |
| Work log | `Dokumente_Schule/Ausgefuellt/Arbeitsprotokoll_Julian_Gomez.docx` | Update daily | Must be kept current up to submission day |
| GDD (Word) | `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.docx` | Done | Synced with current game state |
| GDD (Markdown) | `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.md` | Done | Phase 8 synced |
| Media catalogue | `Dokumente_Schule/Medienkatalog.md` | Needs review | Verify it reflects current asset state |
| USB submission structure | `Dokumente_Schule/USB-Abgabe-Struktur.md` | Done | Checklist for the final stick |
| README | `README.md` | Done | Updated 2026-04-27 with AI disclosure + HTMLAudio note |
| Video script | `docs/video_script.md` | Done | 7 scenes, ~2:35 min planned |
| **Declaration of independence** (Selbstständigkeitserklärung) | not in repo | **TODO — handwritten signature required** | See `Dokumente_Schule/SELBSTSTAENDIGKEIT_AI_KLAUSEL.md` for the AI-attribution paragraph that must be included. Print SRH form, fill out, sign, scan to PDF, save in `Ausgefuellt/`. |
| **Gameplay video** | not in repo | **TODO** | Script ready in `docs/video_script.md`. Record once smoke test passes. |

---

## Code Status

| Area | Status | Notes |
|---|---|---|
| L1 Gameplay (City) | Done | Smog hazard, jalousie platforms, 8 wasps, windrad outro |
| L2 Gameplay (Elevator Shaft) | Done | Electricity hazard, pipe rendering, 12 wasps, bell outro |
| L3 Gameplay (Lighthouse) | Done | Flood hazard (LOCKED renderer), 16 wasps, lever outro |
| Dialogue system | Done | 8 PNG bubbles in place, all keys tuned |
| Audio (Phase 6) | Done | HTMLAudio v2.1 — music + SFX + wasp buzz proximity + hazard ambient |
| End screens | Done | Start, Pause, Level Complete, Game Over, Success (with congrats overlay + confetti) |
| Score animation between levels | Done | Per Julian 2026-04-27 |
| Difficulty system | Done | Explorer / Adventurer / Enlightened, 4 levers |
| **Cleanup pass** | **Done 2026-04-27** | Headers, English comments, dead-code removal, magic-number naming, naming convention sweep, 13 bug fixes folded in. See `.planning/codebase/CLEANUP-PLAN.md`. |
| **Folder rename einzel_sprites** | **Done 2026-04-27** | Renamed `Visuals/backgrounds/level_3_sea/Einzel-Sprites` → `einzel_sprites` (lowercase, snake_case for consistency with `cat/einzel_sprites` and `wasp/einzel_sprites`). Code references in `src/background.js` updated. |
| **Smoke test** | **TODO** | 13-step walkthrough drafted; run on hard refresh + Firefox + Chromium |
| GitHub Pages hosting | Backlog | Not prüfungsrelevant for Rahmenthema 3, optional |

---

## Pending Actions (priority order)

1. **Smoke test** — Walk through the 13-step list once. Confirm L1/L2/L3 outros, NEW BEST tie, mute-click protection, etc. Hard refresh required (`Ctrl+Shift+R`).
2. **Record gameplay video** — OBS, 60 fps, MP4, 2–4 min. Use the script.
3. **Sign Selbstständigkeitserklärung** — print form, fill out, sign, scan, save as PDF. Include the AI-attribution paragraph from `SELBSTSTAENDIGKEIT_AI_KLAUSEL.md`.
4. **Daily work log** — keep `Arbeitsprotokoll_Julian_Gomez.docx` updated.
5. **Verify Medienkatalog** — confirm all asset paths still resolve after the folder rename + cleanup pass.
7. **Assemble USB stick** — follow `USB-Abgabe-Struktur.md`.

---

## Cleanup Phase 9.5 — Code Quality Pass (2026-04-27)

| Phase | Description | Status |
|---|---|---|
| File headers | All 15 src files now have JSDoc header with author + AI disclosure + purpose + dependencies | Done |
| English comments | German tuning notes translated to English | Done |
| Dead code | rng() PRNG removed, debugLH branch removed, Bridge 3/4 stale comments removed, water_drain restored after wrong removal | Done |
| Magic numbers | Named constants extracted in audio, enemies, player, game-state, input | Done |
| Bug fixes folded in | 13 fixes from REVIEW.md + REVIEW-2.md (WR-01..05, WR2-1..3, IN-01..04, IN2-1, IN2-3, IN2-5) | Done |
| Naming convention | UPPER_SNAKE for true constants, camelCase for everything else, leading underscore for file-private | Done |
| index.html | Consolidated load-order documentation block | Done |
| Glyph rendering bug | Fixed bottom-pixel clipping by setting `imageSmoothingEnabled = false` on overlay canvases (start-screen MoggyTitle + success-screen CongratsOverlay) | Done |
| Action key on QWERTZ | KeyY accepted alongside KeyZ — German keyboard works | Done |
| Start-screen layout | Button + Controls + DEV/HI-SCORE rebalanced per Julian's tweaks | Done |
| Smoke test | Pending Julian's walkthrough | TODO |

Reference: `.planning/codebase/REVIEW.md`, `.planning/codebase/REVIEW-2.md`, `.planning/codebase/CLEANUP-PLAN.md`.

---

## Next Steps (first session after this one)

1. Run smoke test (13 steps) — see Claude session notes for full checklist.
2. Record gameplay video.
3. Print + sign + scan Selbstständigkeitserklärung.
4. Update Medienkatalog after folder rename.
5. Assemble USB stick.
