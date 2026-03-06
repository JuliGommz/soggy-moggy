# Phase 2: Core Mechanics — Research

**Researched:** 2026-03-05
**Domain:** Vanilla JS Canvas — gravity physics, one-way platform collision, camera scroll, fall detection
**Confidence:** HIGH
**Builds on:** Phase 1 research (game loop, delta time, state machine — already implemented)

---

## Summary

Phase 2 activates the player physics and produces the first moment of gameplay feel: cat falls, bounces on a platform, soars upward, camera follows. Four distinct systems work together: gravity (constant downward acceleration), one-way AABB collision (land from above; pass through from below), camera scroll (follows player's peak, never scrolls back), and fall-off-bottom detection (triggers GAMEOVER).

All four systems were addressed in the prior research (`ARCHITECTURE.md`, `PITFALLS.md`). This document synthesizes the Phase 2-specific findings with exact constants calibrated to the 480×640 canvas.

**Critical constraint:** The one-way collision is the single most error-prone piece. It must use all four simultaneous conditions — and must be implemented and verified before any procedural generation is added in Phase 3.

---

## Physics Constants (Calibrated for 480×640 Canvas)

| Constant | Value | Unit | Rationale |
|----------|-------|------|-----------|
| `GRAVITY` | `980` | px/s² | Earth-scale gravity in pixel space; produces natural-feeling arcs |
| `JUMP_VELOCITY` | `-700` | px/s | Negative = upward in Canvas (Y increases downward) |
| `PLAYER_SPEED` | `300` | px/s | Already in player.js from Phase 1 |

**Jump arc math:**
- Peak height: `v₀² / (2g) = 700² / (2 × 980) = 250 px` — player rises ~250px per bounce
- Time to peak: `v₀ / g = 700 / 980 ≈ 0.71 s`
- Full arc duration: `≈ 1.43 s`
- On a 640px canvas, a 250px jump covers ~39% of height — correct for a vertical platformer

**Platform gap safety (for Phase 3 reference):** Maximum reachable vertical gap ≈ 250px. Use 85% safety margin → max gap ≈ 212px for procedural generation.

---

## System 1: Vertical Physics

**Pattern:** Accumulate gravity into `vy` each frame; apply `vy * dt` to `y`. Store `prevY` before updating so collision can check "was the player above last frame?"

```javascript
// In updatePlayer(dt) — add before horizontal movement:
player.prevY  = player.y;                 // save BEFORE physics update
player.vy    += GRAVITY * dt;             // accumulate gravity
player.y     += player.vy * dt;           // apply vertical displacement
```

**Why prevY matters:** The one-way collision needs to know whether the player's feet were above the platform top on the PREVIOUS frame. Without prevY, a fast-falling player could pass entirely through a thin platform in one frame without triggering the "was above" condition.

**Coordinate direction (confirmed):**
- Canvas Y=0 is TOP, Y=640 is BOTTOM
- Player going UP → Y decreases
- `JUMP_VELOCITY = -700` (negative = upward) ✓
- `GRAVITY = +980` (positive = pulls toward larger Y = downward) ✓

---

## System 2: One-Way Platform Collision

**Source:** PITFALLS.md Pitfall 3 + ARCHITECTURE.md Collision Detection section (HIGH confidence — MDN 2D Collision Detection)

**Four simultaneous conditions required:**

```javascript
function checkPlatformCollisions() {
  const prevBottom = player.prevY + player.h;   // feet position LAST frame
  const currBottom = player.y    + player.h;   // feet position THIS frame

  for (const p of platforms) {
    const overlapX   = player.x < p.x + p.w && player.x + player.w > p.x;
    const wasAbove   = prevBottom <= p.y;       // feet were AT or above platform top
    const nowBelow   = currBottom >= p.y;       // feet are at or below platform top
    const movingDown = player.vy > 0;           // must be falling (vy positive = downward)

    if (overlapX && wasAbove && nowBelow && movingDown) {
      player.y  = p.y - player.h;              // snap feet to platform top
      player.vy = JUMP_VELOCITY;               // auto-bounce — no jump key needed (LOOP-01)
    }
  }
}
```

**Why all four conditions:**
1. `overlapX` — prevents collision if player is to the left or right of platform
2. `wasAbove` — prevents collision when passing through from below (Doodle Jump core mechanic)
3. `nowBelow` — confirms the player's feet have crossed the platform surface this frame
4. `movingDown` — redundant with wasAbove+nowBelow but makes intent explicit; handles vy=0 edge case

**Anti-pattern warning:** A basic `intersects(player, platform)` AABB check triggers from all sides — player gets stuck on corners and cannot pass through from below. DO NOT use generic AABB here.

---

## System 3: Camera Scroll

**Source:** ARCHITECTURE.md Camera section + PITFALLS.md Pitfall 4 (HIGH confidence)

**Rule:** Keep the player at 40% from the top of the screen. Only scroll up — never back down.

```javascript
// In updateCamera() — called once per PLAYING frame after updatePlayer:
function updateCamera() {
  const SCROLL_THRESHOLD = canvas.height * 0.4;         // 256px from screen top
  const newCameraY       = player.y - SCROLL_THRESHOLD; // camera pos if player at threshold

  // Only update if player has climbed higher (cameraY must DECREASE — never increase)
  if (newCameraY < GameState.cameraY) {
    GameState.cameraY = newCameraY;
  }

  // Track maximum height reached (lowest Y = highest point in game world)
  if (player.y < GameState.maxHeightReached) {
    GameState.maxHeightReached = player.y;
  }
}
```

**Coordinate math verified:**
- `ctx.translate(0, -GameState.cameraY)` — positive cameraY shifts world UP on screen; negative cameraY shifts DOWN (reveals area above world Y=0)
- Player at world y=200, cameraY=-56: screen_y = 200 - (-56) = 256 = 40% of 640 ✓
- Player falls to y=400, cameraY=-56: screen_y = 400+56 = 456 (near bottom, camera fixed) ✓

**"Never scrolls back" constraint:** `Math.min` approach ensures cameraY can only decrease. If `newCameraY > GameState.cameraY`, the condition `newCameraY < GameState.cameraY` is false — camera stays. This handles the player falling back down without any additional check.

---

## System 4: Fall-off-Bottom Detection

**When:** Player's world Y exceeds the bottom of the visible camera area.

```javascript
// In update() PLAYING case — after updateCamera():
const cameraBottom = GameState.cameraY + canvas.height;
if (player.y > cameraBottom) {
  GameState.phase = GamePhase.GAMEOVER; // Phase 4 replaces with: lives-- + respawn
}
```

**Why `cameraY + canvas.height`:** The visible area spans world Y from `cameraY` (top) to `cameraY + 640` (bottom). A player at `y > cameraY + 640` is below the visible screen. In Phase 4, this same detection will subtract a life instead of going directly to GAMEOVER.

---

## Starting Layout (Phase 2 Hardcoded)

Phase 2 uses one static platform to prove physics and collision work before Phase 3 adds procedural generation.

```
Canvas (480×640)
┌───────────────────────────────┐
│                               │ y=0
│                               │
│                               │
│                               │
│         [player 32×32]        │ y=528 ← player starts here (above platform)
│    ████████████████████       │ y=560 ← starting platform (w=100, x=190)
│                               │
│                               │ y=640 (canvas bottom)
└───────────────────────────────┘
```

- **Player start:** `x=224, y=528` (centered horizontally, 32px above platform top at y=560)
- **Platform:** `{ x: 190, y: 560, w: 100, h: 12 }` (visible near bottom, wide enough to land reliably)
- **First frame behavior:** Gravity pulls player ~0.25px down → player.bottom crosses y=560 → collision fires → player.vy = -700 → immediate bounce ✓

---

## File Load Order

Phase 2 adds `platforms.js` between `player.js` and `main.js`:

```html
<script src="src/game-state.js"></script>   <!-- GamePhase, GameState, resetGame -->
<script src="src/input.js"></script>          <!-- keys -->
<script src="src/player.js"></script>          <!-- player, JUMP_VELOCITY, updatePlayer, renderPlayer, resetPlayer -->
<script src="src/platforms.js"></script>       <!-- NEW: platforms, checkPlatformCollisions, renderPlatforms, resetPlatforms -->
<script src="src/main.js"></script>            <!-- canvas, gameLoop, update, render -->
```

**Why this order:**
- `platforms.js` reads `player` and `JUMP_VELOCITY` (both from player.js) → must load after player.js
- `game-state.js` calls `resetPlatforms()` (from platforms.js) in `resetGame()` — but only at RUNTIME, not parse-time, so the load order still works

---

## Pitfalls Specific to Phase 2

| Pitfall | Prevention |
|---------|------------|
| One-way collision resolves from all sides | Use all 4 conditions: overlapX + wasAbove + nowBelow + movingDown |
| Camera scrolls back down when player falls | Only update cameraY when newCameraY < current cameraY |
| HUD text scrolls with the world | Always draw HUD after `ctx.restore()` — established in Phase 1 |
| prevY not initialized → wrong first-frame collision | Initialize `prevY` in `resetPlayer()` to same value as `y` |
| cameraY initialized to 0 but formula produces negative values | Negative cameraY is correct: it means camera is looking at world area above y=0 |
| Fall detection using canvas.height alone | Use `cameraY + canvas.height` — fall threshold moves up as camera scrolls |
| Player spawned inside platform | Player starts at y=528, platform at y=560 (player bottom=560, exactly on top) — vy=0 first frame, collision fires on frame where vy>0 |

---

## Sources

All findings sourced from prior project research (HIGH confidence):
- `.planning/research/ARCHITECTURE.md` — camera scroll pattern, collision algorithm, coordinate system
- `.planning/research/PITFALLS.md` — one-way collision (Pitfall 3), camera coordinate mismatch (Pitfall 4)
- `.planning/phases/01-foundation/01-RESEARCH.md` — delta time, game loop patterns (already implemented)
- Project example works: `jumprun/` — physics constants in pixel-space calibrated from school example analysis

**Research date:** 2026-03-05
**Valid until:** 2026-06-05 (stable browser APIs)
