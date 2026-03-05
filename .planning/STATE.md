# State: Cat Flood Jumper

**Last updated:** 2026-03-05
**Updated by:** 01-02-PLAN.md execution

---

## Project Reference

**Core Value:** A playable, complete gameplay loop: cat jumps up, water rises below, tension builds — the game feels real from first play.

**Current Focus:** Phase 1 — Foundation

**Stack:** Vanilla JavaScript ES2022+ + HTML Canvas 2D (480x640) + Web Audio API + GitHub Pages

---

## Current Position

**Active Phase:** 2 — Core Mechanics
**Active Plan:** 01 (Phase 1 complete)
**Phase Status:** Phase 1 complete — Phase 2 not started

```
Progress: [x][ ][ ][ ][ ][ ]  1/6 phases complete
           P1  P2  P3  P4  P5  P6
```

---

## Phase Status

| Phase | Name | Status | Plans Done |
|-------|------|--------|------------|
| 1 | Foundation | Complete | 2/2 |
| 2 | Core Mechanics | Not started | 0/? |
| 3 | Game World | Not started | 0/? |
| 4 | Flood + Lives | Not started | 0/? |
| 5 | Throw + Audio | Not started | 0/? |
| 6 | Hosting | Not started | 0/? |

---

## Performance Metrics

- Requirements defined: 30
- Requirements mapped: 30 (100%)
- Phases complete: 1/6
- Plans complete: 2/?
- v1 features shipped: 0/30

| Phase | Plan | Duration (s) | Tasks | Files |
|-------|------|-------------|-------|-------|
| 01 | 01 | 99 | 3 | 3 |
| 01 | 02 | 110 | 2 | 3 |

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
| Working title: Soggy Moggy | Renamed from "Cat Flood Jumper" | — |
| Player = Stuffed Cat | Not a real/live cat — specific visual character with floppy limbs, button eyes, stitched seams | Phase 04.1 |
| Placeholders until sprites | Colored rectangles used through Phase 4; real sprites produced after Phase 04.1 | Phase 1–4 |
| canvas sized via JS attributes only | canvas.width = 480; canvas.height = 640 — never CSS; avoids blur at non-1:1 DPR | Phase 1 |
| lastTime = performance.now() before first rAF | Prevents dt spike on frame 1 — initialized outside gameLoop callback | Phase 1 |
| HUD drawn after ctx.restore() — permanent pattern | HUD must always be in screen coordinates; established now so Phase 2 camera doesn't break it | Phase 1 |
| ctx.getContext('2d', { alpha: false }) | Opaque canvas allows fillRect clear without compositing overhead | Phase 1 |
| Math.floor on render positions | Prevents sub-pixel blur in fillRect; applied in renderPlayer | Phase 1 |
| MVP-first approach | Core loop must work before polish; clear MVP boundary established | All phases |
| Visual Concept phase (04.1) | Expert-agent-driven art direction before Phase 5 sprite work; placed after MVP is proven | Phase 04.1 |
| Prompting strategy documentation | Two-stage system: auto-maintained log throughout + analysis at project end | All phases |
| Classic script tags (no ES6 modules) | Works on file:// without dev server; matches school example pattern (jumprun, scripteroids) | Phase 1 |
| GamePhase as Object.freeze | Prevents accidental mutation of phase string constants | Phase 1 |
| keys.shoot included in Phase 1 | Avoids retrofitting input.js when Phase 5 throw mechanic is implemented | Phase 1 |
| e.code over e.key/e.keyCode | Layout-independent (QWERTY/QWERTZ/AZERTY); e.keyCode is deprecated | Phase 1 |

### Roadmap Evolution

- Phase 04.1 "Visual Concept" inserted after Phase 4: art style, color palette, mood, contrast rules, asset list — produced by expert agents before sprite implementation in Phase 5

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
**Last session:** 2026-03-05 — Completed 01-02-PLAN.md (game loop, player stub, canvas init, render pass). Phase 1 Foundation complete.
**Next action:** Execute Phase 2 — /gsd:plan-phase 2 then /gsd:execute-phase 2

---
*State initialized: 2026-03-03 after roadmap creation*
*Updated: 2026-03-05 after 01-01-PLAN.md execution*
