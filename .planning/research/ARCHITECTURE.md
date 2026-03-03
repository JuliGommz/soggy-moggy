# Architecture Patterns

**Domain:** Vanilla JS + HTML Canvas vertical platformer (Doodle Jump-style)
**Project:** Cat Flood Jumper
**Researched:** 2026-03-03
**Confidence:** HIGH — patterns sourced from MDN Game Development documentation (authoritative)

---

## Recommended Architecture

Cat Flood Jumper maps cleanly onto the canonical single-file or module-structured canvas game pattern. There is no framework — the architecture IS the code structure you define. The dominant pattern for a game this size is the **State-Machine + Game Loop + Entity Model**.

### High-Level Component Map

```
+----------------------------------------------------------+
|                        index.html                        |
|  <canvas id="gameCanvas"> + <script type="module">       |
+----------------------------------------------------------+
                             |
                             v
+----------------------------------------------------------+
|                         main.js                          |
|  Entry point: create canvas, init GameState, start loop  |
+----------------------------------------------------------+
                             |
              +--------------+---------------+
              |                              |
              v                              v
+---------------------+          +---------------------+
|     game-loop.js    |          |    input.js          |
|  requestAnimFrame   |          |  Keyboard listeners  |
|  update(dt)         |          |  InputState object   |
|  render(ctx)        |          +---------------------+
+---------------------+
              |
    +---------+----------+----------+-----------+
    |         |          |          |           |
    v         v          v          v           v
+-------+ +-------+ +--------+ +-------+ +-----+
|player | |platform| |water   | |projec | | ui  |
|.js    | |Manager | |.js     | |tiles  | |.js  |
|       | |.js     | |        | |.js    | |     |
+-------+ +-------+ +--------+ +-------+ +-----+
    |         |          |          |           |
    +---------+----------+----------+-----------+
                             |
                             v
+----------------------------------------------------------+
|                      game-state.js                       |
|  Single source of truth: score, lives, phase, camera Y  |
+----------------------------------------------------------+
```

---

## Component Boundaries

| Component | File (suggested) | Responsibility | What It Does NOT Do |
|-----------|-----------------|----------------|---------------------|
| **GameLoop** | `game-loop.js` | Drives `requestAnimationFrame`, calls `update(dt)` then `render(ctx)` each frame | Contains no game logic, no drawing |
| **GameState** | `game-state.js` | Holds all shared state: `score`, `lives`, `phase` (start/playing/paused/gameover), `cameraY` | Does not render, does not receive input |
| **InputHandler** | `input.js` | Listens to `keydown`/`keyup`, exposes a plain object `{ left, right, shoot }` | Does not modify player directly |
| **Player** | `player.js` | Position, velocity, jump logic, lives management, sprite draw | Does not generate platforms, does not track score |
| **PlatformManager** | `platform-manager.js` | Spawns, pools, and culls platforms; checks player-platform collision | Does not know about water |
| **Water** | `water.js` | Tracks rising flood Y position, accelerates over time, draws wave | Does not know about player lives |
| **Projectile / ThrowManager** | `throw-manager.js` | Spawns thrown objects on input, updates their position, checks for hits | Does not directly damage the player |
| **UI** | `ui.js` | Draws HUD (score, lives, water level indicator), start screen, game-over screen | Does not contain game logic |
| **Camera** | inline in `GameState` or `camera.js` | Translates world Y to canvas Y; `cameraY` is the only value needed | Separate class only if viewport gets complex |

---

## Game Loop Pattern

Source: MDN "Anatomy of a video game" (developer.mozilla.org/en-US/docs/Games/Anatomy) — HIGH confidence.

### Pattern: Per-Frame with Delta Time

```javascript
// game-loop.js
let lastTimestamp = 0;

function gameLoop(timestamp) {
  const dt = timestamp - lastTimestamp; // milliseconds since last frame
  lastTimestamp = timestamp;

  update(dt);   // advance simulation
  render();     // draw current state

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

**Why delta time (dt) matters:** On a 60 Hz screen, dt ≈ 16.6 ms. On a 120 Hz screen, dt ≈ 8.3 ms. Without dt, the game runs twice as fast on a 120 Hz monitor. Multiply all velocity and acceleration values by `dt / 1000` (to convert to seconds) or by a normalized factor.

### Stopping the Loop

```javascript
let rafId;

function startLoop() {
  rafId = requestAnimationFrame(gameLoop);
}

function stopLoop() {
  cancelAnimationFrame(rafId);
}
```

Use `stopLoop()` for game-over, pause, and tab-hidden events.

---

## Data Flow

How state moves through the system each frame:

```
Input events (keyboard)
        |
        v
InputHandler.state = { left: bool, right: bool, shoot: bool }
        |
        v
update(dt) called by GameLoop
  |
  +---> Player.update(dt, InputHandler.state)
  |       reads: inputState
  |       writes: player.x, player.y, player.vy
  |       reads: platformList (for collision result)
  |
  +---> PlatformManager.update(dt, player.y, cameraY)
  |       writes: platformList (spawn/cull)
  |       returns: didPlayerLand (collision result to player)
  |
  +---> Water.update(dt)
  |       writes: water.y
  |       checks: player.y vs water.y → if overlap, GameState.lives -= 1
  |
  +---> ThrowManager.update(dt, InputHandler.state)
  |       writes: projectileList
  |       checks: projectile vs platform/water collision (visual effect)
  |
  +---> GameState.update()
          reads: player.y → update score (cameraY max height)
          reads: lives → check game-over condition
          writes: phase if game-over triggered
        |
        v
render(ctx) called by GameLoop
  |
  +---> ctx.clearRect(0, 0, W, H)
  |
  +---> ctx.save() → ctx.translate(0, -cameraY) [apply camera offset]
  |
  +---> PlatformManager.render(ctx)
  +---> Water.render(ctx)
  +---> ThrowManager.render(ctx)
  +---> Player.render(ctx)
  |
  +---> ctx.restore() [undo camera offset]
  |
  +---> UI.render(ctx, GameState) [HUD drawn in screen space, no offset]
```

**Key principle:** The camera offset (`ctx.translate`) is applied before drawing world objects and removed before drawing UI. This means the HUD always stays fixed on screen.

---

## Camera (Scroll) System

This is the most game-specific architectural decision. For a vertical platformer:

```javascript
// In GameState or Camera:
// cameraY = world Y coordinate of the top of the screen

function updateCamera(playerY) {
  const scrollThreshold = canvas.height * 0.4; // player triggers scroll at 40% from top
  if (playerY < cameraY + scrollThreshold) {
    cameraY = playerY - scrollThreshold;
  }
  // camera only scrolls UP, never down
}
```

Then in render:
```javascript
ctx.save();
ctx.translate(0, -cameraY); // shift entire world down by cameraY pixels
// ... draw all world objects in world coordinates ...
ctx.restore();
```

Platform Y coordinates and water Y are stored in **world space**. The camera transform converts them to screen space at render time. This keeps all game logic simple — no coordinate conversion needed in update().

---

## State Management

### Game Phase State Machine

```
         +--------+
         |  START |  (show title screen)
         +--------+
              |  (keypress)
              v
         +--------+
         | PLAYING |  (main loop active)
         +--------+
           |     |
   (lives=0)     (pause key)
           v     v
      +-------+ +--------+
      |GAMEOVER| | PAUSED |
      +-------+ +--------+
           |          |
    (restart)    (resume)
           v          v
         +--------+
         |  START |
         +--------+
```

Implementation:

```javascript
// game-state.js
const GameState = {
  phase: 'start',   // 'start' | 'playing' | 'paused' | 'gameover'
  score: 0,
  lives: 3,
  cameraY: 0,
  maxHeightReached: 0,
};
```

No library needed. A plain object with a `phase` string is the correct pattern at this scale.

---

## Platform Generation Pattern

Doodle Jump-style procedural generation is not complex — it is random within constraints:

```javascript
// platform-manager.js
function spawnPlatform(aboveY) {
  return {
    x: Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
    y: aboveY - GAP_MIN - Math.random() * GAP_RANGE,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
  };
}
```

**Object pooling** (reusing platform objects instead of creating new ones every frame) is the correct optimization. Platforms that scroll below the camera's bottom edge are marked inactive and reused for the next spawn above. For a school project at this scale, even simple array splice is acceptable — only pool if profiling shows frame drops.

---

## Collision Detection

Source: MDN "2D Collision Detection" (developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection) — HIGH confidence.

Use **AABB (Axis-Aligned Bounding Box)** for all collisions. Cat is a rectangle, platforms are rectangles, water is a horizontal line.

```javascript
// AABB collision
function intersects(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width > b.x  &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
```

**Platform landing check (one-way platforms):**

```javascript
// Only land if falling downward AND feet were above platform top last frame
const playerBottom = player.y + player.height;
const prevPlayerBottom = playerBottom - player.vy * dt;

if (
  player.vy > 0 &&                          // moving downward
  prevPlayerBottom <= platform.y &&          // was above platform
  playerBottom >= platform.y &&              // now crossing platform top
  player.x + player.width > platform.x &&   // horizontal overlap
  player.x < platform.x + platform.width
) {
  player.y = platform.y - player.height;
  player.vy = -JUMP_FORCE;                  // auto-jump
}
```

This one-way platform logic is the single most error-prone collision case. Get this right before everything else.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Variables for Game State
**What:** `var playerX = 0; var playerY = 0;` scattered at the top of one massive file.
**Why bad:** Impossible to track which function mutated which variable. Breaks the moment the game grows.
**Instead:** One `GameState` object, passed explicitly to functions that need it.

### Anti-Pattern 2: Drawing Inside Update Logic
**What:** Calling `ctx.fillRect()` inside `player.update()`.
**Why bad:** Couples simulation and rendering — you can't run update faster than render, can't pause render, can't serialize state.
**Instead:** Strict separation: `update()` mutates state only, `render()` reads state and draws only.

### Anti-Pattern 3: No Camera Transform — Manual Offset Everywhere
**What:** Every `drawImage()` call does `ctx.drawImage(img, x - cameraY, ...)` manually.
**Why bad:** Every new object requires remembering to subtract cameraY. One missed subtraction = visual glitch.
**Instead:** One `ctx.translate(0, -cameraY)` in the render function, then all world objects draw at their natural coordinates.

### Anti-Pattern 4: Spawning New Objects Every Frame Without Pooling
**What:** `platforms.push(new Platform(...))` in the update loop, then `platforms = platforms.filter(...)` to remove offscreen ones.
**Why bad:** Creates garbage for the JS engine every frame. On mobile / low-end devices this causes frame drops.
**Instead:** Object pool — a fixed array of platform objects, toggle `.active` flag, reset properties on reuse.

### Anti-Pattern 5: Skipping Delta Time
**What:** `player.y -= JUMP_SPEED;` with no dt multiplication.
**Why bad:** Game speed depends on hardware frame rate. 120 Hz screen = twice the speed.
**Instead:** `player.vy -= JUMP_ACCEL * dt;` where dt is in seconds.

---

## Build Order (Dependency Graph)

Build in this exact order — each layer depends only on what is below it.

```
Layer 1 (no dependencies):
  [1] Canvas setup + game loop skeleton (requestAnimationFrame, update/render stubs)
  [1] InputHandler (keydown/keyup listeners, plain state object)
  [1] GameState object (phase, score, lives, cameraY)

Layer 2 (depends on Layer 1):
  [2] Player (position, velocity, gravity, draw as rectangle)
  [2] Platform (single platform, draw as rectangle)

Layer 3 (depends on Layer 2):
  [3] PlatformManager (spawn, cull, AABB collision with Player)
  [3] Camera scroll (cameraY update based on player.y)

Layer 4 (depends on Layer 3):
  [4] Water (rises over time, damage on contact with Player)
  [4] Score (track maxHeightReached from cameraY)
  [4] Lives system (subtract on water contact, trigger game-over)

Layer 5 (depends on Layer 4):
  [5] ThrowManager + Projectile (spawn on input, movement, collision)
  [5] UI / HUD (score display, lives display, water warning)

Layer 6 (depends on Layer 5):
  [6] Start screen and Game Over screen (phase-based rendering in UI)
  [6] Visual polish (sprites replacing rectangles, particle effects)
```

**Critical path:** Layers 1-4 constitute the minimal playable game. If time is short, Layers 5-6 can be cut to Layer 5 minimal (just basic UI) with throw mechanic as a bonus.

---

## File Structure

```
/
├── index.html              # Canvas element, loads main.js
├── main.js                 # Entry point: init, start loop
├── game-loop.js            # requestAnimationFrame driver
├── game-state.js           # Shared state object
├── input.js                # Keyboard input handler
├── player.js               # Player entity
├── platform-manager.js     # Platform pool + collision
├── water.js                # Rising water entity
├── throw-manager.js        # Projectile system
├── ui.js                   # HUD + screens
└── assets/
    ├── cat-sprite.png
    └── platform-sprite.png
```

No build toolchain needed. Load with `<script type="module" src="main.js">` and `import` between files. Works directly in any modern browser, no server needed for local testing (except for module CORS — use a local dev server like `npx serve .` or VS Code Live Server).

---

## Scalability Notes

This is a school project — over-engineering is an explicit anti-goal. The architecture above is intentionally minimal.

| Concern | At this scope (1 player, solo project) |
|---------|----------------------------------------|
| Performance | AABB collision + simple platformManager array is fine |
| State complexity | Plain object GameState, no Redux/signal library needed |
| Code splitting | ES modules via `import/export` — no bundler needed |
| Persistence | None — no localStorage until leaderboard feature requested |

---

## Sources

- MDN "Anatomy of a Video Game" — https://developer.mozilla.org/en-US/docs/Games/Anatomy (HIGH confidence)
- MDN "2D Collision Detection" — https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection (HIGH confidence)
- MDN "Advanced Animations" (Canvas API tutorial) — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Advanced_animations (HIGH confidence)
- MDN "requestAnimationFrame" — https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame (HIGH confidence)
