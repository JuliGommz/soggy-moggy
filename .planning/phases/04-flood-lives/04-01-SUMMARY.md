---
phase: 04-flood-lives
plan: "01"
subsystem: water

tags: [canvas, physics, collision, animation, flood, lives]

requires:
  - phase: 01-01-foundation
    provides: "GamePhase constants, GameState object, canvas game loop pattern"
  - phase: 03-01-game-state
    provides: "GamePhase.GAMEOVER, GameState.lives, GameState.score, saveHighScore()"
  - phase: 02-01-core-mechanics
    provides: "player object (player.y, player.h) for collision check"

provides:
  - "water object with waterY, floodSpeed, waveTime, iframeTimer, flashTimer"
  - "resetWater(level): reset all water state, scale flood speed per level"
  - "takeDamage(): decrement lives, set iframe + flash timers, trigger GAMEOVER"
  - "updateWater(dt): rise water, accelerate flood, animate wave, check player collision with iframe guard"
  - "renderWater(ctx): sine-wave polygon fill in world space"
  - "8 tune-friendly constants for flood speed, wave shape, and damage timers"

affects:
  - phase-04-02-wiring
  - phase-05-throw-audio

tech-stack:
  added: []
  patterns:
    - "Invincibility frame guard: collision check only fires when iframeTimer <= 0"
    - "Flash timer separate from iframe timer — visual feedback can expire sooner than invincibility"
    - "Water polygon uses far sentinel (waterY + 2000) to fill body below the sine wave"
    - "floodSpeed scales per level via FLOOD_LEVEL_SCALE so later levels are harder from the start"

key-files:
  created:
    - src/water.js
  modified:
    - index.html

key-decisions:
  - "takeDamage() does not check iframeTimer — the caller (updateWater) owns the guard; separation of concerns"
  - "Water collision uses waterY - WAVE_AMPLITUDE as collision surface so player hits the wave crest, not the mean line"
  - "resetWater() receives level parameter and scales floodSpeed accordingly for per-level difficulty ramp"
  - "renderWater() note added: must be called before ctx.restore() to stay in world space"

requirements-completed:
  - FLOOD-01
  - FLOOD-02
  - FLOOD-03
  - FLOOD-04
  - LIFE-02
  - LIFE-03

duration: 76s
completed: 2026-03-06
---

# Phase 4 Plan 01: Water Module Summary

**Rising flood water module in world space with sine-wave animation, per-level speed scaling, invincibility frames, flash feedback, and GAMEOVER trigger on zero lives.**

## Performance

- **Duration:** ~76 s
- **Started:** 2026-03-06T12:01:03Z
- **Completed:** 2026-03-06T12:02:19Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `src/water.js` created from scratch with 6 ordered sections: 8 constants, water object, `resetWater(level)`, `takeDamage()`, `updateWater(dt)`, `renderWater(ctx)`
- `resetWater(level)` resets all state and scales `floodSpeed` to `FLOOD_BASE_SPEED * (1 + (level - 1) * FLOOD_LEVEL_SCALE)` for a natural difficulty ramp across levels
- `updateWater(dt)` ticks both timers, rises the water surface, accelerates flood speed each frame, advances wave animation, and checks player bottom against `waterY - WAVE_AMPLITUDE` with an iframe guard
- `takeDamage()` decrements `GameState.lives`, sets `iframeTimer` and `flashTimer`, and on `lives <= 0` calls `saveHighScore()` then sets `GameState.phase = GamePhase.GAMEOVER`
- `renderWater(ctx)` draws a filled polygon: sine-wave crest via 480 `lineTo` calls, closed by a sentinel at `waterY + 2000` to fill the flood body
- `index.html` updated with `<script src="src/water.js">` between `platforms.js` and `main.js`; load order is now `game-state.js → input.js → player.js → platforms.js → water.js → main.js`

## Task Commits

1. **Task 1: Create src/water.js — water module** - `226a69d` (feat)
2. **Task 2: Add water.js script tag to index.html** - `fd13815` (feat)

## Files Created/Modified

- `src/water.js` — New file. All 6 sections: constants, water object, resetWater, takeDamage, updateWater, renderWater. No import/export — global scope, consistent with project pattern.
- `index.html` — Added one `<script src="src/water.js">` tag and accompanying comment. No other changes.

## Decisions Made

- Iframe guard belongs in `updateWater()`, not `takeDamage()`: the collision detection code owns the guard, keeping `takeDamage()` a pure "apply damage" function that never needs to know the caller's context.
- Wave collision surface is `waterY - WAVE_AMPLITUDE` (the crest), not `waterY` (the mean line): this means the player gets hit at the visible highest point of the wave, which matches what the eye sees.
- `floodSpeed` is scaled in `resetWater()` rather than computed at runtime each frame, so the scaling cost is paid once per level start, not 60 times per second.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

The plan's automated verification script for Task 2 used `html.indexOf('main.js')` which matched the first occurrence inside a CSS comment (`see src/main.js`), returning a lower index than the script tags. The actual file structure is correct; the verification was confirmed using `src/main.js` (prefixed) with `lastIndexOf` to avoid the false match.

## User Setup Required

None.

## Next Phase Readiness

Plan 04-01 is complete. `src/water.js` is in place and `index.html` loads it before `main.js`. The module exposes `water`, `resetWater`, `takeDamage`, `updateWater`, and `renderWater` as globals.

Plan 04-02 (wiring) will connect these calls into `main.js`: call `resetWater(GameState.level)` in `resetGame()` and `startNextLevel()`, call `updateWater(dt)` in the PLAYING update case, call `renderWater(ctx)` inside the world-space `ctx.save/restore` block, and draw the red flash overlay in `renderHUD()` when `water.flashTimer > 0`.

## Self-Check: PASSED

- FOUND: src/water.js
- FOUND: index.html (water.js tag between platforms.js and main.js)
- FOUND: commit 226a69d (Task 1)
- FOUND: commit fd13815 (Task 2)

---
*Phase: 04-flood-lives*
*Completed: 2026-03-06*
