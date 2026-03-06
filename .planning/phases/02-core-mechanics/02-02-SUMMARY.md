---
phase: 02-core-mechanics
plan: "02"
subsystem: camera-scroll
tags: [camera, scroll, fall-detection, hud, height-tracking, gameover]
dependency_graph:
  requires:
    - phase: 02-01
      provides: player physics, one-way AABB collision, platforms, GameState.maxHeightReached
    - phase: 01-02
      provides: ctx.translate(0, -GameState.cameraY) in render(), GameState.cameraY = 0
  provides:
    - updateCamera() — peak-tracking one-way camera scroll
    - fall-off-bottom detection → GAMEOVER (stub for Phase 4 lives system)
    - Height debug HUD display during PLAYING phase
  affects: [03-game-world, 04-flood-lives, all phases using cameraY]
tech_stack:
  added: []
  patterns:
    - one-way camera gate: if (newCameraY < GameState.cameraY) — cameraY can only decrease
    - maxHeightReached as minimum world Y — lower Y = higher in world
    - fall detection: player.y > cameraY + canvas.height after updateCamera call
    - height formula: Math.max(0, 528 - maxHeightReached) — pixels above start position
key_files:
  created: []
  modified:
    - src/main.js
key_decisions:
  - "updateCamera() called after checkPlatformCollisions() — uses final frame Y position, not mid-flight intermediate"
  - "Fall detection placed after updateCamera() — threshold uses current (updated) camera position for the frame"
  - "cameraY only decreases — prevents camera scrolling back down when player falls"
  - "maxHeightReached stores minimum world Y (not max) — lower Y is higher in canvas coordinate system"
  - "Height HUD formula: 528 - maxHeightReached — 528 is player start world Y; result is pixels climbed"
requirements:
  - LOOP-04
  - LOOP-05
metrics:
  duration_seconds: 76
  completed_date: "2026-03-06"
  tasks_completed: 3
  files_created: 0
  files_modified: 1
---

# Phase 2 Plan 02: Camera Scroll + Fall Detection Summary

**Peak-tracking one-way camera scroll that follows the cat upward and never scrolls back, fall-off-bottom GAMEOVER detection, and height debug counter in the HUD — all wired into the existing render pass via a single `GameState.cameraY` write.**

---

## Performance

- **Duration:** ~1 min 16 sec
- **Started:** 2026-03-06T09:11:23Z
- **Completed:** 2026-03-06T09:12:39Z
- **Tasks:** 3
- **Files modified:** 1 (src/main.js)

---

## Accomplishments

- `updateCamera()` added: computes `newCameraY = player.y - SCROLL_THRESHOLD` (SCROLL_THRESHOLD = 256px = canvas.height * 0.4); only writes to `GameState.cameraY` if `newCameraY < GameState.cameraY` — the one-way gate that prevents scroll-back when the player falls
- `maxHeightReached` tracking: stores the minimum world Y the player has reached each frame; lower Y = higher in the game world (canvas Y-axis points downward)
- `updateCamera()` wired into `update()` PLAYING case after `checkPlatformCollisions()` — uses the player's final per-frame Y position
- Fall-off-bottom detection wired after `updateCamera()`: `if (player.y > GameState.cameraY + canvas.height)` triggers `GameState.phase = GamePhase.GAMEOVER`; Phase 4 will replace this with `lives--` and respawn
- Height debug display added to `renderHUD()` during PLAYING phase: `Math.max(0, 528 - GameState.maxHeightReached)` shows pixels climbed above the start position; counter only increases, never decreases

---

## Task Commits

Each task committed atomically:

1. **Task 1: Add `updateCamera()` to src/main.js** — `93b2f01` (feat)
2. **Task 2: Wire camera update and fall-off-bottom detection** — `aab6549` (feat)
3. **Task 3: Add height debug display to HUD** — `3445bd5` (feat)

**Plan metadata:** (docs commit — see below)

---

## Files Created/Modified

- `src/main.js` — Added `updateCamera()` function (16 lines); wired call + fall detection into PLAYING case (13 lines replacing 3); updated `renderHUD()` with height display block (8 lines added)

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `if (newCameraY < GameState.cameraY)` as the one-way gate | CameraY is the world Y at the top of the screen. It should only decrease (scroll up). When player falls, newCameraY increases — the condition fails automatically, camera holds position |
| `updateCamera()` after `checkPlatformCollisions()` | Ensures camera update uses the player's resolved Y for the frame (post-bounce, post-landing) rather than a pre-collision intermediate value |
| Fall detection after `updateCamera()` | The fall check compares `player.y` against `cameraY + canvas.height`. If camera were not yet updated, the threshold would be stale by one frame |
| Height = `528 - maxHeightReached` not `player.y` | Height should reflect the peak ever reached, not the current Y. maxHeightReached stores the minimum world Y seen, so subtraction from start Y (528) gives pixels climbed |
| `Math.max(0, ...)` clamp on height | Player starts at y=528. Before any movement, 528 - 9999 = -9471 — the clamp prevents a negative display on game start (maxHeightReached initializes to 9999 in resetGame) |

---

## Deviations from Plan

None — plan executed exactly as written.

All three tasks match the plan spec verbatim. Static verification (4 automated checks) passed all criteria.

---

## Verification Results

All success criteria confirmed via static analysis:

| Criterion | Status |
|-----------|--------|
| `updateCamera()` function exists in main.js | PASS |
| `updateCamera()` uses `canvas.height * 0.4` for scroll threshold | PASS |
| Camera gate: `if (newCameraY < GameState.cameraY)` | PASS |
| maxHeightReached: `if (player.y < GameState.maxHeightReached)` | PASS |
| `updateCamera()` called in PLAYING case after `checkPlatformCollisions()` | PASS |
| Fall detection: `player.y > GameState.cameraY + canvas.height` | PASS |
| Fall detection after `updateCamera()` call | PASS |
| Fall detection sets `GameState.phase = GamePhase.GAMEOVER` | PASS |
| `renderHUD()` shows `Height: X px` during PLAYING phase | PASS |
| Height formula: `Math.max(0, 528 - GameState.maxHeightReached)` | PASS |
| START screen text preserved | PASS |
| GAMEOVER screen text preserved | PASS |

---

## Phase 2 Completion Status

Both Phase 2 plans are now complete. The full set of Phase 2 success criteria can be verified in a browser:

| # | Criterion |
|---|-----------|
| 1 | Cat auto-bounces every time it lands on a platform — no jump key required |
| 2 | Cat moves left/right smoothly via arrow keys or A/D |
| 3 | Cat passes through platform from below without collision triggering |
| 4 | Camera scrolls upward as cat climbs; never scrolls back down when cat falls |
| 5 | Cat falling below the bottom edge of the visible canvas triggers GAMEOVER |

---

## Issues Encountered

None.

---

## User Setup Required

None — open `index.html` directly in a browser (file:// or Live Server).

DevTools test for GAMEOVER: open console, type `GameState.cameraY = -500` — the player (at world y≈528) is now below the visible area (visible bottom = -500+640 = 140), so GAMEOVER fires immediately.

---

## What Phase 3 Inherits

Phase 3 (Game World) can rely on:
- `GameState.cameraY` — correctly tracks the world Y at the top of the visible screen; updated each frame
- `GameState.maxHeightReached` — stores the minimum world Y reached by the player (initialized 9999 in resetGame)
- `updateCamera()` — wired and tested; Phase 3 only needs to ensure new platforms are generated ahead of the scroll
- Fall detection is live — Phase 3's procedural platforms must generate far enough above cameraY to keep the player alive
- Height display in HUD — Phase 3 will replace the raw `px` counter with score formatting

---

## Self-Check

**Files exist:**
- FOUND: src/main.js

**Commits exist:**
- 93b2f01 — feat(02-02): add updateCamera() — follows player peak, never scrolls back
- aab6549 — feat(02-02): wire camera update and fall-off-bottom detection
- 3445bd5 — feat(02-02): add height debug display to HUD

## Self-Check: PASSED
