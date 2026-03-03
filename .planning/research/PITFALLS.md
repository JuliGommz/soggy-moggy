# Domain Pitfalls: JS Canvas Vertical Platformer

**Domain:** Browser-based vanilla JS + HTML Canvas vertical platformer (Doodle Jump style)
**Project:** Cat Flood Jumper
**Researched:** 2026-03-03
**Overall Confidence:** HIGH — all critical pitfalls sourced from MDN official documentation

---

## Critical Pitfalls

Mistakes that cause rewrites, game-breaking bugs, or failed submissions.

---

### Pitfall 1: Frame-Rate-Dependent Physics (No Delta Time)

**What goes wrong:**
Physics and movement are hardcoded to assume 60 FPS. The game runs fine on the developer's machine, then runs 2x faster on a 120 Hz monitor and 0.5x slower on a throttled laptop. The cat floats, platforms scroll at wrong speeds, water rises at wrong rate.

**Why it happens:**
Beginner pattern is `player.y -= 5` every frame. At 60 FPS this is 300px/s. At 120 FPS it is 600px/s. Nothing uses actual elapsed time.

**Consequences:**
- Game is physically broken on any non-60 Hz display
- Water rise speed is inconsistent — difficulty becomes unpredictable
- Cannot fix after the fact without touching every movement value

**Prevention:**
Calculate delta time every frame and multiply all velocities by it.
```javascript
let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  player.y -= player.velocityY * deltaTime;
  water.y -= water.riseSpeed * deltaTime;

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

**Cap delta time to prevent physics explosions after tab switch:**
```javascript
const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05); // max 50ms
```

**Warning signs:**
- You write `player.x += 3` without any time factor
- Gravity is a constant like `velocityY += 0.5` per frame with no `* deltaTime`
- Game speed changes when you plug in a second monitor

**Phase:** Address in Phase 1 (game loop setup). Retrofitting this later touches every moving object.

**Source:** MDN - Anatomy of a Video Game (HIGH confidence)

---

### Pitfall 2: Tab-Switch Delta Time Spike Causes Physics Explosion

**What goes wrong:**
Player switches to another tab, comes back 30 seconds later. The next `requestAnimationFrame` callback reports a delta of 30,000ms. Multiplying any velocity by 30 seconds of physics causes the cat and all objects to teleport off-screen or through platforms.

**Why it happens:**
`requestAnimationFrame` slows/pauses when the tab is inactive. MDN explicitly states: "your loop may stop execution for significant periods of time" when the user switches tabs.

**Consequences:**
- Player returns and the game is in a broken, unrecoverable state
- Objects tunnel through boundaries
- Water instantly fills the screen

**Prevention:**
Cap delta time hard — do not simulate more than ~3-4 frames of catch-up at once:
```javascript
const MAX_DELTA = 1 / 20; // Never simulate more than 50ms (3 frames at 60fps)
const rawDelta = (timestamp - lastTime) / 1000;
const deltaTime = Math.min(rawDelta, MAX_DELTA);
lastTime = timestamp;
```

Alternatively, treat large deltas as a pause: if `rawDelta > 0.5` (500ms), skip the update and just render.

**Warning signs:**
- Alt-Tab away during testing and the game state is broken on return
- No `Math.min` on your delta time calculation

**Phase:** Phase 1 (game loop setup), same session as delta time implementation.

**Source:** MDN - Anatomy of a Video Game (HIGH confidence)

---

### Pitfall 3: One-Way Platform Collision Resolved From All Sides

**What goes wrong:**
The AABB collision check fires when the player overlaps a platform from any direction — including from below and from the sides. The cat gets stuck on platform edges, cannot pass through platforms from below (which is required for Doodle Jump mechanics), and vibrates or snaps when brushing a platform's side.

**Why it happens:**
A simple AABB overlap check does not distinguish which face was penetrated. Many tutorials stop at "are they overlapping" without resolving which side the collision came from.

**Consequences:**
- The core jump mechanic breaks entirely — you cannot pass through platforms upward
- Player gets snagged on platform corners
- Collision resolution pushes the player in the wrong direction

**Prevention:**
For Doodle Jump-style mechanics, platforms must be one-way (passable from below, solid only from above). The check must be directional:

```javascript
function checkPlatformLanding(player, platform) {
  const playerBottom = player.y + player.height;
  const playerPrevBottom = playerBottom - player.velocityY * deltaTime;

  const horizontalOverlap =
    player.x < platform.x + platform.width &&
    player.x + player.width > platform.x;

  const crossedTopThisFrame =
    playerPrevBottom <= platform.y &&
    playerBottom >= platform.y;

  if (horizontalOverlap && crossedTopThisFrame && player.velocityY > 0) {
    player.y = platform.y - player.height;
    player.velocityY = -player.jumpForce; // auto-jump on landing
  }
}
```

Key conditions:
1. Horizontal overlap exists
2. Player was ABOVE the platform top last frame (previous bottom <= platform top)
3. Player is moving DOWNWARD (`velocityY > 0` in canvas where Y increases downward)

**Warning signs:**
- Player sticks to the side of platforms
- Player cannot fall through a platform from below
- Jitter or snapping when touching a platform corner

**Phase:** Phase 2 (core mechanics). Must be correct before adding procedural generation.

**Source:** MDN - 2D Collision Detection (HIGH confidence for AABB); directional resolution is standard platformer pattern (MEDIUM confidence — well-established but not from a single MDN source)

---

### Pitfall 4: Camera/Scroll Coordinate System Mismatch

**What goes wrong:**
A vertical scroller needs a camera offset. Game objects are stored in "world coordinates" (absolute position in the infinite vertical world), but they must be drawn in "screen coordinates" (relative to the camera). Forgetting to subtract the camera offset when drawing causes objects to be drawn in wrong positions or to not move as the player rises.

A secondary mistake is applying the camera offset inconsistently — applying it to the player but not to platforms, or vice versa.

**Why it happens:**
Mixing world-space and screen-space coordinates without a clear rule. A common shortcut is to use `ctx.translate(0, -cameraY)` but then forget to call `ctx.save()` / `ctx.restore()`, leaving the transform dirty for subsequent draw calls.

**Consequences:**
- Platforms stop scrolling while the player moves
- Collision detection uses world coordinates but drawing uses screen coordinates — the visual and the hitbox diverge
- Water level appears at the wrong visual position

**Prevention:**
Establish one clear rule and apply it everywhere. Two valid approaches:

**Option A: Manual offset (explicit, easy to debug)**
```javascript
// Everything stored in world coords. Draw by subtracting camera.
function draw(ctx, cameraY) {
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);
  });
  ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);
  // Water: water.y is world coord, same rule applies
  ctx.fillRect(0, water.y - cameraY, canvas.width, canvas.height);
}
```

**Option B: ctx.translate (clean, but requires save/restore)**
```javascript
function draw(ctx, cameraY) {
  ctx.save();
  ctx.translate(0, -cameraY);
  // Draw everything in world coords — transform handles conversion
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
  ctx.restore();
  // UI elements (score, lives) drawn AFTER restore — they are in screen space
}
```

Camera target: keep player at ~40% from the top, only scroll up (never down):
```javascript
cameraY = Math.min(cameraY, player.y - canvas.height * 0.4);
```

**Warning signs:**
- Player and platforms are offset from each other visually but collisions work fine (or vice versa)
- UI score text scrolls with the world instead of staying fixed
- Water visual and water hitbox appear at different heights

**Phase:** Phase 2 (scrolling + camera). Must be established before any procedural generation is tested.

**Source:** MDN - Canvas API, ctx.translate, ctx.save/restore (HIGH confidence); camera-follow pattern is well-established (MEDIUM confidence)

---

### Pitfall 5: Canvas Sizing via CSS Instead of HTML Attributes

**What goes wrong:**
Developer sets canvas size with CSS (`canvas { width: 400px; height: 600px; }`). The canvas internal drawing buffer stays at the default 300x150. All game logic runs in 300x150 coordinate space, but the canvas is visually displayed at 400x600 — stretched and blurry.

**Why it happens:**
CSS sizing and canvas attribute sizing are two different things. MDN states explicitly: "The displayed size of the canvas can be changed using CSS, but the image is scaled during rendering to fit the styled size, which can make the final graphics rendering end up being distorted."

**Consequences:**
- Blurry, stretched rendering
- Mouse/input coordinates do not map to game coordinates (clicks are offset)
- Sub-pixel anti-aliasing makes pixel art look wrong

**Prevention:**
Always set canvas size via HTML attributes or JavaScript properties — never CSS dimensions for the drawing buffer:
```javascript
const canvas = document.getElementById('gameCanvas');
canvas.width = 400;   // drawing buffer width
canvas.height = 600;  // drawing buffer height
// CSS can control display size: canvas.style.width = '400px'; only if matching
```

For HiDPI / Retina displays (optional, polish-phase only):
```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = 400 * dpr;
canvas.height = 600 * dpr;
ctx.scale(dpr, dpr);
canvas.style.width = '400px';
canvas.style.height = '600px';
```

**Warning signs:**
- Canvas looks blurry or stretched
- Clicking on a game object misses by a consistent offset
- `canvas.width` is 300 (the default) even though you set size in CSS

**Phase:** Phase 1 (project setup). This is a one-line fix but catastrophic if discovered late.

**Source:** MDN - HTML Canvas Element (HIGH confidence)

---

### Pitfall 6: clearRect Missing or Incomplete Each Frame

**What goes wrong:**
Developer forgets to clear the canvas before drawing each frame, or only clears part of it. Previous frame's graphics pile up — a classic "ghosting" trail behind the player. In some cases the game logic runs correctly but visually the canvas accumulates every drawn frame.

**Why it happens:**
Canvas is a retained bitmap. Unlike the DOM, nothing "redraws automatically." Every draw call adds pixels on top of whatever was there before.

**Consequences:**
- Every object leaves a visual trail
- The game appears broken or haunted even if logic is correct
- Score text renders over itself and becomes unreadable

**Prevention:**
Always clear at the start of every frame draw:
```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ... draw everything
}
```

Alternative for opaque backgrounds:
```javascript
ctx.fillStyle = '#87CEEB'; // sky blue
ctx.fillRect(0, 0, canvas.width, canvas.height); // replaces clearRect + background draw
```

**Warning signs:**
- Visual trails behind moving objects
- Text renders darker/bolder each frame as it writes over itself

**Phase:** Phase 1 (game loop). Caught immediately in first test if you render anything.

**Source:** MDN - Canvas API (HIGH confidence)

---

### Pitfall 7: Context State Leaking Between Draw Calls (save/restore)

**What goes wrong:**
One draw function sets `ctx.fillStyle = 'red'` or `ctx.globalAlpha = 0.5` and does not reset it. The next draw function inherits that state. Colors and opacity bleed between objects unpredictably. More serious: calling `ctx.translate()` or `ctx.rotate()` without `ctx.restore()` shifts the entire coordinate system for all subsequent draws.

**Why it happens:**
Canvas context is a global state machine. Every `ctx.fillStyle`, `ctx.translate()`, `ctx.rotate()`, `ctx.scale()` persists until changed. Beginners treat each draw call as isolated when it is not.

**Consequences:**
- Random color/opacity bleeds between game objects
- Coordinate system drifts after translated draws (e.g. drawing a rotated throwing object shifts all subsequent platform positions)
- Bug is extremely hard to trace because the symptom appears far from the cause

**Prevention:**
Wrap any draw function that modifies context state with `save()` / `restore()`:
```javascript
function drawCat(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(catSprite, -catSprite.width / 2, -catSprite.height / 2);
  ctx.restore(); // coordinate system and state reset to before save()
}
```

Rule of thumb: if a function calls `translate`, `rotate`, `scale`, `globalAlpha`, or `globalCompositeOperation` — it must call `save()` at start and `restore()` at end.

**Warning signs:**
- Objects appear progressively offset in a direction
- Color/alpha changes on objects that should not change
- Bug disappears when you comment out an unrelated drawing function

**Phase:** Phase 1-2 (any rendering). Apply as a coding habit from day one.

**Source:** MDN - Canvas API, ctx.save/restore (HIGH confidence)

---

## Moderate Pitfalls

---

### Pitfall 8: Asset Images Used Before They Finish Loading

**What goes wrong:**
Code creates an `Image` object and immediately calls `ctx.drawImage()` on it. The image has not loaded yet — nothing renders, or a broken image error fires silently. The game appears to work but all sprites are invisible.

**Why it happens:**
`new Image(); img.src = '...'` is asynchronous. The image is not available the moment `src` is set.

**Consequences:**
- Sprites are invisible on first load
- `drawImage` on unloaded image throws a DOM error in some browsers
- Bug only appears on first load; subsequent loads may use cached image (masking the problem)

**Prevention:**
Load all assets before starting the game loop. Use a promise-based loader or a counter:
```javascript
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

async function init() {
  const [catImg, platformImg] = await Promise.all([
    loadImage('assets/cat.png'),
    loadImage('assets/platform.png'),
  ]);
  // Assets ready — start game loop
  requestAnimationFrame(gameLoop);
}

init();
```

**Warning signs:**
- Sprites flicker or disappear on first page load
- Works fine after a hard refresh (cache hit)
- `ctx.drawImage` errors in the console on first load

**Phase:** Phase 1 (project setup / asset pipeline). Build the loader before any sprites are added.

**Source:** MDN - Web APIs (MEDIUM confidence — standard async pattern, well-established)

---

### Pitfall 9: Procedural Platform Generation Creates Unreachable Gaps

**What goes wrong:**
Platforms are generated randomly with gaps that are too wide for the cat's jump arc. The player always falls and hits the water — not due to skill failure but due to impossible level geometry. In a Doodle Jump-style game, the player must always be able to progress upward.

**Why it happens:**
Random placement without constraining to the player's maximum jump height. A gap of 300px may be fine at one horizontal position but unreachable at another.

**Consequences:**
- Game becomes unwinnable regardless of player skill
- Tester/grader assumes the game is broken
- Hard to detect because it is probabilistic — might not manifest every run

**Prevention:**
Constrain platform generation to guaranteed-reachable spacing:
```javascript
const MAX_JUMP_HEIGHT = 180; // pixels — calibrate from actual jump arc
const MAX_PLATFORM_GAP = MAX_JUMP_HEIGHT * 0.85; // 15% safety margin

function generateNextPlatform(lastPlatform) {
  const gapY = Math.random() * MAX_PLATFORM_GAP + 60; // min 60px, max ~213px
  const newY = lastPlatform.y - gapY; // platforms stack upward in world coords
  const newX = Math.random() * (canvas.width - PLATFORM_WIDTH);
  return { x: newX, y: newY, width: PLATFORM_WIDTH, height: 12 };
}
```

Test with the following: play through 3 minutes without touching left/right — can the cat reach each platform by jumping straight? If not, reduce `MAX_PLATFORM_GAP`.

**Warning signs:**
- Occasional runs where the player falls immediately after spawning
- Gaps that visually look wider than others in the same run
- Tester reports "sometimes it's impossible"

**Phase:** Phase 3 (procedural generation). Verify gap constraints with debug visualization before integrating.

**Source:** Doodle Jump design analysis — MEDIUM confidence (well-documented pattern in similar games)

---

### Pitfall 10: Web Audio API Blocked by Autoplay Policy

**What goes wrong:**
Developer creates an `AudioContext` on page load and tries to play sounds. Browser blocks audio with "AudioContext was not allowed to start" because no user gesture has occurred yet. All sounds are silently suppressed. The grader demos the game and there is no audio.

**Why it happens:**
Modern browsers (Chrome, Firefox, Safari) enforce an autoplay policy: audio can only play after a user interaction (click, keypress, etc.). MDN states: "An AudioContext that has been created outside of a user gesture will start in a suspended state."

**Consequences:**
- All sound effects and music are muted
- `AudioContext.state` is `"suspended"` — sounds play into a void
- No visible error to the developer if they do not check state

**Prevention:**
Initialize or resume AudioContext on the first user interaction:
```javascript
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Attach to start button click or any first keypress
document.getElementById('startButton').addEventListener('click', () => {
  initAudio();
  startGame();
});
```

Alternatively, prime audio on the start screen — the player clicking "Play" counts as a user gesture and satisfies the policy for the rest of the session.

**Warning signs:**
- `audioCtx.state` logs as `"suspended"` on game start
- Sounds work when tested via browser DevTools console but not in normal play
- No audio after page load, but audio works if you interact with something first

**Phase:** Phase 4 (audio). Must be gated behind the start screen button click, not page load.

**Source:** MDN - Web Audio API Best Practices (HIGH confidence)

---

### Pitfall 11: Score and Lives Display Scrolling With the World

**What goes wrong:**
Score text and lives display are drawn using world coordinates and move off-screen or scroll with platforms as the camera moves. The HUD becomes invisible or drifts to an unreachable part of the canvas.

**Why it happens:**
All drawing is done inside a `ctx.translate(0, -cameraY)` block. UI elements are accidentally included in the transformed context.

**Consequences:**
- Score is invisible during play
- Lives indicator disappears as the camera moves

**Prevention:**
Draw UI elements outside the camera transform — after `ctx.restore()`:
```javascript
function draw() {
  ctx.save();
  ctx.translate(0, -cameraY);
  drawPlatforms();
  drawPlayer();
  drawWater();
  ctx.restore();

  // UI drawn in screen space — not affected by camera
  drawHUD(score, lives);
}

function drawHUD(score, lives) {
  ctx.fillStyle = 'white';
  ctx.font = '20px monospace';
  ctx.fillText(`Score: ${score}`, 10, 30);   // always top-left of canvas
  ctx.fillText(`Lives: ${lives}`, 10, 55);
}
```

**Warning signs:**
- Score text is visible at game start but scrolls off the top as the player rises
- Lives counter disappears after the first few platforms

**Phase:** Phase 2 (camera + rendering). A two-minute fix once the camera system is in place.

**Source:** MDN - Canvas API, ctx.translate (HIGH confidence — logical consequence of camera transform)

---

## Minor Pitfalls

---

### Pitfall 12: Float Coordinates Causing Sub-Pixel Blurriness

**What goes wrong:**
Platform and sprite positions are stored as floats (e.g. `x = 102.7`, `y = 341.3`). Canvas renders sub-pixel anti-aliasing, making crisp pixel art look blurry or slightly smeared.

**Prevention:**
Use `Math.floor()` when calling `drawImage` or `fillRect`:
```javascript
ctx.drawImage(sprite, Math.floor(x), Math.floor(y));
ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
```

Or snap positions on update: `player.x = Math.round(player.x)`.

**Warning signs:**
- Sprites look slightly blurry at normal scale
- Crisp at 1:1 zoom but blurry when CSS scales the canvas

**Phase:** Phase 2-3. Low priority; fix in polish pass.

**Source:** MDN - Optimizing Canvas (HIGH confidence)

---

### Pitfall 13: Input Handling Fires Multiple Times Per Keypress

**What goes wrong:**
`keydown` events fire repeatedly while a key is held (key repeat). If movement is driven by the `keydown` event directly, the player moves in bursts tied to OS key repeat rate rather than frame rate. Worse: throwing objects on `keydown` fires multiple throws per single press.

**Prevention:**
Track key state with a boolean map, not direct event → action:
```javascript
const keys = {};

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// In game loop:
if (keys['ArrowLeft']) player.x -= speed * deltaTime;
if (keys['ArrowRight']) player.x += speed * deltaTime;

// For throw — single action, use a flag:
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.repeat) throwObject();
});
```

**Warning signs:**
- Player stutters when moving left/right at OS key repeat speed
- Throw mechanic fires a burst of projectiles from one keypress

**Phase:** Phase 2 (input system). Set up the key-state map at the start.

**Source:** Standard browser input pattern (MEDIUM confidence — well-established pattern, not from a single canonical source)

---

### Pitfall 14: No Game State Machine — Impossible to Restart

**What goes wrong:**
Game logic is not separated into states (MENU, PLAYING, GAME_OVER, PAUSED). Everything runs in one flat loop. When the player dies, resetting the game requires reloading the page (`location.reload()`) because there is no clean state reset. The game loop may also continue running during the GAME_OVER screen, advancing the water and platforms invisibly.

**Prevention:**
Define explicit states from the start:
```javascript
const STATE = { MENU: 'menu', PLAYING: 'playing', GAME_OVER: 'gameover' };
let gameState = STATE.MENU;

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  switch (gameState) {
    case STATE.MENU: updateMenu(); drawMenu(); break;
    case STATE.PLAYING: update(timestamp); draw(); break;
    case STATE.GAME_OVER: drawGameOver(); break;
  }
}

function resetGame() {
  player = createPlayer();
  platforms = generateInitialPlatforms();
  water = createWater();
  score = 0;
  gameState = STATE.PLAYING;
}
```

**Warning signs:**
- Restarting the game requires `F5`
- Water continues to rise on the game over screen
- Score carries over from previous run

**Phase:** Phase 1 (architecture). Define states before writing any game logic. Adding state machine later requires touching every conditional.

**Source:** Game Programming Patterns (MEDIUM confidence — universal pattern, well-documented)

---

### Pitfall 15: Scope Creep Consuming Submission Time

**What goes wrong:**
Extra features (particle effects, multiple platform types, sound variety, high-score persistence, mobile controls) are added before the core loop is stable. Time runs out before the submission deadline. The submitted game has broken or incomplete core mechanics plus half-finished extras.

**Why it happens:**
Adding features feels like progress. Polishing a working game feels boring. Student projects especially suffer from this because the core loop is validated late.

**Consequences:**
- Core gameplay (cat jumps, water rises, game over) is buggy at submission
- Lives system or throw mechanic not functional
- Hosted URL works but game is not completable

**Prevention:**
Define a locked MVP state in the project requirements and enforce it.

Current MVP per `PROJECT.md`:
1. Cat auto-jumps on platform contact
2. Platforms scroll upward procedurally
3. Water rises from below
4. Lives system — water contact loses a life
5. Throw mechanic with any effect
6. Score display
7. Game over screen
8. Start screen
9. Hosted URL

Do not add any feature outside this list until all 9 items are implemented and testable. Mark scope-creep ideas in a `NICE_TO_HAVE.md` file and do not open that file until submission is 3+ days away.

**Warning signs:**
- Working on particle effects before the water mechanic is implemented
- "Let me just add one more platform type before testing the lives system"
- The game has not been played start-to-finish as a complete loop

**Phase:** All phases. This is a discipline issue, not a technical one. Roadmap phases should each end with a playable, tested milestone.

**Source:** Project.md requirements (HIGH confidence — derived from stated scope constraints)

---

## Phase-Specific Warning Map

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Game loop setup | No delta time → frame-rate-dependent physics | Add delta time from first frame |
| Phase 1 | Game loop setup | Tab-switch causes physics explosion | Cap delta time at 50ms max |
| Phase 1 | Canvas setup | CSS sizing distortion | Set `canvas.width` / `canvas.height` via attributes |
| Phase 1 | Asset loading | Images not loaded before game start | Promise-based asset loader before `requestAnimationFrame` |
| Phase 1 | Architecture | No state machine → cannot restart | Define STATE enum before writing game logic |
| Phase 2 | Collision | All-direction collision breaks one-way platforms | Directional collision: only resolve landing from above |
| Phase 2 | Camera | World/screen coordinate mismatch | Pick one approach (manual offset or translate) and be consistent |
| Phase 2 | Camera | HUD scrolls with world | Draw UI after `ctx.restore()` |
| Phase 2 | Rendering | clearRect missing | First line of draw() must be clearRect |
| Phase 2 | Rendering | Context state leaks | save()/restore() on any function using translate/rotate/alpha |
| Phase 2 | Input | Key repeat causes multi-throw | Use key-state map + `e.repeat` guard |
| Phase 3 | Platforms | Unreachable gaps | Constrain generation to `< MAX_JUMP_HEIGHT * 0.85` |
| Phase 4 | Audio | AudioContext suspended | Init audio on start button click, not page load |
| All | Scope | Core loop never finished | Lock MVP list; no extras until all 9 items are playable |

---

## Sources

- MDN - Anatomy of a Video Game: https://developer.mozilla.org/en-US/docs/Games/Anatomy (HIGH confidence)
- MDN - 2D Collision Detection: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection (HIGH confidence)
- MDN - Optimizing Canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas (HIGH confidence)
- MDN - HTML Canvas Element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas (HIGH confidence)
- MDN - Web Audio API Best Practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices (HIGH confidence)
- MDN - Audio for Web Games: https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games (HIGH confidence)
- Project context: `.planning/PROJECT.md` (HIGH confidence — first-party requirements)
