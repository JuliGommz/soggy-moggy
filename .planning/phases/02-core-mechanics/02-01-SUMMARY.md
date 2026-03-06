---
phase: 02-core-mechanics
plan: "01"
subsystem: physics
tags: [canvas, physics, gravity, platformer, one-way-collision, aabb]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: canvas setup, game loop, state machine, input system, player stub

provides:
  - Gravity constant (980 px/s²) and auto-bounce constant (JUMP_VELOCITY = -700 px/s)
  - player.prevY field for one-way collision detection
  - src/platforms.js with checkPlatformCollisions() four-condition AABB check
  - Starter platform at x=190, y=560, w=100 hardcoded for Phase 2
  - resetPlatforms() wired into resetGame()
  - renderPlatforms() wired into world-space render pass

affects: [02-02-core-mechanics, 03-game-world, 04-flood-lives]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semi-fixed timestep physics: vy += GRAVITY * dt, y += vy * dt (velocity-verlet style)"
    - "One-way AABB: four conditions checked simultaneously — overlapX + wasAbove + nowBelow + movingDown"
    - "prevY saved before physics update so collision can compare last-frame vs this-frame feet position"
    - "JUMP_VELOCITY global constant defined in player.js, read by platforms.js (load-order dependency)"

key-files:
  created:
    - src/platforms.js
  modified:
    - src/player.js
    - src/main.js
    - src/game-state.js
    - index.html

key-decisions:
  - "Auto-bounce on landing uses JUMP_VELOCITY constant from player.js — no key press needed (satisfies LOOP-01)"
  - "prevY saved at the TOP of updatePlayer before vy/y are mutated — collision compares last vs current feet"
  - "platforms.js loaded after player.js, before main.js — JUMP_VELOCITY and player are in scope at runtime"
  - "maxHeightReached sentinel set to 9999 in resetGame — first frame overwrites with real player.y"
  - "resetPlatforms() called at runtime from resetGame() — safe despite game-state.js loading before platforms.js"

patterns-established:
  - "Physics constants (GRAVITY, JUMP_VELOCITY) live in player.js as globals — accessible to platforms.js"
  - "renderPlatforms before renderPlayer — ensures player rectangle always renders on top of platforms"
  - "Math.floor on render positions — avoids sub-pixel rendering artifacts on Canvas 2D"

requirements-completed: [LOOP-01, LOOP-02]

# Metrics
duration: 15min
completed: 2026-03-06
---

# Phase 2 Plan 01: Physics + Platform Collision Summary

**Gravity (980 px/s²), one-way AABB collision with four-condition check, and auto-bounce (-700 px/s) on a hardcoded starter platform — player falls and bounces continuously without key input.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-06T08:52:00Z
- **Completed:** 2026-03-06T09:08:00Z
- **Tasks:** 4
- **Files modified:** 5 (4 modified + 1 created)

## Accomplishments

- GRAVITY and JUMP_VELOCITY constants added to player.js; player falls under gravity and auto-bounces on landing
- One-way collision in checkPlatformCollisions() uses all four conditions: overlapX, wasAbove, nowBelow, movingDown — passing through from below works correctly
- Starter platform at y=560 (green rectangle) rendered in world space before player, wired into game loop and reset
- Phase 1 cleanup: dt debug console.log removed from main.js

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade player.js with vertical physics** - `ef9ebc2` (feat)
2. **Task 2: Create platforms.js** - `58fc219` (feat)
3. **Task 3: Wire platforms into game loop and reset** - `2b85915` (feat)
4. **Task 4: Add platforms.js to index.html** - `5a446a3` (feat)

## Files Created/Modified

- `src/player.js` - Added GRAVITY, JUMP_VELOCITY constants; prevY field; vertical physics in updatePlayer
- `src/platforms.js` - New file: platform array, four-condition one-way AABB, auto-bounce, reset, render
- `src/main.js` - Added updatePlatforms/checkPlatformCollisions to PLAYING case; renderPlatforms before renderPlayer; removed dt debug log
- `src/game-state.js` - resetGame() now calls resetPlatforms(); maxHeightReached initialized to 9999 sentinel
- `index.html` - platforms.js script tag inserted between player.js and main.js

## Decisions Made

- JUMP_VELOCITY defined in player.js (not platforms.js) so it is available as a global when platforms.js executes — load order dependency documented in both files
- prevY is saved at the very start of updatePlayer before any vy/y mutation so the last-frame feet position is accurate for one-way collision
- maxHeightReached initialized to 9999 as a sentinel value — the first real frame will overwrite it with the player's actual y coordinate
- resetPlatforms() is called inside resetGame() at runtime, not at definition time, so the call-time load order (all scripts present) is safe

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Player falls under gravity and bounces off the starter platform continuously
- One-way collision verified: wasAbove + nowBelow + overlapX + movingDown all required simultaneously
- Plan 02-02 can now add: updateCamera() scroll, fall-off-bottom detection, and cameraY integration
- No blockers

---
*Phase: 02-core-mechanics*
*Completed: 2026-03-06*
