# USB-Abgabe-Struktur — Soggy Moggy / Gato Sin Botas

**Verfasser:** Julian Gomez
**Stand:** 21.04.2026
**Zweck:** Empfohlene Ordnerstruktur für den USB-Stick, der zusammen mit den schriftlichen Dokumenten bei der SRH Fachschule eingereicht wird. Diese Datei ist Orientierung für Julian, damit das Zusammenstellen auf dem Stick schnell und ohne Umkopieren abläuft.

---

## Top-Level-Struktur

```
USB_Abgabe_Julian_Gomez_2026/
├── 01_Spiel/                         Lauffähige Browser-Version
│   ├── index.html
│   ├── src/                          Quellcode (JavaScript)
│   ├── PixelArt/                     Assets (nur produktive PNGs, keine _wip/_archive)
│   ├── docs/                         Projektinterne Doku (Style Guide, Asset-Liste, Pläne)
│   └── README.md                     Start-Anleitung (aus Repo-Wurzel)
│
├── 02_Dokumente/                     Schulunterlagen
│   ├── Themeneinreichung_Julian_Gomez.pdf
│   ├── Projektplan_Julian_Gomez.docx
│   ├── Arbeitsprotokoll_Julian_Gomez.docx
│   ├── GDD_Julian_Gomez.docx         (Word-Version)
│   ├── GDD_Julian_Gomez.md           (Markdown-Version, parallel)
│   ├── Medienkatalog.md              (aus Dokumente_Schule/)
│   └── Selbststaendigkeitserklaerung_Julian_Gomez.pdf   (unterschrieben, gescannt)
│
├── 03_Video/                         Gameplay-Präsentation
│   ├── Gameplay_SoggyMoggy_2026-04.mp4
│   └── video_script.md               (Sprecher-Text als Nachweis)
│
├── 04_Screenshots/                   Auswahl aus Screenshots/Levels/
│   ├── Level1.1.png
│   ├── Level1.2.png
│   ├── Level2.1.png
│   ├── Level2.2.png
│   ├── Level3.1.png
│   └── Level3.2.png
│
└── 05_Quellen_Repo/                  Vollständiger Repo-Snapshot
    └── Abschlussprojekt_SRH_26/      (kompletter Git-Stand, inkl. .git falls erlaubt)
```

## Was wohin gehört

- **01_Spiel** ist die spielbare Version. Nur das, was für `index.html` im Browser nötig ist: `src/`, produktive `PixelArt/`-Ordner, `docs/` als Referenz, die README als Einstieg. `PixelArt/_wip/`, `PixelArt/_dev/`, `PixelArt/_archive/` und `.pxo/.ai/.psd`-Quellen werden hier nicht mitkopiert, um den Ordner klein zu halten.
- **02_Dokumente** sind die Prüfungsunterlagen für den Dozenten. Die PDFs sind die Abgabeversionen, die Markdown-Dateien liegen als Klartext-Backup daneben.
- **03_Video** enthält das Gameplay-Video sowie das zugehörige Skript als Nachweis für die eigene Textarbeit.
- **04_Screenshots** gibt dem Dozenten einen schnellen visuellen Eindruck ohne dass er das Spiel starten muss.
- **05_Quellen_Repo** ist der vollständige Repository-Stand inklusive `_archive/`- und `_dev/`-Ordnern. Falls die Schule das `.git`-Verzeichnis ausgeschlossen wissen will, wird stattdessen ein ZIP des Arbeitsverzeichnisses abgelegt.

## Namenskonvention

- Alle Ordnernamen deutsch, ohne Leerzeichen, mit Nummern-Präfix (`01_`, `02_`, …) für stabile Sortierung.
- Alle Dokumente tragen Julian Gomez als Namen, damit die Zuordnung auch nach dem Umpacken eindeutig bleibt.
- Gameplay-Video bekommt das Monat-Datum-Kürzel im Dateinamen, damit beim Nachliefern einer neuen Fassung die alte ersichtlich bleibt.

## Checkliste

[ ] 01_Spiel/ — `index.html` startet im Browser ohne Fehler
[ ] 01_Spiel/src/ — alle `.js`-Dateien vorhanden
[ ] 01_Spiel/PixelArt/ — nur produktive Assets, keine `_wip/_dev/_archive`
[ ] 01_Spiel/docs/ — `STYLE_GUIDE.md`, `ASSET_LIST.md`, `plans/README.md`
[ ] 01_Spiel/README.md — aktuelle Fassung aus Repo-Wurzel
[ ] 02_Dokumente/Themeneinreichung_Julian_Gomez.pdf
[ ] 02_Dokumente/Projektplan_Julian_Gomez.docx
[ ] 02_Dokumente/Arbeitsprotokoll_Julian_Gomez.docx — Stand Abgabetag
[ ] 02_Dokumente/GDD_Julian_Gomez.docx + .md
[ ] 02_Dokumente/Medienkatalog.md
[ ] 02_Dokumente/Selbststaendigkeitserklaerung_Julian_Gomez.pdf — unterschrieben
[ ] 03_Video/Gameplay_SoggyMoggy_2026-04.mp4 — 2–4 Minuten
[ ] 03_Video/video_script.md
[ ] 04_Screenshots/ — Level1.1 bis Level3.2
[ ] 05_Quellen_Repo/Abschlussprojekt_SRH_26/ — letzter Commit-Stand
[ ] USB-Stick virenscannt
[ ] USB-Stick beschriftet mit Name und Abgabedatum

## Hinweis

Das genaue Abgabedatum ist verschoben (Stand 21.04.2026 noch ausstehend). Der Stick wird erst final zusammengestellt, sobald das neue Datum feststeht und das Arbeitsprotokoll bis zu diesem Datum gepflegt ist.
