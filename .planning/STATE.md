# State: Cat Flood Jumper

**Last updated:** 2026-03-03
**Updated by:** roadmap creation

---

## Project Reference

**Core Value:** A playable, complete gameplay loop: cat jumps up, water rises below, tension builds — the game feels real from first play.

**Current Focus:** Phase 1 — Foundation

**Stack:** Vanilla JavaScript ES2022+ + HTML Canvas 2D (480x640) + Web Audio API + GitHub Pages

---

## Current Position

**Active Phase:** 1 — Foundation
**Active Plan:** None (not yet started)
**Phase Status:** Not started

```
Progress: [ ][ ][ ][ ][ ][ ]  0/6 phases complete
           P1  P2  P3  P4  P5  P6
```

---

## Phase Status

| Phase | Name | Status | Plans Done |
|-------|------|--------|------------|
| 1 | Foundation | Not started | 0/? |
| 2 | Core Mechanics | Not started | 0/? |
| 3 | Game World | Not started | 0/? |
| 4 | Flood + Lives | Not started | 0/? |
| 5 | Throw + Audio | Not started | 0/? |
| 6 | Hosting | Not started | 0/? |

---

## Performance Metrics

- Requirements defined: 30
- Requirements mapped: 30 (100%)
- Phases complete: 0/6
- Plans complete: 0/?
- v1 features shipped: 0/30

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Vanilla JS + HTML Canvas only | No framework — runs anywhere, matches school constraint, demonstrates Canvas fundamentals | — |
| 480x640 canvas (portrait) | Matches Doodle Jump proportions; set via JS attributes, never CSS | Phase 1 |
| Semi-fixed timestep with 50 ms delta cap | Prevents physics explosion on tab switch or 120 Hz monitor | Phase 1 |
| State machine first (`start` / `playing` / `gameover`) | Restart without page reload; gates all loop logic; hardest to retrofit | Phase 1 |
| One-way AABB collision | Three-condition check: horizontal overlap + was above + moving downward | Phase 2 |
| World coordinates for all entities | Camera transform (`ctx.translate`) applied once in render; HUD drawn after `ctx.restore()` | Phase 2 |
| Throw effect on water: TBD | Decide after water mechanic is working in Phase 4; playtesting informs the design | Phase 5 |
| Lives system over instant death | More forgiving; makes the throw mechanic feel more meaningful | Phase 4 |

### Critical Pitfalls (from research)

1. **Canvas sized via CSS** — always use `canvas.width = 480; canvas.height = 640` via JS or HTML attributes
2. **No delta time** — all velocities must be multiplied by `dt / 1000`; address in Phase 1 or retrofit touches everything
3. **Broken one-way collision** — three simultaneous conditions required; implement and test before procedural generation
4. **Coordinate mismatch** — all entities in world space; one `ctx.translate(0, -cameraY)` in render pass only
5. **No state machine** — define `GameState.phase` before any game logic; write `resetGame()` before Phase 3

### Open Design Questions

| Question | When to Decide |
|----------|----------------|
| What does the throw do to the water? (freeze / slow / visual only) | After water mechanic works in Phase 4 |
| Water rise speed curve shape (linear / exponential / step-function) | During Phase 4; calibrate via playtesting |
| Throw cooldown duration | Phase 5 default recommendation: 1-2 seconds |
| Does the project need a pause key? | Phase 5 only if time permits |
| Max jump height in pixels (needed for gap constraint formula) | Measure in Phase 2 before Phase 3 starts |

### Todos

- [ ] Measure actual max jump height (pixels) after Phase 2 physics are implemented — required for PLAT-03 gap constraint
- [ ] Decide throw mechanic water interaction after Phase 4 playtesting
- [ ] Confirm GitHub Pages is enabled on the repository before Phase 6

### Blockers

None.

---

## Session Continuity

**To resume after a break:**
1. Read this file and ROADMAP.md to confirm current phase and status
2. Check which phase is active and what plans are complete
3. Read the active plan file in `.planning/phases/` if it exists
4. Continue from the last incomplete plan step

**Repository:** `C:/Users/Teilnehmer/Desktop/Schule/PRG/Abschlussprojekt_SRH_26`
**Planning files:** `.planning/`
**Next action:** Run `/gsd:plan-phase 1` to plan Phase 1 Foundation

---
*State initialized: 2026-03-03 after roadmap creation*
