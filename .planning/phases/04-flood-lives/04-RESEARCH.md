# Phase 4: Flood + Lives — Research

**Researched:** 2026-03-06
**Domain:** Canvas 2D wave rendering, game mechanic physics, damage/feedback systems (Vanilla JS)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLOOD-01 | Rising water level chases the player upward from below | Water object in world-space; waterY decrements each frame proportional to dt and floodSpeed |
| FLOOD-02 | Water speed increases over time, creating escalating difficulty | floodSpeed += FLOOD_ACCEL * dt each frame; reset in startNextLevel() with level multiplier |
| FLOOD-03 | Touching the water costs 1 life (not instant game over) | AABB check: player.y + player.h >= waterY + waveAmplitude; iframes guard against multi-hit |
| FLOOD-04 | Water displays as an animated wave (sine-wave ripple on surface) | beginPath loop across canvas width, y = waterY + sin(x * freq + waveTime) * amplitude; close path down and fill |
| LIFE-01 | Player starts with 3 lives, displayed as hearts on the HUD | GameState.lives already exists and is set to 3 in resetGame(); HUD renders Unicode ♥ × lives count |
| LIFE-02 | Player receives a brief visual indicator (screen flash) when taking damage | flashTimer in GameState; renderHUD draws rgba(255,0,0,alpha) fillRect at decreasing alpha each frame |
| LIFE-03 | Losing all 3 lives triggers the game over screen | lives-- in takeDamage(); if (GameState.lives <= 0) → saveHighScore + GameState.phase = GamePhase.GAMEOVER |
| LEVEL-04 | Flood speed resets or adjusts per level to create escalating difficulty across levels | startNextLevel() resets waterY to below screen; floodSpeed = FLOOD_BASE_SPEED * (1 + (level-1) * FLOOD_LEVEL_SCALE) |
</phase_requirements>

---

## Summary

Phase 4 is pure Canvas 2D and game-mechanic work — no external libraries, no build tooling changes. Everything resolves to six well-understood primitives: a world-space Y coordinate for water position, a sine-wave path drawn with `lineTo` inside a loop, a damage check against player AABB, an invincibility frame (iframe) timer to prevent multi-life drain, a screen-flash overlay using `globalAlpha + fillRect`, and Unicode heart rendering in the HUD.

The water object needs to live in world-space (like all other entities) so that `ctx.translate(0, -cameraY)` handles its visual position automatically. The wave surface is drawn at `waterY` (which decreases upward over time), with a sine offset applied per pixel column using a time accumulator. Below the wave the fill extends to a large world Y value to create a solid water body. The collision boundary must account for wave amplitude so the player cannot visually step into a wave trough before triggering damage.

The invincibility frame pattern is the single most important correctness concern. Without it, a single water contact drains all 3 lives in the same frame (or across 2-3 frames at 60 fps). Standard practice is a 1.5–2 second iframe timer stored on GameState; the damage function checks this timer before decrementing lives and resets it on hit. The flash overlay is a separate shorter timer (approximately 0.4 seconds) that controls a decaying red alpha drawn after `ctx.restore()` in screen space.

**Primary recommendation:** Add `src/water.js` for the water object (waterY, floodSpeed, waveTime, iframeTimer, flashTimer, and all update/render/reset functions), wire it into `main.js` at the documented callsites, and extend `renderHUD()` with hearts and flash. No new files needed beyond `water.js`.

---

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Canvas 2D `lineTo` loop | Built-in | Sine-wave surface rendering | Single draw call; MDN-verified pattern |
| `Math.sin()` + time accumulator | Built-in | Animating wave phase each frame | Stateless, deterministic, no allocation |
| `ctx.globalAlpha` | Built-in | Damage flash overlay fade | Saves/restores cleanly with ctx.save/restore |
| `ctx.fillStyle = 'rgba(...)'` | Built-in | Alternative to globalAlpha for flash | Inline alpha avoids globalAlpha state leak |
| Unicode `\u2665` (♥) | Built-in | Heart icons in HUD | No image asset needed; scales with font size |

### No External Libraries

This phase requires zero npm packages or CDN scripts. All functionality exists in the browser's Canvas 2D API.

**No installation step needed.**

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── game-state.js   # Add: flashTimer, iframeTimer (or in water.js — see Pattern 2)
├── input.js        # Unchanged
├── player.js       # Unchanged
├── platforms.js    # Unchanged
├── water.js        # NEW — water object, updateWater(), renderWater(), resetWater()
└── main.js         # Wire: updateWater(dt) in PLAYING case; renderWater(ctx) in world-space block
```

```html
<!-- index.html — add water.js BEFORE main.js -->
<script src="src/game-state.js"></script>
<script src="src/input.js"></script>
<script src="src/player.js"></script>
<script src="src/platforms.js"></script>
<script src="src/water.js"></script>   <!-- NEW — before main.js -->
<script src="src/main.js"></script>
```

### Pattern 1: Water Object in World Space

**What:** A plain JS object holds waterY (world coordinate of the wave surface, decreasing over time), floodSpeed (px/s), and waveTime (seconds accumulator for animation phase).

**When to use:** Always — matches the existing pattern for `player` and `platforms`.

```javascript
// src/water.js
const FLOOD_BASE_SPEED  = 30;   // px/s at level 1 (tune in playtesting)
const FLOOD_ACCEL       = 1.5;  // px/s² — speed increase per second of play
const FLOOD_LEVEL_SCALE = 0.4;  // each level multiplies base speed by (1 + level * scale)
const WAVE_AMPLITUDE    = 10;   // px — sine crest height
const WAVE_FREQUENCY    = 0.04; // radians per pixel — controls wave width
const WAVE_SPEED        = 2.5;  // radians per second — controls animation pace

const water = {
  waterY:     700, // world Y of wave surface — starts below canvas bottom (640 + cameraY buffer)
  floodSpeed: FLOOD_BASE_SPEED,
  waveTime:   0,
  iframeTimer: 0,  // seconds remaining of invincibility after damage
  flashTimer:  0,  // seconds remaining of damage flash overlay
};

function resetWater(level) {
  // Place water well below the canvas so it isn't visible at level start
  water.waterY     = 700; // ~60px below canvas bottom when cameraY=0
  water.floodSpeed = FLOOD_BASE_SPEED * (1 + (level - 1) * FLOOD_LEVEL_SCALE);
  water.waveTime   = 0;
  water.iframeTimer = 0;
  water.flashTimer  = 0;
}
```

**Key:** `waterY = 700` places the surface 60px below the visible canvas at `cameraY = 0`. As the player climbs and `cameraY` decreases, the water must also rise (waterY decreases) to continue chasing. Water rises in world space independently of camera.

### Pattern 2: Storing Timers — water.js vs game-state.js

**Decision:** Store `iframeTimer` and `flashTimer` on the `water` object rather than on `GameState`. Rationale: they are reset by `resetWater()` and only read/written by `water.js` and `renderHUD()`. GameState already has `lives` which is the shared contract.

`renderHUD()` in `main.js` reads `water.flashTimer` directly — both files are global scope, so this is safe.

### Pattern 3: updateWater(dt)

**What:** Advances waterY upward, increases floodSpeed, ticks waveTime, runs damage check.

```javascript
// src/water.js
const IFRAME_DURATION = 1.8; // seconds of invincibility after damage hit
const FLASH_DURATION  = 0.4; // seconds the red flash overlay is visible

function updateWater(dt) {
  // Tick down timers (clamp to 0 — never go negative)
  if (water.iframeTimer > 0) water.iframeTimer = Math.max(0, water.iframeTimer - dt);
  if (water.flashTimer  > 0) water.flashTimer  = Math.max(0, water.flashTimer  - dt);

  // Rise: waterY decreases (upward in world space)
  water.waterY     -= water.floodSpeed * dt;

  // Accelerate flood over time
  water.floodSpeed += FLOOD_ACCEL * dt;

  // Advance wave animation phase
  water.waveTime   += WAVE_SPEED * dt;

  // Collision: player bottom touches wave surface (with amplitude buffer)
  const playerBottom = player.y + player.h;
  const collisionY   = water.waterY - WAVE_AMPLITUDE; // player hits at crest, not trough

  if (playerBottom >= collisionY && water.iframeTimer <= 0) {
    takeDamage();
  }
}

function takeDamage() {
  GameState.lives  -= 1;
  water.iframeTimer = IFRAME_DURATION;
  water.flashTimer  = FLASH_DURATION;

  if (GameState.lives <= 0) {
    saveHighScore(GameState.score);
    GameState.phase = GamePhase.GAMEOVER;
  }
}
```

**Critical:** `collisionY = water.waterY - WAVE_AMPLITUDE` ensures the player takes damage at the visible wave crest, not at the mean waterY. Without this, the player visually touches the wave with no effect for `WAVE_AMPLITUDE` pixels, which feels broken.

### Pattern 4: renderWater(ctx) — Sine Wave Filled Shape

**What:** A filled polygon that covers the wave surface and all water below it. The top edge follows a sine curve; the bottom closes at a large world Y to fill the body.

**When to use:** Called inside the world-space `ctx.save/translate/restore` block in `main.js`, after platforms and player (so water renders on top of platforms, below HUD).

```javascript
// src/water.js
// Source: MDN CanvasRenderingContext2D.lineTo — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineTo
function renderWater(ctx) {
  ctx.fillStyle = 'rgba(30, 144, 255, 0.75)'; // Dodger Blue, semi-transparent

  ctx.beginPath();

  // Start at the left edge at the wave surface
  ctx.moveTo(0, water.waterY + Math.sin(water.waveTime) * WAVE_AMPLITUDE);

  // Trace across full canvas width, one point per pixel column
  for (let x = 1; x <= 480; x++) {
    const waveY = water.waterY + Math.sin(x * WAVE_FREQUENCY + water.waveTime) * WAVE_AMPLITUDE;
    ctx.lineTo(x, waveY);
  }

  // Close the shape: right edge down, across the bottom, back up to left
  ctx.lineTo(480, water.waterY + 2000); // extend far below visible area
  ctx.lineTo(0,   water.waterY + 2000);
  ctx.closePath();
  ctx.fill();
}
```

**Note:** `water.waterY + 2000` is a safe sentinel. As long as this value exceeds `cameraY + canvas.height`, the water body fills the visible area completely. At `cameraY = 0`, the canvas bottom is at world Y 640; adding 2000 guarantees coverage with ample margin.

### Pattern 5: Damage Flash Overlay (screen space)

**What:** A semi-transparent red `fillRect` drawn in `renderHUD()` after `ctx.restore()`. Alpha decays from ~0.5 to 0 over `FLASH_DURATION` seconds.

**When to use:** In `renderHUD()` in `main.js`, at the top before any other HUD elements.

```javascript
// In renderHUD() — src/main.js
// Source: MDN globalAlpha — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha
if (water.flashTimer > 0) {
  const alpha = (water.flashTimer / 0.4) * 0.5; // 0.5 at full, fades to 0
  ctx.fillStyle = 'rgba(220, 30, 30, ' + alpha + ')';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

**Why `rgba(...)` with inline alpha instead of `globalAlpha`:** No risk of leaving `globalAlpha` in a non-1.0 state if a code path skips `ctx.restore()`. Simpler to reason about in HUD code.

### Pattern 6: HUD Hearts

**What:** Three Unicode heart characters (♥ = `\u2665`) rendered in HUD, with a different color for empty vs filled lives.

```javascript
// In renderHUD() — src/main.js, inside the PLAYING block
const heartX = canvas.width - 16;
const heartSpacing = 22;
ctx.font      = '18px monospace';
ctx.textAlign = 'right';
for (let i = 0; i < 3; i++) {
  ctx.fillStyle = i < GameState.lives ? '#e74c3c' : '#555555'; // red = full, grey = lost
  ctx.fillText('\u2665', heartX - i * heartSpacing, 20);
}
ctx.textAlign = 'left'; // always reset
```

**Placement:** Top-right corner so it does not collide with Score/Level text in the top-left.

### Pattern 7: resetWater() wiring

**Where:** Call `resetWater(GameState.level)` at the end of `resetGame()` and at the end of `startNextLevel()` in `game-state.js`.

```javascript
// game-state.js — add to resetGame():
function resetGame() {
  // ... existing resets ...
  resetWater(1);   // level 1 always on full reset
}

// game-state.js — add to startNextLevel():
function startNextLevel() {
  // ... existing resets ...
  resetWater(GameState.level); // called after level increments
}
```

**Load order:** `water.js` must be loaded before `game-state.js` calls `resetWater()`. Since `resetGame()` and `startNextLevel()` are only called at runtime (never during script parse), the load order in `index.html` just needs `water.js` before `main.js`. `game-state.js` calling `resetWater()` at runtime is safe regardless of load position because `water.js` will already be parsed by the time the first keypress fires.

### Anti-Patterns to Avoid

- **Flat rectangle water:** `fillRect` at waterY is fast but fails FLOOD-04. Always use the `lineTo` loop.
- **Camera-space waterY:** Storing water position in screen pixels and offsetting by cameraY each frame is fragile. Keep waterY in world coordinates.
- **No invincibility frames:** Without `iframeTimer`, the player loses all 3 lives in ~3 frames of water contact. Always check `iframeTimer <= 0` before calling `takeDamage()`.
- **Collide at waterY mean, not crest:** `playerBottom >= water.waterY` misses the amplitude offset. The player visually intersects the wave before the collision triggers. Use `water.waterY - WAVE_AMPLITUDE` as the collision threshold.
- **Resetting lives in startNextLevel():** `game-state.js` already documents this decision — lives intentionally persist across levels. Do not add `lives = 3` to `startNextLevel()`.
- **Calling renderWater inside ctx.save/restore but after ctx.restore for HUD:** Water is a world-space entity. It MUST be inside the `ctx.save / ctx.translate / ctx.restore` block, before `ctx.restore()` is called. Only the flash overlay and hearts go after `ctx.restore()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wave surface animation | Bezier curve approximation, sprite sheet | `Math.sin()` loop with `lineTo` | Canvas `lineTo` loop is the canonical approach; 480 points renders in <1ms at 60fps |
| Invincibility frames | Complex state machine with enum | Simple float timer countdown | A single `iframeTimer` float that counts down is sufficient; any state enum adds code without benefit |
| Heart icons | PNG sprite for hearts | Unicode `\u2665` with `fillText` | No image loading; scales with font; matches the monospace-text aesthetic already established |
| Flood speed escalation | Precomputed table of speeds per level | `FLOOD_BASE_SPEED * (1 + level * scale)` formula | Deterministic, easy to tune during playtesting |

**Key insight:** Every feature in Phase 4 is a canvas primitive composition problem, not a library problem. Resist adding a physics or animation library — the game has 5 moving pieces and the overhead would dwarf the benefit.

---

## Common Pitfalls

### Pitfall 1: Lives drain in one frame without iframes

**What goes wrong:** Player touches water once, all 3 lives gone in <100ms. Game over appears before the player even sees the flash.

**Why it happens:** `updateWater` is called once per frame. If the collision check runs and `lives--` fires without a cooldown, the next frame still finds `playerBottom >= collisionY` and fires again immediately.

**How to avoid:** Set `water.iframeTimer = IFRAME_DURATION` (1.8 seconds) inside `takeDamage()`. Check `water.iframeTimer <= 0` before entering `takeDamage()`. Never check iframes outside of `takeDamage()` — keep the guard co-located with the state mutation.

**Warning signs:** Play-testing shows game over appearing immediately after first water contact.

### Pitfall 2: Water renders above HUD

**What goes wrong:** Water fills the top of the screen, covering score and hearts.

**Why it happens:** `renderWater(ctx)` is called after `ctx.restore()` instead of before, so it draws in screen space with no camera offset but no clipping.

**How to avoid:** `renderWater(ctx)` MUST be called inside the `ctx.save / ctx.translate` block in `render()`, before `ctx.restore()`. The HUD flash and hearts are the ONLY water-related rendering that goes after `ctx.restore()`.

**Warning signs:** Blue fill appears in top portion of canvas at game start.

### Pitfall 3: Water gap between body and wave

**What goes wrong:** The wave surface animates but a thin sky-colored gap appears between the wave and the water body below it.

**Why it happens:** The wave is drawn as a stroked line, not a filled shape. Or: the closing path goes to `waterY + someSmallValue` that a large wave crest can exceed.

**How to avoid:** Always close the wave path by going to `waterY + 2000`, not to `waterY + amplitude`. The fill must start at `water.waterY + 2000` so the entire body below the wave is included.

**Warning signs:** Visible sky-colored stripe flickers below the wave crest at certain animation phases.

### Pitfall 4: Water doesn't reset between levels

**What goes wrong:** Water position and speed carry over from the previous level. Level 2 starts with water already at the player's feet.

**Why it happens:** `resetWater()` is not called from `startNextLevel()`, or waterY is not reset to the below-screen sentinel value.

**How to avoid:** `startNextLevel()` in `game-state.js` must call `resetWater(GameState.level)` after `GameState.level += 1`. Verify by adding `console.log('waterY after reset:', water.waterY)` during development.

**Warning signs:** Level 2 is immediately unplayable — water visible from frame 1.

### Pitfall 5: globalAlpha state leak in HUD

**What goes wrong:** After the flash overlay renders, all subsequent HUD text is semi-transparent. Hearts appear faded even when lives are full.

**Why it happens:** `ctx.globalAlpha = alpha` is set for the flash rect but never reset to `1.0` before drawing hearts and score text.

**How to avoid:** Use inline `rgba()` in `fillStyle` for the flash rect instead of `ctx.globalAlpha`. This never mutates the global alpha state.

**Warning signs:** HUD text is visibly semi-transparent for 0.4 seconds after taking damage.

### Pitfall 6: LOOP-05 fall detection conflict

**What goes wrong:** Player falling off the bottom of the screen triggers GAMEOVER directly (current Phase 2 stub code in `main.js` line 58-61) before the lives system has a chance to apply.

**Why it happens:** The existing fall detection in `main.js` goes directly to `GamePhase.GAMEOVER` rather than calling `takeDamage()`.

**How to avoid:** Phase 4 must replace the fall-detection stub (noted in `main.js` line 57 comment: "Phase 4 will replace with lives-- + respawn"). When player falls off camera bottom, call `takeDamage()` and respawn player at the current camera top (or current platform position), rather than immediately going to GAMEOVER. This requires a respawn position calculation.

**Warning signs:** Falling off the bottom always causes instant game over regardless of lives count.

---

## Code Examples

Verified patterns from Canvas 2D API documentation (MDN, accessed 2026-03-06):

### Sine wave filled body — complete renderWater() function

```javascript
// Source: MDN lineTo — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineTo
function renderWater(ctx) {
  ctx.fillStyle = 'rgba(30, 144, 255, 0.75)';

  ctx.beginPath();
  ctx.moveTo(0, water.waterY + Math.sin(water.waveTime) * WAVE_AMPLITUDE);

  for (let x = 1; x <= 480; x++) {
    const waveY = water.waterY + Math.sin(x * WAVE_FREQUENCY + water.waveTime) * WAVE_AMPLITUDE;
    ctx.lineTo(x, waveY);
  }

  ctx.lineTo(480, water.waterY + 2000);
  ctx.lineTo(0,   water.waterY + 2000);
  ctx.closePath();
  ctx.fill();
}
```

### Damage flash overlay — in renderHUD()

```javascript
// Source: MDN globalAlpha — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha
// Called AFTER ctx.restore() — draws in screen space
if (water.flashTimer > 0) {
  const alpha = (water.flashTimer / FLASH_DURATION) * 0.5;
  ctx.fillStyle = 'rgba(220, 30, 30, ' + alpha.toFixed(3) + ')';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

### HUD hearts — in renderHUD() PLAYING block

```javascript
// Unicode ♥ = \u2665 — no image asset required
ctx.font      = '18px monospace';
ctx.textAlign = 'right';
for (let i = 0; i < 3; i++) {
  ctx.fillStyle = i < GameState.lives ? '#e74c3c' : '#444444';
  ctx.fillText('\u2665', (canvas.width - 8) - i * 22, 20);
}
ctx.textAlign = 'left';
```

### Full updateWater(dt) with dt-capped physics

```javascript
// All velocities and timers use dt (seconds) — consistent with GRAVITY/PLAYER_SPEED pattern
function updateWater(dt) {
  if (water.iframeTimer > 0) water.iframeTimer = Math.max(0, water.iframeTimer - dt);
  if (water.flashTimer  > 0) water.flashTimer  = Math.max(0, water.flashTimer  - dt);

  water.waterY     -= water.floodSpeed * dt;  // rise: Y decreases upward
  water.floodSpeed += FLOOD_ACCEL * dt;        // accelerate
  water.waveTime   += WAVE_SPEED * dt;         // animate wave phase

  const playerBottom = player.y + player.h;
  const collisionY   = water.waterY - WAVE_AMPLITUDE; // crest, not mean

  if (playerBottom >= collisionY && water.iframeTimer <= 0) {
    takeDamage();
  }
}
```

### resetWater() wiring in game-state.js

```javascript
function resetGame() {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.lives            = 3;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  GameState.level            = 1;
  resetPlayer();
  resetPlatforms();
  resetWater(1);  // ADD THIS — level 1 flood speed on full game reset
}

function startNextLevel() {
  GameState.level           += 1;
  GameState.score            = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  GameState.phase            = GamePhase.PLAYING;
  resetPlayer();
  resetPlatforms();
  resetWater(GameState.level);  // ADD THIS — escalated flood speed for new level
}
```

### Fall-off-bottom handling (replaces Phase 2 stub)

```javascript
// In main.js PLAYING update case — replaces the current GAMEOVER direct transition:
// OLD (Phase 2 stub):
//   if (player.y > GameState.cameraY + canvas.height) {
//     saveHighScore(GameState.score);
//     GameState.phase = GamePhase.GAMEOVER;
//   }

// NEW (Phase 4):
if (player.y > GameState.cameraY + canvas.height && water.iframeTimer <= 0) {
  takeDamage();
  // Respawn: place player at top of current camera view so they can continue
  player.y  = GameState.cameraY + 60;
  player.vy = JUMP_VELOCITY; // auto-bounce immediately after respawn
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Instant-death on any hazard contact | Lives + invincibility frames | Standard in all arcade platformers since 1985; LIFE-01/LIFE-03 require this |
| Single flat water rectangle | Animated sine wave with filled polygon | FLOOD-04 requires sine animation |
| Global `ctx.globalAlpha` for overlays | Inline `rgba()` alpha in `fillStyle` | Avoids globalAlpha state leak; equivalent result |
| requestAnimationFrame time parameter directly | dt accumulation via `lastTime` subtraction (already in this codebase) | Already implemented in Phase 1 — waveTime uses same pattern |

---

## Open Questions

1. **Water rise speed curve: linear acceleration vs score-based step function**
   - What we know: `FLOOD_ACCEL` linear ramp is simple to implement. Score-based steps (e.g. every 500 px, speed jumps by 10) feel more dramatic.
   - What's unclear: Which feels better during actual play for a ~2-minute session. Cannot know without playtesting.
   - Recommendation: Implement linear acceleration first (`FLOOD_BASE_SPEED + FLOOD_ACCEL * dt`). Use named constants so the planner can tune in a single pass. The decision is a number change, not an architecture change.

2. **Respawn position after fall off screen bottom**
   - What we know: The Phase 2 stub goes directly to GAMEOVER. Phase 4 replaces this with `takeDamage()` + respawn.
   - What's unclear: Where exactly to respawn the player. Two options: (a) camera top + 60px, always; (b) find the highest platform within the current camera view and snap player above it.
   - Recommendation: Option (a) is safe and simple. Option (b) risks "no platform in view" edge case. Use option (a).

3. **Should water render in front of or behind platforms?**
   - What we know: Water is a world-space entity drawn in the same ctx.save block as platforms.
   - What's unclear: Visual layering preference.
   - Recommendation: Draw water AFTER platforms (water renders in front). Water covering a platform visually signals "this is flooded." Use render order: `renderPlatforms → renderPlayer → renderWater`.

4. **FLOOD-02 wording: "over time" vs "per level"**
   - What we know: LEVEL-04 says flood speed resets per level with escalation. FLOOD-02 says "increases over time."
   - Resolution: Both are simultaneously true. `FLOOD_ACCEL` handles "over time" within a level. `resetWater(level)` sets a higher starting `floodSpeed` each level. These are additive difficulty layers, not competing designs.

---

## Sources

### Primary (HIGH confidence)

- MDN Web Docs — `CanvasRenderingContext2D.lineTo` (accessed 2026-03-06) — confirmed sine-wave polygon pattern via `beginPath / moveTo / lineTo loop / closePath / fill`
- MDN Web Docs — `CanvasRenderingContext2D.globalAlpha` (accessed 2026-03-06) — confirmed range 0.0–1.0, confirmed save/restore behavior, confirmed inline rgba alternative
- `src/main.js` (this codebase) — confirmed existing callsites `// Phase 4 will add: updateWater(dt)` and `// Phase 4 will add: renderWater(ctx)` and the fall-detection stub to replace
- `src/game-state.js` (this codebase) — confirmed `GameState.lives = 3` in resetGame(), `lives` excluded from startNextLevel(), `resetGame()` and `startNextLevel()` signatures
- `src/player.js` (this codebase) — confirmed player AABB: `player.x, player.y, player.w (32), player.h (32)`; confirmed `JUMP_VELOCITY = -700`
- `index.html` (this codebase) — confirmed load order; water.js insertion point between platforms.js and main.js is safe

### Secondary (MEDIUM confidence)

- Invincibility frame duration (1.5–2 seconds): standard game design practice, cross-verified across multiple platformer implementations; specific value requires playtesting calibration

### Tertiary (LOW confidence)

- Optimal `WAVE_AMPLITUDE = 10`, `WAVE_FREQUENCY = 0.04`, `WAVE_SPEED = 2.5`: reasonable starting values based on canvas dimensions (480 wide, 640 tall) and typical feel; these are explicitly tunable constants and will need playtesting

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all Canvas 2D APIs verified via MDN
- Architecture: HIGH — directly derived from existing codebase patterns (world-space entities, `ctx.save/translate/restore`, HUD after restore)
- Pitfalls: HIGH for structural ones (iframe omission, render order, globalAlpha leak); MEDIUM for numeric tuning (flood speed, amplitudes)

**Research date:** 2026-03-06
**Valid until:** 2026-04-22 (stable — Canvas 2D API does not change; constants need playtesting)
