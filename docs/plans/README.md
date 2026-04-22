# docs/plans — Planning Index

Chronological overview of all planning documents for the project **Soggy Moggy**.

## Status Legend

- **active** — Document describes currently valid work (ongoing phase or active reference state).
- **executed** — Plan has been implemented; content is history, no open tasks remain.
- **superseded** — Plan has been replaced by a newer decision; a banner at the top points to the new source.
- **partial** — Some parts are still valid, others are not; a banner explains what still applies.
- **teaching** — Meta-plan for the CARL/Teach-Skill infrastructure, not game-related.

## Chronology

| Date | File | Topic | Status |
|---|---|---|---|
| 2026-03-10 | `2026-03-10-teach-skill-design.md` | Design for the `/teach` skill (personal learning infrastructure) | teaching |
| 2026-03-10 | `2026-03-10-teach-implementation.md` | Implementation of the `/teach` skill | teaching |
| 2026-04-07 | `2026-04-07-l2-cloud-platforms-design.md` | L2 with cloud platforms (old level assignment) | superseded |
| 2026-04-07 | `2026-04-07-l2-cloud-platforms-impl.md` | Implementation plan for cloud platforms | superseded |
| 2026-04-18 | `2026-04-18-dialogue-system-design.md` | Dialogue system with bitmap font atlas (`font.js`, `drawText`) | superseded |
| 2026-04-20 | `2026-04-20-dialogue-bubbles-illustrator.md` | Illustrator production plan for 8 dialogue bubble PNGs | partial |
| 2026-04-21 | `2026-04-21-project-cleanup.md` | Project cleanup master plan (9 phases) | executed (phases 0–8), phase 9 open |
| 2026-04-21 | `2026-04-21-phase3-asset-groups.md` | Sub-plan for phase 3 (characters/ + ui/) | executed |

## Current State

- **Cleanup branch:** `chore/project-cleanup-2026-04-21` — phases 0–8 committed.
- **Dialogue system source of truth:** `src/dialogue.js` + MEMORY.md section "Static bubble PNG approach".
- **L2 platform source of truth:** `src/platforms.js` `_L2_VARIANTS` + MEMORY.md section "L2 Shaft Platforms".
- **Deadline:** postponed (new date pending).

## Convention

New plans get the date in the filename (`YYYY-MM-DD-short-slug.md`) and are added to this table when created. Superseded plans get a superseded banner at the top and remain as history — they are not deleted.
