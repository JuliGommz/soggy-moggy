# Technology Stack

**Project:** Cat Flood Jumper
**Domain:** Browser-based vertical platformer (Doodle Jump-style)
**Researched:** 2026-03-03
**Overall confidence:** HIGH (all core choices backed by MDN official documentation)

---

## Recommended Stack

### Core Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vanilla JavaScript (ES2022+) | Native | Game logic, entities, state | No build step, runs in any browser, matches school constraint. ES2022 class fields and `#private` syntax are widely supported. |
| HTML Canvas 2D API | Native (Baseline: widely available since 2015) | All rendering | Single drawing surface, imperative API that maps cleanly to game render loops. No dependency overhead. |
| `requestAnimationFrame` | Native | Game loop driver | Syncs with browser repaint cycle, provides `DOMHighResTimeStamp`, pauses automatically when tab is hidden. Never use `setInterval` for a game loop. |
| `performance.now()` | Native | Delta-time calculation | Microsecond precision for frame timing. Use instead of `Date.now()`. |

### Game Loop Pattern

**Use: Fixed-update + variable-render (semi-fixed timestep)**

This is the pattern MDN documents for real-time games where frame rate is not guaranteed.

```javascript
// Confidence: HIGH — sourced directly from MDN Games Anatomy article

const TICK_MS = 16.67; // ~60 Hz physics/logic updates

let lastTick = performance.now();
let stopMain;

function main(tFrame) {
  stopMain = requestAnimationFrame(main);

  const elapsed = tFrame - lastTick;
  const ticks = Math.floor(elapsed / TICK_MS);

  for (let i = 0; i < ticks; i++) {
    lastTick += TICK_MS;
    update(lastTick);   // physics, collision, game state
  }

  render(tFrame);       // draw everything
}

main(performance.now());
```

**Why not pure variable timestep (delta * velocity)?**
Multiplying velocity by an unpredictable delta produces inconsistent physics — jumps can pass through platforms on a slow frame. Fixed update steps make the physics deterministic.

**Why not `setInterval`?**
`setInterval` does not synchronize with the display refresh cycle, fires even when the tab is hidden, and has no access to high-resolution timestamps.

### Input Handling

**Use: Keyboard state map (event-driven state tracking)**

```javascript
// Confidence: HIGH — sourced from MDN Control Mechanisms article

const keys = {};

document.addEventListener("keydown", e => { keys[e.code] = true; });
document.addEventListener("keyup",   e => { keys[e.code] = false; });

// In update():
if (keys["ArrowLeft"])  { player.vx = -SPEED; }
if (keys["ArrowRight"]) { player.vx =  SPEED; }
if (keys["Space"])      { player.shoot(); }
```

**Why a state map over direct event callbacks?**
Events fire once per key-press. A state map lets the update loop poll input every tick, which is correct for continuous movement. The event is decoupled from the update frequency.

**Keys to use for this game:**
- `ArrowLeft` / `ArrowRight` — horizontal movement
- `Space` or `ArrowDown` — throw mechanic (fire downward)
- `event.code` not `event.key` — `event.code` is layout-independent (WASD works on AZERTY keyboards too)

### Rendering

**Use: Single canvas, full clear each frame**

```javascript
// Confidence: HIGH — sourced from MDN Canvas Optimization article

const canvas = document.getElementById("canvas");
// Disable alpha compositing if background is always opaque — free perf gain
const ctx = canvas.getContext("2d", { alpha: false });

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw background, platforms, water, player, UI — in that z-order
}
```

**Canvas size for this project:** 480 x 640 px (portrait, Doodle Jump proportions). Set via HTML attributes, not CSS, to avoid coordinate distortion.

**Layered canvas (optional optimization):** Split into `background-canvas` (static, rarely redrawn) and `game-canvas` (every frame). For this project scope, a single canvas is sufficient — add layers only if profiling shows background redraw as a bottleneck.

**Integer coordinates:** Always round x/y before drawing to avoid sub-pixel anti-aliasing blur.

```javascript
ctx.drawImage(sprite, Math.floor(x), Math.floor(y));
```

**Offscreen canvas for pre-rendering:** Use for the water gradient or any repeated complex shape. Not required for simple sprite-based assets.

### Asset Loading

**Use: Native `Image` objects + a simple load counter — no library needed**

```javascript
// Confidence: HIGH — standard browser API, no library required for this scope

const assets = {};
let loadedCount = 0;
const TOTAL_ASSETS = 5; // adjust per project

function loadImage(key, src) {
  const img = new Image();
  img.onload = () => {
    assets[key] = img;
    loadedCount++;
    if (loadedCount === TOTAL_ASSETS) startGame();
  };
  img.src = src;
}

loadImage("cat",      "assets/cat.png");
loadImage("platform", "assets/platform.png");
// etc.
```

**Why no asset-loading library?** For ~5–10 sprites the overhead of a library is not justified. A simple counter pattern is transparent, debuggable, and school-submission-appropriate.

**Asset format:** PNG for sprites with transparency. Keep all assets in an `/assets/` folder. Spritesheet (sprite atlas) is optional for this scope — individual files are fine.

### Audio

**Use: Web Audio API for sound effects, HTML `<audio>` for background music**

| Need | API | Why |
|------|-----|-----|
| Sound effects (jump, splash, throw) | `Web Audio API` (`AudioContext`) | Precise timing, can play overlapping instances, no click |
| Background music (looping track) | `<audio>` element with `loop` attribute | Simpler for a single looping file |
| Mobile-safe resume | `audioCtx.resume()` on first user click | Required — browsers block autoplay before user gesture |

**Why not use `<audio>` for sound effects?**
HTML audio elements cannot overlap by default. If the cat jumps rapidly, a new jump sound would restart instead of playing simultaneously. Web Audio API creates new buffer sources each call, so sounds stack correctly.

**Audio is optional for MVP.** The gameplay loop works without it. Add audio in a polish phase.

### No Build Tooling

**Use: Zero build tools — plain `.js` files loaded via `<script type="module">`**

```html
<!-- index.html -->
<script type="module" src="src/main.js"></script>
```

ES modules (native `import`/`export`) work in all modern browsers without bundling. No Webpack, Vite, or Rollup needed. This keeps the project:
- Runnable from a local file server (VS Code Live Server extension)
- Directly deployable as static files
- Free of dependency management complexity

**Local development server:** Use VS Code's Live Server extension or `npx serve .` — do not open `index.html` directly as a `file://` URL because ES module imports are blocked by CORS policy on `file://`.

---

## Hosting

### Recommendation: GitHub Pages (primary) with itch.io as backup

| Option | Cost | Setup | URL Format | Best For |
|--------|------|-------|-----------|---------|
| **GitHub Pages** | Free | Push repo, enable Pages in settings | `username.github.io/repo-name` | School submissions — permanent, credible URL |
| **itch.io** | Free | Upload zip of build | `username.itch.io/game-name` | Game portfolio, community visibility |
| **Netlify** | Free tier | Connect repo or drag-drop folder | `project.netlify.app` | Fastest deploy for non-GitHub workflows |

**GitHub Pages is the recommendation** because:
1. The project is likely already in a git repo (school submission context)
2. No additional account needed beyond GitHub
3. URL is stable and shareable immediately
4. Zero configuration for a static file project — push and enable

**Deployment steps:**
1. Push project to GitHub repository
2. Repository Settings → Pages → Source: `main` branch, `/ (root)`
3. GitHub generates `https://username.github.io/repo-name`
4. Share that URL as the submission link

**Limits (GitHub Pages):** 1 GB repository size, 100 GB/month bandwidth, 10 builds/hour. None of these limits are relevant for a game of this scope.

---

## Alternatives Considered and Rejected

| Category | Rejected Option | Reason Rejected |
|----------|----------------|-----------------|
| Game framework | Phaser 3 | Overkill — adds ~1 MB bundle, learning curve, and hides the Canvas API that the assignment is about |
| Game framework | Kaboom.js | Same issue — hides fundamentals, abandoned/reduced maintenance as of 2023 |
| Bundler | Vite | No build step needed; adds complexity without benefit for static files |
| Audio | Howler.js | ~30 KB library for a need that Web Audio API covers natively |
| TypeScript | TS compiler | Adds a build step; project constraint is "no framework dependency"; VS Code still provides type hints via JSDoc |
| Canvas | WebGL / Three.js | 2D sprites do not need GPU pipeline complexity |
| State management | Redux / Zustand | Game state is a simple object; a framework-level state manager is over-engineering |

---

## Installation

No package manager required for runtime dependencies. There are none.

**Optional dev tooling (not required, convenience only):**
```bash
# Local dev server (if not using VS Code Live Server)
npx serve .

# Type checking without TypeScript compiler (JSDoc-based)
# In VS Code: add //@ts-check to .js files, configure jsconfig.json
```

**Recommended `jsconfig.json` for VS Code IntelliSense:**
```json
{
  "compilerOptions": {
    "checkJs": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*.js"]
}
```

---

## File Structure Recommendation

```
/
  index.html          ← entry point, canvas element, script module tag
  /src
    main.js           ← game loop, init, scene manager
    player.js         ← cat entity: physics, input, draw
    platform.js       ← platform entity + procedural generator
    water.js          ← rising flood entity
    projectile.js     ← thrown object entity
    renderer.js       ← canvas context wrapper, camera/scroll
    audio.js          ← Web Audio API wrapper
    state.js          ← game state: score, lives, phase
  /assets
    cat.png
    platform.png
    water.png
    (etc.)
```

This flat, file-per-entity structure works at school-project scale without requiring a bundler or module resolution system beyond native ES imports.

---

## Sources

- MDN — Games/Anatomy (game loop): https://developer.mozilla.org/en-US/docs/Games/Anatomy
- MDN — Canvas Optimization: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- MDN — 2D Collision Detection: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
- MDN — Control Mechanisms (keyboard): https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard
- MDN — Audio for Web Games: https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games
- MDN — OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN — Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- GitHub Pages docs: https://docs.github.com/en/pages
