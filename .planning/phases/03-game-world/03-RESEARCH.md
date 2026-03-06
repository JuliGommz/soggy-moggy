# Phase 3: Game World - Research

**Researched:** 2026-03-06
**Domain:** Vanilla JS Canvas 2D game systems — procedural platforms, level structure, screen state machine, score, LocalStorage
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOOP-03 | Platforms are procedurally generated as the player climbs higher | Platform generation algorithm: spawn ahead of player, clean up behind |
| LOOP-06 | Player score equals the maximum height reached within the current level | Height formula already in code: `528 - GameState.maxHeightReached`; reset per level |
| LOOP-07 | Score is displayed in real-time on the HUD during gameplay | `ctx.fillText` in renderHUD after `ctx.restore()`; score computed each frame |
| LEVEL-01 | Each level has a defined height goal — reaching it completes the level (not a game over) | Height goal stored as world Y coordinate; checked in update loop |
| LEVEL-02 | Level-complete screen displays the score for that level and transitions to the next level | New `LEVEL_COMPLETE` GamePhase; any key triggers `startNextLevel()` |
| LEVEL-03 | Platforms are procedurally generated within each level's bounded height range (not infinite) | Level has a fixed world-Y ceiling; platform generation stops at that ceiling |
| SCRN-01 | Start screen displays game title, controls explanation, and a start button | Drawn in renderHUD when `GameState.phase === GamePhase.START`; Enter key starts |
| SCRN-02 | Game over screen displays final score, all-time high score, and a restart button | Drawn in renderHUD when `GamePhase.GAMEOVER`; reads `GameState.highScore` |
| SCRN-03 | High score is stored in LocalStorage and survives browser close/reopen | `localStorage.setItem` / `parseInt(localStorage.getItem(...), 10)` with null guard |
| PLAT-01 | Normal platforms allow unlimited jumps and are visually distinct from background | Already exists; add `type: 'normal'` property for Phase 3 extension |
| PLAT-02 | Crumbling platforms break after one landing (visual crack then disappear) | Platform state machine: `'intact'` → `'cracked'` → `'gone'`; timer-based removal |
| PLAT-03 | Platform gap sizing ensures the cat can always reach the next platform | Max vertical gap = 200px (calculated from JUMP_VELOCITY and GRAVITY constants) |
</phase_requirements>

---

## Summary

Phase 3 is the largest structural change to the codebase so far. It replaces the single hardcoded platform with a procedural generation system, adds a full level lifecycle (start → playing → level-complete → next level → game over), and introduces LocalStorage persistence. All of this builds on — and must not break — the collision, camera, and height-tracking systems established in Phase 2.

The game's current state machine has three phases: `START`, `PLAYING`, `GAMEOVER`. Phase 3 adds a fourth: `LEVEL_COMPLETE`. This is a simple enum extension. The tricky part is the level reset: when a level completes, the player resets to the bottom of the new level's world-space coordinate range, all platforms regenerate, and the camera resets — but `GameState.lives` must NOT reset. That distinction requires a `startNextLevel()` function separate from `resetGame()`.

Procedural platform generation follows a straightforward vertical-spacing algorithm: divide the level height into slots, place platforms in each slot at random X positions, and include a controlled fraction of crumbling platforms. The hard constraint from physics (JUMP_VELOCITY = -700, GRAVITY = 980) caps the maximum safe vertical gap at 200px with a 20% safety margin. Horizontal position does not constrain reachability because the player wraps at screen edges and can jump horizontally ~429px in a single arc.

**Primary recommendation:** Add `LEVEL_COMPLETE` to GamePhase, create `startNextLevel()` separate from `resetGame()`, generate all level platforms upfront into the `platforms[]` array, and persist high score with a single try/catch around localStorage calls to handle the Firefox file:// quirk gracefully.

---

## Standard Stack

No external libraries are used. This phase is entirely vanilla JS + Canvas 2D API + localStorage.

### Core
| API | Version | Purpose | Why Standard |
|-----|---------|---------|--------------|
| HTML Canvas 2D (`CanvasRenderingContext2D`) | Built-in | Rendering platforms, text screens, HUD | Already in use; no dependencies |
| `localStorage` | Built-in | Persisting high score across sessions | The only browser-native persistent key-value store available without a server |
| `Object.freeze` | ES2022+ | Extending GamePhase enum | Already established pattern in game-state.js |

### Supporting
| API | Purpose | When to Use |
|-----|---------|-------------|
| `ctx.textAlign = 'center'` | Center title and button text on screens | All overlay screens (START, LEVEL_COMPLETE, GAMEOVER) |
| `ctx.measureText(str).width` | Not needed if textAlign = center is used | Only needed for left-aligned dynamic text |
| `Math.random()` | Platform X positions and type selection | Inside the platform generator |
| `performance.now()` | Already used; no change needed for timers | Crumble timer uses the existing `dt` accumulator pattern |

### No External Dependencies
This project deliberately uses no npm packages. All required functionality is native to the browser. Do NOT introduce any import statements, CDN links, or build steps.

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 3)
```
src/
├── game-state.js   # Add: LEVEL_COMPLETE phase, level/highScore fields, startNextLevel()
├── input.js        # No change needed
├── player.js       # No change needed (resetPlayer already exists)
├── platforms.js    # Replace: procedural generator, crumbling state machine
└── main.js         # Add: LEVEL_COMPLETE case in update/render, goal-line render
```

No new files are needed. All changes are surgical additions to existing files.

### Pattern 1: Extending the GamePhase Enum

**What:** Add `LEVEL_COMPLETE` as a fourth phase constant.
**When to use:** When the player reaches the level goal Y coordinate.
**Example:**
```javascript
// src/game-state.js
const GamePhase = Object.freeze({
  START:          'start',
  PLAYING:        'playing',
  LEVEL_COMPLETE: 'level_complete',  // NEW
  GAMEOVER:       'gameover',
});
```

### Pattern 2: GameState Level Fields

**What:** Add `level`, `levelScore`, and `highScore` to GameState.
**When to use:** Fields must exist before `resetGame()` or `startNextLevel()` reference them.
```javascript
// src/game-state.js
const GameState = {
  phase:            GamePhase.START,
  score:            0,       // current level score (height in pixels)
  lives:            3,
  cameraY:          0,
  maxHeightReached: 0,
  level:            1,       // NEW: current level number (1-based)
  levelScore:       0,       // NEW: score accumulated this level (alias for score; kept separate for clarity)
  highScore:        0,       // NEW: all-time best, loaded from localStorage on init
};
```

### Pattern 3: Two Reset Functions

**What:** `resetGame()` is a full reset (lives back to 3). `startNextLevel()` advances the level without touching lives.
**Why:** These are genuinely different operations. Conflating them causes the game to reset lives on level completion.
```javascript
// src/game-state.js

function resetGame() {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.lives            = 3;          // full reset
  GameState.level            = 1;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  resetPlayer();
  resetPlatforms();
}

function startNextLevel() {
  GameState.level           += 1;
  GameState.score            = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  GameState.phase            = GamePhase.PLAYING;
  // GameState.lives is NOT touched
  resetPlayer();
  resetPlatforms();          // generates new level's platforms
}
```

### Pattern 4: Procedural Platform Generation (Upfront, Bounded)

**What:** Generate all platforms for a level at reset time — not dynamically during play. Store level goal as a world Y coordinate.
**Why upfront:** The level has a bounded height (not infinite), so all platforms can be pre-generated. This simplifies collision and avoids spawn-ahead logic.
**Algorithm:**
1. Define `LEVEL_HEIGHT_PX` = height goal in pixels (e.g., 2000px for level 1, scaling per level).
2. Divide level height into vertical slots of `GAP_PX` each.
3. For each slot, place one platform at a random X, with random width.
4. Assign `type: 'normal'` or `type: 'crumble'` based on controlled probability.
5. The goal Y coordinate = `PLAYER_START_Y - LEVEL_HEIGHT_PX` (world space — lower Y = higher).

```javascript
// src/platforms.js

const PLATFORM_H       = 12;
const PLATFORM_MIN_W   = 60;
const PLATFORM_MAX_W   = 100;
const GAP_PX           = 120;   // vertical slot height — must stay below 200px (jump limit)
const CRUMBLE_CHANCE   = 0.25;  // 25% of platforms are crumbling

// Computed from player.js constants (JUMP_VELOCITY=700, GRAVITY=980):
//   max jump height = 700² / (2 * 980) ≈ 250px
//   safe max gap   = 250 * 0.80 = 200px → use 120px for comfortable play

const LEVEL_BASE_HEIGHT = 2000; // px per level 1; scale by level number

function generateLevelPlatforms(level) {
  platforms.length = 0;

  const levelHeight  = LEVEL_BASE_HEIGHT + (level - 1) * 500; // escalate per level
  const playerStartY = 528; // must match resetPlayer() — player.y at reset

  // Starter platform: always normal, centered, directly under spawn point
  platforms.push({
    x: 190, y: 560, w: 100, h: PLATFORM_H, type: 'normal',
    state: 'intact', crumbleTimer: 0
  });

  // Store the level goal Y in world space
  GameState.levelGoalY = playerStartY - levelHeight;

  // Generate platforms in vertical slots from bottom to top
  const slotCount = Math.floor(levelHeight / GAP_PX);
  for (let i = 1; i <= slotCount; i++) {
    const worldY = playerStartY - i * GAP_PX;
    const w      = PLATFORM_MIN_W + Math.random() * (PLATFORM_MAX_W - PLATFORM_MIN_W);
    const x      = 20 + Math.random() * (480 - w - 40); // 20px margin each side
    const type   = Math.random() < CRUMBLE_CHANCE ? 'crumble' : 'normal';

    platforms.push({
      x: Math.floor(x),
      y: Math.floor(worldY),
      w: Math.floor(w),
      h: PLATFORM_H,
      type,
      state: 'intact',
      crumbleTimer: 0,
    });
  }
}
```

**Gap constraint verification:**
- `GAP_PX = 120` is 48% of the 250px max jump height.
- Theoretical max vertical gap a player CAN bridge = 200px (80% safety margin).
- 120px gap leaves 130px of headroom — satisfies PLAT-03 comfortably.
- Horizontal wrapping means X position is never a reachability constraint.

### Pattern 5: Crumbling Platform State Machine

**What:** Each crumbling platform has a `state` field: `'intact'` → `'cracked'` → `'gone'`. Transition uses an elapsed time accumulator driven by `dt`.
**Key insight:** The state must outlive the landing frame. The platform should CRACK on first contact, then DISAPPEAR after a short delay (500ms). This gives visual feedback before disappearing, satisfying PLAT-02.

```javascript
// src/platforms.js

const CRUMBLE_DELAY_MS = 500; // time between crack and disappear (ms)

function updatePlatforms(dt) {
  for (let i = platforms.length - 1; i >= 0; i--) {
    const p = platforms[i];
    if (p.type === 'crumble' && p.state === 'cracked') {
      p.crumbleTimer += dt * 1000; // dt is seconds; convert to ms
      if (p.crumbleTimer >= CRUMBLE_DELAY_MS) {
        platforms.splice(i, 1); // remove from array
      }
    }
  }
}

// In checkPlatformCollisions(), add after the landing snap:
if (overlapX && wasAbove && nowBelow && movingDown) {
  player.y  = p.y - player.h;
  player.vy = JUMP_VELOCITY;

  // Crumble transition: intact → cracked on first landing
  if (p.type === 'crumble' && p.state === 'intact') {
    p.state = 'cracked';
    p.crumbleTimer = 0;
  }
}
```

### Pattern 6: Level Goal Detection and LEVEL_COMPLETE Transition

**What:** Check if `player.y <= GameState.levelGoalY` in the PLAYING update case.
**Where:** In `update()` in main.js, after `updateCamera()`.

```javascript
// src/main.js — inside case GamePhase.PLAYING:

// Level goal reached?
if (player.y <= GameState.levelGoalY) {
  // Save level score as high score candidate
  const finalScore = Math.max(0, 528 - GameState.maxHeightReached);
  GameState.score  = finalScore;
  saveHighScore(finalScore);
  GameState.phase  = GamePhase.LEVEL_COMPLETE;
}
```

### Pattern 7: LocalStorage High Score

**What:** Read on game init, write on level complete and game over. Always wrap in try/catch — localStorage throws on Firefox file:// and in private browsing with blocked storage.
**Source:** MDN Web Docs (verified)

```javascript
// src/game-state.js

const HS_KEY = 'soggymoggy_highscore';

function loadHighScore() {
  try {
    const stored = localStorage.getItem(HS_KEY);
    GameState.highScore = stored !== null ? parseInt(stored, 10) : 0;
  } catch (e) {
    GameState.highScore = 0; // graceful fallback
  }
}

function saveHighScore(score) {
  if (score > GameState.highScore) {
    GameState.highScore = score;
    try {
      localStorage.setItem(HS_KEY, String(score));
    } catch (e) {
      // Storage unavailable (Firefox file://, private mode) — silently ignore
    }
  }
}
```

Call `loadHighScore()` once at the bottom of game-state.js (before any other scripts load).

### Pattern 8: Screen Rendering on Canvas

**What:** All screen overlays (START, LEVEL_COMPLETE, GAMEOVER) are drawn in screen space inside `renderHUD()`, after `ctx.restore()`. Use `ctx.textAlign = 'center'` with `canvas.width / 2` as x to center text automatically.
**Source:** MDN CanvasRenderingContext2D.textAlign (verified)

```javascript
// src/main.js — inside renderHUD()

if (GameState.phase === GamePhase.START) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffffff';
  ctx.font      = '36px monospace';
  ctx.fillText('SOGGY MOGGY', canvas.width / 2, 240);

  ctx.font = '16px monospace';
  ctx.fillText('Arrow keys or A / D to move', canvas.width / 2, 300);
  ctx.fillText('Platforms bounce you automatically', canvas.width / 2, 325);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('Press ENTER to start', canvas.width / 2, 390);

  ctx.textAlign = 'left'; // reset to default
}

if (GameState.phase === GamePhase.LEVEL_COMPLETE) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#2ecc71';
  ctx.font      = '32px monospace';
  ctx.fillText('LEVEL ' + GameState.level + ' CLEAR!', canvas.width / 2, 240);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '20px monospace';
  ctx.fillText('Score: ' + GameState.score + ' px', canvas.width / 2, 300);

  ctx.font = '16px monospace';
  ctx.fillText('Press ENTER to continue', canvas.width / 2, 380);

  ctx.textAlign = 'left';
}

if (GameState.phase === GamePhase.GAMEOVER) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e74c3c';
  ctx.font      = '32px monospace';
  ctx.fillText('GAME OVER', canvas.width / 2, 240);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '20px monospace';
  ctx.fillText('Score: ' + GameState.score + ' px', canvas.width / 2, 300);
  ctx.fillText('Best:  ' + GameState.highScore + ' px', canvas.width / 2, 330);

  ctx.font = '16px monospace';
  ctx.fillText('Press ENTER to restart', canvas.width / 2, 390);

  ctx.textAlign = 'left';
}
```

### Pattern 9: Input for Screen Transitions

**What:** Replace the current directional-key triggers with Enter key for screen transitions. The existing `keys` map in input.js needs an `enter` field added.
**Why Enter instead of directional keys:** Directional keys cause the player to start moving immediately when the game starts, which feels wrong. Enter is the standard convention for "confirm / advance screen".

```javascript
// src/input.js — add to keydown/keyup handlers
// In addition to existing keys, add:
//   'Enter' → keys.enter = true/false

// src/main.js — update switch cases:
case GamePhase.START:
  if (keys.enter) resetGame();
  break;

case GamePhase.LEVEL_COMPLETE:
  if (keys.enter) startNextLevel();
  break;

case GamePhase.GAMEOVER:
  if (keys.enter) { GameState.phase = GamePhase.START; }
  break;
```

**Note:** `keys.enter` will remain `true` across frames until the key is released. This causes instant-pass-through if the LEVEL_COMPLETE screen appears while Enter is held from gameplay. Guard with a one-shot pattern if this becomes an issue in playtesting: clear `keys.enter = false` immediately after consuming the transition.

### Pattern 10: Visible Goal Line

**What:** Draw a horizontal line at `GameState.levelGoalY` in world space to show the player where the level ends (satisfies LEVEL-01 "visible height goal marker").
**Where:** In the world-space render pass (inside `ctx.save()` / `ctx.restore()`).

```javascript
// src/main.js — inside render(), after renderPlatforms()
if (GameState.phase === GamePhase.PLAYING && GameState.levelGoalY !== undefined) {
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth   = 3;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(0,           GameState.levelGoalY);
  ctx.lineTo(canvas.width, GameState.levelGoalY);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash
}
```

### Anti-Patterns to Avoid

- **Resetting lives in startNextLevel():** Lives must persist across levels. Only `resetGame()` resets to 3.
- **Infinite scroll platforms for a bounded level:** Generate all platforms upfront. Dynamic spawn-ahead is for infinite games (Doodle Jump). Soggy Moggy has a finite level goal.
- **Using `setTimeout` for crumble timer:** `setTimeout` is not governed by the game loop's pause/delta-time system. Use the `dt` accumulator in `updatePlatforms()` instead.
- **Reading localStorage without parseInt():** localStorage returns strings. `parseInt(value, 10)` is mandatory or score comparisons become string comparisons.
- **Drawing screens in world space:** All screen overlays must be drawn after `ctx.restore()` (screen space). Drawing inside `ctx.save()`/`ctx.restore()` will offset overlays by `cameraY`.
- **Leaving textAlign = center after screen render:** Reset `ctx.textAlign = 'left'` after each screen overlay to avoid breaking HUD score text.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text centering | Manual `x -= textWidth/2` calculation | `ctx.textAlign = 'center'` + `x = canvas.width/2` | Cleaner, no measureText needed, handles font changes |
| Persistent storage | Cookies, IndexedDB, URL params | `localStorage.setItem/getItem` | Simplest API for single numeric value; survives sessions |
| Platform type dispatch | if/else chains on type string | Direct `p.type` check at collision and render time | Only 2 types; full dispatch system is over-engineering |
| Level height formula | Dynamic "enough platforms" detection | `PLAYER_START_Y - LEVEL_HEIGHT_PX` as fixed goal Y | Deterministic; no ambiguity about what "complete" means |

**Key insight:** Everything in this phase is basic game logic over known APIs. The real complexity is bookkeeping (which state owns what, when to reset what). Organize that clearly first.

---

## Common Pitfalls

### Pitfall 1: Lives Reset on Level Complete
**What goes wrong:** `resetGame()` is called on level transition, resetting lives to 3 after every level.
**Why it happens:** `resetGame()` is the only reset function; the developer forgets to create `startNextLevel()`.
**How to avoid:** Create `startNextLevel()` before writing any level-complete logic. Never call `resetGame()` from the LEVEL_COMPLETE case.
**Warning signs:** Lives always shows 3 at the start of level 2 even after taking damage.

### Pitfall 2: Player Passes Through Goal Y Due to Camera Offset
**What goes wrong:** Goal detection checks `player.y <= levelGoalY` but the goal line visually appears at a different position.
**Why it happens:** `levelGoalY` is correct in world space, but a calculation error mixes screen space with world space.
**How to avoid:** `levelGoalY` is always a world Y value. Goal line is drawn inside `ctx.save()` (world space). Detection uses raw `player.y` (also world). Never adjust by `cameraY` in detection or drawing.
**Warning signs:** The goal line visually doesn't match where the level completes.

### Pitfall 3: Crumble Platforms Disappear Instantly
**What goes wrong:** The platform is removed on the same frame the player lands on it, before the visual crack appears.
**Why it happens:** `splice()` is called inside `checkPlatformCollisions()` instead of being deferred to `updatePlatforms()`.
**How to avoid:** Collision only sets `state = 'cracked'`. Removal only happens in `updatePlatforms()` after `crumbleTimer >= CRUMBLE_DELAY_MS`.
**Warning signs:** Crumbling platforms disappear with no visual crack; player occasionally falls through because the platform is removed before the bounce applies.

### Pitfall 4: Score Not Resetting Between Levels
**What goes wrong:** `GameState.score` and `GameState.maxHeightReached` carry over from level 1 into level 2, causing the score to start at a non-zero value.
**Why it happens:** `startNextLevel()` forgets to reset `maxHeightReached` to the sentinel value `9999`.
**How to avoid:** `startNextLevel()` must reset both `score = 0` and `maxHeightReached = 9999`. The sentinel `9999` is important: it lets the first `updateCamera()` frame capture the actual player start position.
**Warning signs:** Level 2 score starts above 0 immediately.

### Pitfall 5: localStorage String vs Number Comparison
**What goes wrong:** High score never updates because `"150" > 200` is `false` (string comparison in JavaScript under certain conditions), or `"150" + 50` gives `"15050"` instead of `200`.
**Why it happens:** `localStorage.getItem()` always returns a string. If not parsed, comparisons may behave unexpectedly.
**How to avoid:** Always `parseInt(localStorage.getItem(HS_KEY), 10)` with a fallback: `parseInt(...) || 0`.
**Warning signs:** High score stuck at 0 or displays "NaN".

### Pitfall 6: Enter Key Held Through Screen Transition
**What goes wrong:** Player presses Enter on LEVEL_COMPLETE screen; game immediately skips to next screen because `keys.enter` is still `true` on the next frame.
**Why it happens:** `keys.enter` remains true for all frames while Enter is held, not just the first frame.
**How to avoid:** After consuming `keys.enter` in the update switch, immediately set `keys.enter = false`. This simulates a "keypress" (one-shot) from a "keydown" (continuous) signal.
**Warning signs:** Screens flash by too fast to read when Enter is held.

### Pitfall 7: Platform Generation Produces Unreachable Gaps
**What goes wrong:** With `GAP_PX = 120` the math is safe, but if `GAP_PX` is increased to speed up testing, the player gets stuck.
**Why it happens:** 250px theoretical max is not the practical max. The `dt` timestep cap at 50ms and gravity mean slightly less than 250px is achievable on a slow tab.
**How to avoid:** Hard limit: `GAP_PX <= 200`. Recommended: `GAP_PX <= 140`. Test by playing through an entire level on a real browser.
**Warning signs:** Player jumps and falls back without reaching the next platform.

---

## Code Examples

### LocalStorage Read/Write (verified pattern from MDN)
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
const HS_KEY = 'soggymoggy_highscore';

// Read on startup
function loadHighScore() {
  try {
    const raw = localStorage.getItem(HS_KEY);
    GameState.highScore = raw !== null ? parseInt(raw, 10) : 0;
    if (isNaN(GameState.highScore)) GameState.highScore = 0;
  } catch (e) {
    GameState.highScore = 0;
  }
}

// Write when score improves
function saveHighScore(score) {
  if (score > GameState.highScore) {
    GameState.highScore = score;
    try {
      localStorage.setItem(HS_KEY, String(score));
    } catch (e) { /* silent */ }
  }
}
```

### Centered Text on Canvas (verified pattern from MDN)
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign
ctx.textAlign = 'center';
ctx.font      = '32px monospace';
ctx.fillText('SOGGY MOGGY', canvas.width / 2, 240);
// Restore after use:
ctx.textAlign = 'left';
```

### Crumble Platform Full Lifecycle
```javascript
// COLLISION (in checkPlatformCollisions):
if (overlapX && wasAbove && nowBelow && movingDown) {
  player.y  = p.y - player.h;
  player.vy = JUMP_VELOCITY;
  if (p.type === 'crumble' && p.state === 'intact') {
    p.state        = 'cracked';
    p.crumbleTimer = 0;
  }
}

// UPDATE (in updatePlatforms):
for (let i = platforms.length - 1; i >= 0; i--) {
  const p = platforms[i];
  if (p.type === 'crumble' && p.state === 'cracked') {
    p.crumbleTimer += dt * 1000;
    if (p.crumbleTimer >= 500) platforms.splice(i, 1);
  }
}

// RENDER (in renderPlatforms):
for (const p of platforms) {
  ctx.fillStyle = p.type === 'crumble'
    ? (p.state === 'cracked' ? '#e67e22' : '#e74c3c') // orange cracked, red intact
    : '#27ae60'; // green normal
  ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.w, p.h);
}
```

### Score Computation (existing formula, confirmed)
```javascript
// Height in pixels above the player's starting y position (528)
// maxHeightReached tracks minimum player.y seen (lower Y = higher in world)
const score = Math.max(0, 528 - GameState.maxHeightReached);
```

### Level Goal Field on GameState
```javascript
// Store in GameState so both platforms.js (writer) and main.js (reader) share it:
GameState.levelGoalY = undefined; // set by generateLevelPlatforms()
```

---

## State of the Art

| Old Approach (Phase 2) | Current Approach (Phase 3) | Impact |
|------------------------|---------------------------|--------|
| Single hardcoded platform | Upfront procedural generation per level | Full replayable level with guaranteed reachability |
| Three GamePhases | Four GamePhases (+ LEVEL_COMPLETE) | Clean level transition without page reload |
| No score display | Real-time height HUD + level/gameover screens | Satisfies LOOP-06, LOOP-07, LEVEL-02 |
| No persistence | localStorage high score | Survives browser close (SCRN-03) |
| Only directional keys start game | Enter key for screen transitions | Standard game UX convention |

---

## Open Questions

1. **Actual max jump height vs theoretical 250px**
   - What we know: JUMP_VELOCITY=700, GRAVITY=980 gives 250px theoretical. The 50ms dt cap and semi-fixed timestep may reduce this slightly.
   - What's unclear: The exact practical maximum under real browser conditions.
   - Recommendation: Use GAP_PX = 120 (48% of theoretical max). This is conservative enough to be safe. If playtesting shows the jumps feel too cramped, increase to max 160px.

2. **Level height scaling per level**
   - What we know: Level 1 needs to be completable in a reasonable play time; level 2 should be harder.
   - What's unclear: Exact pixel counts per level. Phase 4 (flood) will make later levels harder through water speed, not purely height.
   - Recommendation: Level height = `2000 + (level - 1) * 500` px. Level 1 = 2000px (~16 platforms at 120px gap), level 2 = 2500px (~20 platforms). Calibrate in playtesting.

3. **What happens when the player falls off the bottom during a level (Phase 3 vs Phase 4)**
   - What we know: Currently falls trigger GAMEOVER (Phase 2 stub). Phase 4 replaces this with a lives system.
   - What's unclear: In Phase 3 (before Phase 4), should a fall end the game or cost a life?
   - Recommendation: Keep the current GAMEOVER on fall for Phase 3. Phase 4 will replace that block with lives logic. Avoid premature lives implementation in Phase 3.

4. **CRUMBLE_CHANCE per level**
   - What we know: 25% crumbling platforms is a reasonable starting point.
   - What's unclear: Whether this should scale with level number.
   - Recommendation: Use a fixed 25% for Phase 3. Difficulty scaling through crumble rates is a Phase 4 concern.

---

## Sources

### Primary (HIGH confidence)
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage — localStorage API, type coercion gotcha, file:// behavior
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign — textAlign center pattern
- Project source code (`src/game-state.js`, `src/player.js`, `src/platforms.js`, `src/main.js`) — physics constants, existing patterns, height formula

### Secondary (MEDIUM confidence)
- https://codeheir.com/blog/2021/03/13/how-to-code-doodle-jump/ — Doodle Jump platform generation algorithm (gap-per-slot pattern), verified matches the straker gist implementation
- https://gist.github.com/straker/b96a4a68bd6d79cf75a833d98a2b654f — Minimal Doodle Jump implementation; confirmed platform spacing approach

### Tertiary (LOW confidence)
- MDN bugzilla reference (507361) — Firefox file:// localStorage confirmed broken; Chrome works but per-file-isolated. LOW because behavior is officially "undefined" and may change. Mitigated: deployment target is GitHub Pages (HTTPS), so production is unaffected.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all native browser APIs, no third-party dependencies; thoroughly documented by MDN
- Architecture patterns: HIGH — derived directly from existing codebase structure and physics constants
- Pitfalls: HIGH — derived from code analysis (existing patterns and confirmed MDN gotchas) plus community-verified issues
- Gap constraint formula: HIGH — calculated from JUMP_VELOCITY and GRAVITY constants in the actual source

**Research date:** 2026-03-06
**Valid until:** 2026-06-06 (stable browser APIs; 90 days)
