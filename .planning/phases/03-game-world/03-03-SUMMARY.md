---
phase: 03-game-world
plan: "03"
subsystem: ui

tags: [canvas, game-loop, state-machine, hud, screen-overlay]

requires:
  - phase: 03-01-game-state
    provides: "GamePhase.LEVEL_COMPLETE, startNextLevel(), saveHighScore(), GameState.level, GameState.highScore"
  - phase: 03-02-platforms
    provides: "GameState.levelGoalY set by generateLevelPlatforms()"

provides:
  - "Enter key in input.js with one-shot consumption in all phase transitions"
  - "Complete LEVEL_COMPLETE case in update() calling startNextLevel()"
  - "Score computed every PLAYING frame as Math.max(0, 528 - maxHeightReached)"
  - "saveHighScore() called before both LEVEL_COMPLETE and GAMEOVER transitions"
  - "Dashed yellow goal line drawn in world space at GameState.levelGoalY"
  - "Full renderHUD() covering all four phases with proper screen overlays"

affects:
  - phase-04-flood-lives
  - phase-05-throw-audio

tech-stack:
  added: []
  patterns:
    - "One-shot key consumption: keys.enter = false immediately after reading to prevent hold-through bug"
    - "Screen overlays drawn in renderHUD() (screen space, after ctx.restore) — world objects in render() (world space, inside ctx.save/restore)"
    - "ctx.textAlign always reset to 'left' after any centered overlay block"
    - "Goal line in world space: drawn inside ctx.save/restore so cameraY offset applies correctly"

key-files:
  created: []
  modified:
    - src/input.js
    - src/main.js

key-decisions:
  - "One-shot Enter key: keys.enter = false immediately after consuming (START, LEVEL_COMPLETE, GAMEOVER) prevents the screen-skip bug when Enter is held across a transition"
  - "Score computation moved from renderHUD into PLAYING update case so GameState.score is always current for all consumers"
  - "World objects (platforms, player, goal line) render during both PLAYING and LEVEL_COMPLETE — player remains visible behind the level-complete overlay"
  - "saveHighScore() called before transitioning to LEVEL_COMPLETE and GAMEOVER so score is persisted even on the same frame as the transition"

patterns-established:
  - "Phase transitions always consume the triggering key immediately (one-shot pattern) to prevent frame-bleed"
  - "HUD overlays always in renderHUD(), always after ctx.restore() — never in world space"

requirements-completed:
  - LOOP-07
  - LEVEL-01
  - LEVEL-02
  - SCRN-01
  - SCRN-02
  - SCRN-03

duration: 3min
completed: 2026-03-06
---

# Phase 3 Plan 03: Wiring Summary

**Enter key wired to all phase transitions with one-shot consumption, full screen overlays (START/LEVEL_COMPLETE/GAMEOVER) with score and high score, live HUD during PLAYING, and a dashed yellow goal line in world space.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-06T14:13:18Z
- **Completed:** 2026-03-06T14:16:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Enter key added to `input.js` with keydown/keyup tracking and one-shot consumption in all three consuming switch cases
- `update()` PLAYING case now computes score each frame, checks `levelGoalY` for level completion, and calls `saveHighScore()` before both `LEVEL_COMPLETE` and `GAMEOVER` transitions
- `renderHUD()` fully replaced: PLAYING shows live Score + Level in top-left; START, LEVEL_COMPLETE, and GAMEOVER each have a full semi-transparent overlay with titles, scores, high scores, and ENTER prompts
- Goal line drawn as a 3px dashed yellow horizontal at `GameState.levelGoalY` inside world space (`ctx.save/restore`) so it scrolls with the camera correctly
- `render()` extended to draw world objects during `LEVEL_COMPLETE` so platforms and player remain visible behind the overlay

## Task Commits

1. **Task 1: Add Enter Key to input.js and Update update() Switch Cases** - `69a6576` (feat)
2. **Task 2: Upgrade renderHUD — Score Display, Screen Overlays, Goal Line** - `41ea9e1` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/input.js` — Added `enter: false` to keys object; added `case 'Enter'` in keydown and keyup listeners
- `src/main.js` — Replaced START/GAMEOVER cases and added LEVEL_COMPLETE case in `update()`; added score computation and goal check in PLAYING case; extended `render()` for LEVEL_COMPLETE world objects and goal line draw; fully replaced `renderHUD()` with four-phase screen overlay system

## Decisions Made

- One-shot Enter key pattern: `keys.enter = false` immediately after reading in all three consuming cases (START, LEVEL_COMPLETE, GAMEOVER) prevents the hold-through bug where a held Enter on the start screen instantly skips through PLAYING into GAMEOVER.
- Score moved to `update()`: computing `GameState.score` in the PLAYING update case rather than inside `renderHUD()` means the value is always current for both display and transition logic on the same frame.
- World objects visible during LEVEL_COMPLETE: render() now draws platforms, player, and goal line during both PLAYING and LEVEL_COMPLETE so the level-complete overlay overlays the actual game world rather than a blank canvas.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 3 is now complete. All three plans are done:
- 03-01: GameState extended with level, highScore, levelGoalY; localStorage save/load
- 03-02: Procedural platform generation with crumbling state machine and levelGoalY
- 03-03: Wiring — Enter key, screen overlays, HUD, goal line, LEVEL_COMPLETE flow

Phase 4 (Flood + Lives) can start immediately. The `update()` PLAYING case has placeholder comments for `updateWater(dt)` and the fall-off-bottom check is flagged for replacement with `lives-- + respawn`.

## Self-Check: PASSED

- FOUND: src/input.js
- FOUND: src/main.js
- FOUND: .planning/phases/03-game-world/03-03-SUMMARY.md
- FOUND: commit 69a6576 (Task 1)
- FOUND: commit 41ea9e1 (Task 2)

---
*Phase: 03-game-world*
*Completed: 2026-03-06*
