# USB Submission Structure — Soggy Moggy

**Author:** Julian Gomez
**Date:** 21.04.2026
**Purpose:** Recommended folder structure for the USB stick submitted together with the written documents to SRH Fachschule. This file is a guide for Julian so that assembling the stick is fast and requires no repeated copying.

---

## Top-Level Structure

```
USB_Abgabe_Julian_Gomez_2026/
├── 01_Spiel/                         Playable browser version
│   ├── index.html
│   ├── src/                          Source code (JavaScript)
│   ├── Visuals/                     Assets (production PNGs only, no _wip/_archive)
│   ├── docs/                         Project-internal documentation (Style Guide, Asset List, Plans)
│   └── README.md                     Getting-started guide (from repo root)
│
├── 02_Dokumente/                     School documents
│   ├── Themeneinreichung_Julian_Gomez.pdf
│   ├── Projektplan_Julian_Gomez.docx
│   ├── Arbeitsprotokoll_Julian_Gomez.docx
│   ├── GDD_Julian_Gomez.docx         (Word version)
│   ├── GDD_Julian_Gomez.md           (Markdown version, parallel)
│   ├── Medienkatalog.md              (from Dokumente_Schule/)
│   └── Selbststaendigkeitserklaerung_Julian_Gomez.pdf   (signed, scanned)
│
├── 03_Video/                         Gameplay presentation
│   ├── Gameplay_SoggyMoggy_2026-04.mp4
│   └── video_script.md               (narration text as evidence)
│
├── 04_Screenshots/                   Selection from Screenshots/Levels/
│   ├── Level1.1.png
│   ├── Level1.2.png
│   ├── Level2.1.png
│   ├── Level2.2.png
│   ├── Level3.1.png
│   └── Level3.2.png
│
└── 05_Quellen_Repo/                  Full repo snapshot
    └── Abschlussprojekt_SRH_26/      (complete git state, including .git if permitted)
```

## What Goes Where

- **01_Spiel** is the playable version. Only what `index.html` needs in the browser: `src/`, production `Visuals/` folders, `docs/` as reference, and the README as the entry point. `Visuals/_wip/`, `Visuals/_dev/`, `Visuals/_archive/`, and `.pxo/.ai/.psd` source files are not copied here, to keep the folder small.
- **02_Dokumente** are the exam documents for the lecturer. The PDFs are the submission versions; the Markdown files sit alongside them as plain-text backups.
- **03_Video** contains the gameplay video and the accompanying script as evidence of Julian's own written work.
- **04_Screenshots** gives the lecturer a quick visual impression without having to launch the game.
- **05_Quellen_Repo** is the full repository state including `_archive/` and `_dev/` folders. If the school wants the `.git` directory excluded, a ZIP of the working directory is placed here instead.

## Naming Convention

- All folder names without spaces, with a number prefix (`01_`, `02_`, ...) for stable sorting.
- All documents include Julian Gomez as the name so the attribution stays clear even after repacking.
- The gameplay video gets a month-date suffix in the filename so that a replacement version is clearly distinguishable from the original.

## Checklist

[ ] 01_Spiel/ — `index.html` starts in the browser without errors
[ ] 01_Spiel/src/ — all `.js` files present
[ ] 01_Spiel/Visuals/ — production assets only, no `_wip/_dev/_archive`
[ ] 01_Spiel/docs/ — `STYLE_GUIDE.md`, `ASSET_LIST.md`, `plans/README.md`
[ ] 01_Spiel/README.md — current version from repo root
[ ] 02_Dokumente/Themeneinreichung_Julian_Gomez.pdf
[ ] 02_Dokumente/Projektplan_Julian_Gomez.docx
[ ] 02_Dokumente/Arbeitsprotokoll_Julian_Gomez.docx — updated to submission day
[ ] 02_Dokumente/GDD_Julian_Gomez.docx + .md
[ ] 02_Dokumente/Medienkatalog.md
[ ] 02_Dokumente/Selbststaendigkeitserklaerung_Julian_Gomez.pdf — signed
[ ] 03_Video/Gameplay_SoggyMoggy_2026-04.mp4 — 2 to 4 minutes
[ ] 03_Video/video_script.md
[ ] 04_Screenshots/ — Level1.1 through Level3.2
[ ] 05_Quellen_Repo/Abschlussprojekt_SRH_26/ — latest commit state
[ ] USB stick virus-scanned
[ ] USB stick labelled with name and submission date

## Note

The exact submission date has been postponed (as of 21.04.2026, new date still pending). The stick will only be assembled finally once the new date is confirmed and the work log has been kept up to that day.
