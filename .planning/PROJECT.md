# Soggy Moggy

> **Language policy (2026-04-21):** All in-game content, code identifiers, comments, and documentation use English only. The sole official title is **Soggy Moggy** — the previous Spanish in-game title "Gato Sin Botas" is retired. German level names (Stadt, Aufzugschacht, Offener See, Freizeitpark) are also migrating to English. Translation of all remaining non-English text is handled in the next phase by a dedicated translator agent. Exception: German prose in formal SRH school submission documents (`Dokumente_Schule/Completed/`) stays German because SRH requires it.

## What This Is

A JavaScript browser-based vertical platformer with a level-based structure. The player controls a stuffed cat that manually jumps across platforms (Space or left-click), escaping a rising hazard from below. Each level has a specific height goal — reaching it completes the level, shows a score screen, and advances to the next level. The cat can push objects on platforms for gameplay effects. Built as a school Abschlussprojekt submission — hosted online and accessible via a shared link.

## Core Value

A playable, complete gameplay loop: cat jumps up on manual input, hazard rises below, tension builds — the game feels real from first play.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [x] Player-controlled stuffed cat that jumps on manual input (Space/left-click, onGround gate)
- [x] Each level has a defined height goal — reaching it completes the level
- [x] Level-complete screen shows score summary before advancing to next level
- [x] Procedurally generated platforms within each level's height range (not infinite)
- [x] Rising hazard (L1 smog / L2 electricity / L3 water) chases the player from below within the level
- [x] Lives / HP system — touching hazard deals damage, not instant death
- [ ] Push mechanic — cat pushes objects on platforms for gameplay effects (Phase 5, offen)
- [x] Score system based on height reached per level
- [x] Game over screen with score display and all-time high score
- [x] Start screen / title screen
- [ ] Hosted and accessible via a shareable URL (Phase 7, offen)

### Out of Scope

- Multiplayer — complexity not justified for school submission scope
- Mobile touch controls — target is desktop browser for submission
- Level editor — too large for v1 prototype
- Online leaderboard / persistent high scores — requires backend, out of scope
- Detailed story or cutscenes — functional prototype, not narrative game

## Context

- School: SRH — Game & Multimedia Design program
- Submission type: Abschlussprojekt (final project)
- Grading criteria: Loose / open — "build a game" with no strict checklist
- Target: Functional prototype that demonstrates the gameplay loop
- Delivery: Hosted URL (e.g. GitHub Pages or similar static host)
- Engine: Pure JavaScript + HTML Canvas (no heavy framework dependency)
- The throw mechanic's exact interaction effect is still undefined — leave room for experimentation during development

## Constraints

- **Tech Stack**: Vanilla JavaScript + HTML Canvas — no Unity, no framework — runs in any modern browser without install
- **Delivery**: Must be hostable as a static site (no server-side runtime)
- **Scope**: Functional prototype — polish is secondary to a complete loop
- **Timeline**: 04.03.2026 – 22.04.2026 (school submission deadline, um wenige Tage nach 22.04 verlängert wegen Scope-Ausweitung Audio + Hosting + Cleanup)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Level-based vertical platformer | Clear progression structure; each level is a self-contained challenge with a height goal | — Pending |
| Rising water as chase mechanic | Adds urgency and uniqueness vs. pure height challenge | — Pending |
| Lives system over instant death | More forgiving; makes the throw mechanic feel more meaningful | — Pending |
| Vanilla JS + Canvas | Runs anywhere, no build tooling, easy to host as static files | — Pending |

---
*Last updated: 2026-04-21 — Active-Checklist gegen reale Code-Stände abgeglichen (9 von 11 Items complete); Timeline-Verlängerung vermerkt.*
