# Submission Status: Soggy Moggy / Gato Sin Botas

**Last updated:** 2026-04-22
**Branch:** chore/project-cleanup-2026-04-21
**Deadline:** postponed, new date pending (as of 21.04.2026)
**Purpose of this file:** Give future Claude sessions an immediate overview of what is done and what is still missing. Check here before starting any new session.

---

## Required Documents

| Document | Path | Status | Notes |
|---|---|---|---|
| Topic submission | `Dokumente_Schule/Einreichung/Themeneinreichung_Julian_Gomez.pdf` | Present | Submitted and stamped |
| Project plan | `Dokumente_Schule/Ausgefuellt/Projektplan_Julian_Gomez.docx` | Present | State at project start |
| Work log | `Dokumente_Schule/Ausgefuellt/Arbeitsprotokoll_Julian_Gomez.docx` | Update daily | Must be kept continuously up to submission day |
| GDD (Word) | `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.docx` | Present | Word version for school submission |
| GDD (Markdown) | `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.md` | Present, Phase 8 synced | Deadline set to "postponed" |
| Media catalogue | `Dokumente_Schule/Medienkatalog.md` | Present (Phase 9) | All assets verified against filesystem state 21.04.2026 |
| USB submission structure | `Dokumente_Schule/USB-Abgabe-Struktur.md` | Present (Phase 9) | Checklist for the final stick |
| README | `README.md` | Present (Phase 9) | Vecteezy attribution, controls, how to run, credits |
| Video script | `docs/video_script.md` | Present (Phase 9) | 7 scenes, approx. 2:35 min planned |
| Declaration of independence | not in repo | BLOCKED | Handwritten signature required; must be filled out manually and scanned |
| Gameplay video | not in repo | MISSING | Not yet recorded; script is in `docs/video_script.md` |

---

## Code Status

| Area | Status | Notes |
|---|---|---|
| L1 Gameplay | Done (Phases 1–4) | City, smog, jalousie platforms, 10 wasps |
| L2 Gameplay | Done (Phase 04.3) | Elevator shaft, electricity, pipe rendering, 15 wasps |
| L3 Gameplay | Done | Lighthouse, flood, bridge colliders, 20 wasps |
| Dialogue system | Partial | `src/dialogue.js` done; 8 PNG bubbles still missing (Illustrator export pending) |
| Dialogue PNGs | MISSING | `PixelArt/thought_bubbles/dialogues/*.png` — all 8 empty (folder exists, `.gitkeep`). Source: `PixelArt/thought_bubbles/dialogue_bubbles.ai` |
| Dialogue smoke test | Still open | 7-step test in `docs/plans/2026-04-18-dialogue-system-design.md` |
| Audio | Phase 6 planned | No assets, no implementation |
| GitHub Pages hosting | Phase 7 planned | Not yet deployed |
| Wasp sprite scaling | Known issue | Sprite too small (needs approx. 2x scale); L2 missing top wasp sprite |
| L2 C3 collider | Known issue | Cat passes through shaft top at goalY+80 — no fix yet |
| Left elevator handle CHL | Known issue | Right side (CHR) done; left side (PIL x=0..98 y=464) missing |

---

## Open Items (by priority)

1. **Export dialogue PNGs** — open Illustrator `dialogue_bubbles.ai`, export 8 artboards as PNG to `PixelArt/thought_bubbles/dialogues/`. Filenames: `l1_intro`, `l2_intro`, `l3_intro`, `l1_outro`, `l2_outro`, `l3_outro`, `life_hazard`, `life_wasp`.
2. **Dialogue smoke test** — run the 7 steps in `docs/plans/2026-04-18-dialogue-system-design.md` once the PNGs are in place.
3. **Record gameplay video** — script in `docs/video_script.md`. OBS, 60 fps, MP4. Length: 2 to 4 minutes.
4. **Declaration of independence** — print the SRH form, sign by hand, scan, save as PDF in `Dokumente_Schule/Ausgefuellt/`.
5. **Work log** — keep updated daily until submission day.
6. **Fix L2 C3 collider** — separate ticket/session.
7. **Scale wasp sprite 2x** — separate ticket/session.
8. **Check L2 hazard cap** — currently 22px; try 60–80px.
9. **Audio (Phase 6)** — after dialogue PNGs and video.
10. **GitHub Pages (Phase 7)** — after Phase 6.

---

## Cleanup Phases Overview

| Phase | Description | Status |
|---|---|---|
| 0 | Safety net (tag, branch) | Branch exists; tag `pre-cleanup-2026-04-21` — status unclear |
| 1 | Archive infrastructure (`_archive/`) | Done |
| 2 | Rename level folders (L2/L3 swap) | Done |
| 3 | New groups `characters/` + `ui/` | Done |
| 4 | Archive fonts | Done |
| 5 | Archive thought_bubbles + prepare PNG migration | Done |
| 6 | Code cleanup (Rocket, keys.shoot, console.log) | Done |
| 7 | pipes_bottom fix | Done |
| 8 | Documentation sync | Done |
| 9 | School submission artefacts | Done (this commit) |

---

## Next Steps (first session after this one)

1. Open Illustrator, finish `dialogue_bubbles.ai`, export 8 PNGs.
2. Place PNGs in `PixelArt/thought_bubbles/dialogues/`, commit.
3. Run the dialogue smoke test (7 steps).
4. After that: record the gameplay video.
5. After that: sign and scan the declaration of independence.
6. Assemble the USB stick following the checklist in `Dokumente_Schule/USB-Abgabe-Struktur.md`.
