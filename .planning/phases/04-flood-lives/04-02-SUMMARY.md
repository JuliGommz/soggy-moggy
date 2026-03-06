---
phase: 04-flood-lives
plan: "02"
subsystem: wiring

tags: [canvas, flood, lives, hud, wiring, animation]

requires:
  - phase: 04-01-water-module
    provides: "water object, resetWater, takeDamage, updateWater, renderWater — all global scope"
  - phase: 03-01-game-state
    provides: "GamePhase constants, GameState.lives, GameState.level, GameState.cameraY"
  - phase: 02-01-core-mechanics
    provides: "player object, JUMP_VELOCITY constant"

provides:
  - "Rising animated flood visible from start of every new run"
  - "Damage flash overlay: red screen tint proportional to water.flashTimer"
  - "Three heart HUD icons in top-right: red = full, grey = empty"
  - "Fall-off-bottom costs one life and respawns at camera top instead of instant GAMEOVER"
  - "Per-level flood speed reset: level 1 on restart, escalated on startNextLevel()"

affects:
  - phase-04-visual-concept
  - phase-05-throw-audio

tech-stack:
  added: []
  patterns:
    - "Flash overlay uses inline rgba() string — never ctx.globalAlpha — to prevent state leak onto HUD text"
    - "Fall-off-bottom guarded by water.iframeTimer <= 0 — same iframe window as water collision"
    - "ctx.textAlign always reset to 'left' after right-aligned heart rendering"
    - "renderWater() placed outside the existing PLAYING/LEVEL_COMPLETE if-block to form its own identical guard"

key-files:
  created: []
  modified:
    - src/main.js
    - src/game-state.js

key-decisions:
  - "renderWater() has its own PLAYING/LEVEL_COMPLETE guard rather than nesting inside the existing block — keeps structure flat and symmetrical with how renderPlatforms/renderPlayer are guarded"
  - "Fall-off-bottom respawns at cameraY+60 with JUMP_VELOCITY auto-bounce — player immediately jumps, consistent with platform landing feel"
  - "Flash overlay drawn before PLAYING text block in renderHUD() so HUD score/hearts always render on top of the flash"
  - "resetWater(1) in resetGame() and resetWater(GameState.level) in startNextLevel() — water always starts fresh each run/level"

requirements-completed:
  - FLOOD-01
  - FLOOD-02
  - FLOOD-03
  - FLOOD-04
  - LIFE-01
  - LIFE-02
  - LIFE-03
  - LEVEL-04

duration: 118
completed: 2026-03-06
---

# Phase 4 Plan 02: Wiring Summary

**Four surgical edits to main.js and two to game-state.js connect the water module to the running game — rising flood, heart HUD, damage flash, fall respawn, and per-level flood reset all live.**

## Performance

- **Duration:** ~118 s
- **Started:** 2026-03-06T12:04:51Z
- **Completed:** 2026-03-06T12:06:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `src/main.js` EDIT 1: fall-off-bottom stub replaced — falling now calls `takeDamage()` (guarded by `water.iframeTimer <= 0`) then respawns player at `cameraY + 60` with `JUMP_VELOCITY` auto-bounce
- `src/main.js` EDIT 2: `updateWater(dt)` call added after fall check in the PLAYING update case
- `src/main.js` EDIT 3: `renderWater(ctx)` call added inside the world-space `ctx.save/restore` block, guarded by `PLAYING || LEVEL_COMPLETE`, placed after goal line rendering and before `ctx.restore()`
- `src/main.js` EDIT 4: damage flash overlay added to `renderHUD()` using `rgba(220, 30, 30, alpha)` with alpha proportional to `water.flashTimer / FLASH_DURATION`; three-heart loop added to PLAYING block using `\u2665` with `ctx.textAlign = 'right'`, reset to `'left'` afterward
- `src/game-state.js` EDIT 1: `resetWater(1)` added as last call in `resetGame()` — level 1 flood speed on full restart
- `src/game-state.js` EDIT 2: `resetWater(GameState.level)` added as last call in `startNextLevel()` — escalated flood speed per level

## Task Commits

1. **Task 1: Wire water into main.js (update, render, fall stub, HUD)** - `cc35324` (feat)
2. **Task 2: Wire resetWater into game-state.js** - `756e9a8` (feat)

## Files Created/Modified

- `src/main.js` — Modified. Four targeted edits: fall stub replaced, updateWater call added, renderWater call added, flash overlay and hearts added to renderHUD(). No structural changes to existing code.
- `src/game-state.js` — Modified. Two lines added at end of resetGame() and startNextLevel(). No other changes.

## Decisions Made

- Flash overlay uses inline `rgba()` string concatenation rather than `ctx.globalAlpha` — this avoids a globalAlpha state leak that would make all subsequent HUD text (score, level, hearts) semi-transparent (see Phase 4 research pitfall 5).
- The `renderWater()` call gets its own `if (PLAYING || LEVEL_COMPLETE)` guard outside the existing platforms/player block rather than being nested inside it — the result is identical behavior but the structure is flat and easier to read.
- Fall-off-bottom respawn at `cameraY + 60` with `JUMP_VELOCITY` gives the player an immediate upward bounce on respawn, consistent with the feel of landing on a platform.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None. Open `index.html` in a browser to verify: wave rises and animates, three hearts appear top-right, damage causes red flash and removes one heart, three hits triggers GAME OVER, fall respawns rather than ending the game, Level 2 resets the flood position.

## Next Phase Readiness

Phase 4 is complete. All eight Phase 4 requirements are wired and observable in the running game. The next step is Phase 04.1 (Visual Concept — art direction before sprite work) or Phase 5 (Throw + Audio).

## Self-Check: PASSED

- FOUND: src/main.js contains updateWater(dt), renderWater(ctx), takeDamage(), water.flashTimer, u2665, FLASH_DURATION, cameraY + 60
- FOUND: src/game-state.js contains resetWater(1), resetWater(GameState.level)
- FOUND: commit cc35324 (Task 1)
- FOUND: commit 756e9a8 (Task 2)

---
*Phase: 04-flood-lives*
*Completed: 2026-03-06*
