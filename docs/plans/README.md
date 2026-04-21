# docs/plans — Planungs-Index

Chronologische Übersicht aller Planungsdokumente des Projekts **Soggy Moggy / Gato Sin Botas**.

## Status-Legende

- **active** — Dokument beschreibt aktuell gültige Arbeit (laufende Phase oder aktiver Referenzstand).
- **executed** — Plan wurde umgesetzt; Inhalt ist Historie, keine offenen Aufgaben.
- **superseded** — Plan ist durch eine neuere Entscheidung überholt; Banner im Kopf verweist auf die neue Quelle.
- **partial** — Teile sind noch gültig, andere nicht; Banner erklärt, was noch stimmt.
- **teaching** — Meta-Plan für die CARL/Teach-Skill-Infrastruktur, nicht Spiel-bezogen.

## Chronologie

| Datum | Datei | Thema | Status |
|---|---|---|---|
| 2026-03-10 | `2026-03-10-teach-skill-design.md` | Design für den `/teach`-Skill (persönliche Lern-Infrastruktur) | teaching |
| 2026-03-10 | `2026-03-10-teach-implementation.md` | Implementierung des `/teach`-Skills | teaching |
| 2026-04-07 | `2026-04-07-l2-cloud-platforms-design.md` | L2 mit Wolken-Plattformen (alte Level-Zuordnung) | superseded |
| 2026-04-07 | `2026-04-07-l2-cloud-platforms-impl.md` | Implementierungsplan für Wolken-Plattformen | superseded |
| 2026-04-18 | `2026-04-18-dialogue-system-design.md` | Dialogue-System mit Bitmap-Font-Atlas (`font.js`, `drawText`) | superseded |
| 2026-04-20 | `2026-04-20-dialogue-bubbles-illustrator.md` | Illustrator-Produktionsplan für 8 Dialog-Bubble-PNGs | partial |
| 2026-04-21 | `2026-04-21-project-cleanup.md` | Projekt-Cleanup-Masterplan (9 Phasen) | executed (Phasen 0–8), Phase 9 offen |
| 2026-04-21 | `2026-04-21-phase3-asset-groups.md` | Sub-Plan zu Phase 3 (characters/ + ui/) | executed |

## Aktueller Stand

- **Cleanup-Branch:** `chore/project-cleanup-2026-04-21` — Phasen 0–8 committed.
- **Dialogue-System-Wahrheit:** `src/dialogue.js` + MEMORY.md Abschnitt „Static bubble PNG approach".
- **L2-Platform-Wahrheit:** `src/platforms.js` `_L2_VARIANTS` + MEMORY.md Abschnitt „L2 Shaft Platforms".
- **Deadline:** verschoben (neues Datum ausstehend).

## Konvention

Neue Pläne bekommen das Datum im Dateinamen (`YYYY-MM-DD-kurzer-slug.md`) und werden beim Anlegen in dieser Tabelle ergänzt. Überholte Pläne bekommen einen Superseded-Banner im Kopf und bleiben als Historie liegen — sie werden nicht gelöscht.
