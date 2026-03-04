# Cat Flood Jumper

## What This Is

A JavaScript browser-based vertical platformer with a level-based structure. The player controls a cat that automatically jumps upward across procedurally generated platforms, escaping a rising flood. Each level has a specific height goal — reaching it completes the level, shows a score screen, and advances to the next level. The cat can throw objects downward for interactions. Built as a school Abschlussprojekt submission — hosted online and accessible via a shared link.

## Core Value

A playable, complete gameplay loop: cat jumps up, water rises below, tension builds — the game feels real from first play.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Player-controlled cat character that auto-jumps on platform contact
- [ ] Each level has a defined height goal — reaching it completes the level
- [ ] Level-complete screen shows score summary before advancing to next level
- [ ] Procedurally generated platforms within each level's height range (not infinite)
- [ ] Rising water/flood level that chases the player from below within the level
- [ ] Lives / HP system — touching water deals damage, not instant death
- [ ] Throw mechanic — cat throws objects downward with a gameplay or visual effect
- [ ] Score system based on height reached per level
- [ ] Game over screen with score display and all-time high score
- [ ] Start screen / title screen
- [ ] Hosted and accessible via a shareable URL

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
- **Timeline**: 04.03.2026 – 22.04.2026 (school submission deadline)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Level-based vertical platformer | Clear progression structure; each level is a self-contained challenge with a height goal | — Pending |
| Rising water as chase mechanic | Adds urgency and uniqueness vs. pure height challenge | — Pending |
| Lives system over instant death | More forgiving; makes the throw mechanic feel more meaningful | — Pending |
| Vanilla JS + Canvas | Runs anywhere, no build tooling, easy to host as static files | — Pending |

---
*Last updated: 2026-03-04 — corrected endless/Doodle Jump framing to level-based structure*
