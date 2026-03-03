# Research Summary: Cat Flood Jumper

**Synthesized:** 2026-03-03
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall Confidence:** HIGH — all four research files draw primarily from MDN official documentation and first-party genre analysis

---

## Executive Summary

Cat Flood Jumper is a browser-based vertical auto-jump platformer in the Doodle Jump tradition, distinguished by a rising flood mechanic and a downward throw ability. The correct way to build it is with zero external dependencies: Vanilla JavaScript (ES2022+), HTML Canvas 2D API, `requestAnimationFrame`, and native ES modules — no framework, no build tool, no library. This is both the technically sound choice and the school-constraint-correct choice; every alternative (Phaser, Kaboom, Vite, Howler) adds complexity that obscures the Canvas fundamentals the project is meant to demonstrate.

The architecture is a classic State Machine + Game Loop + Entity Model. A single `GameState` object holds all shared state. A fixed-timestep game loop drives deterministic physics. Each game entity (Player, PlatformManager, Water, ThrowManager) owns its own update and render logic. The camera is a single `ctx.translate(0, -cameraY)` transform applied in the render pass. This structure is well-documented, school-appropriate, and scales correctly to the project's scope without over-engineering.

The central risk is not technical — it is scope discipline. The core gameplay loop (cat jumps, water rises, lives deplete, game ends) must be working and testable before any polish layer is touched. The throw mechanic's effect on water is intentionally undefined in project scope and must be deferred to playtesting. Every other risk is a known, preventable implementation pitfall: missing delta time, bad one-way platform collision, coordinate system mismatch, and canvas sizing errors are all solved problems with documented fixes.

---

## Recommended Stack

| Technology | Role | Rationale |
|------------|------|-----------|
| Vanilla JavaScript ES2022+ | Game logic, entities, state | No build step, runs in any browser, matches school constraint. ES2022 class fields and `#private` supported natively. |
| HTML Canvas 2D API (480x640 px) | All rendering | Imperative API that maps cleanly to game render loops. No dependency overhead. Portrait ratio matches Doodle Jump proportions. |
| `requestAnimationFrame` | Game loop driver | Syncs with browser repaint, provides high-res timestamp, pauses when tab hidden. Never use `setInterval`. |
| `performance.now()` / `DOMHighResTimeStamp` | Delta time | Microsecond precision for frame timing. |
| Native ES modules (`import`/`export`) | Code splitting | No bundler needed. Works in all modern browsers. Load via `<script type="module">`. |
| Web Audio API | Sound effects | Supports overlapping playback instances (jump sounds stacking). Must be initialized on first user gesture. |
| HTML `<audio loop>` | Background music | Simpler for a single looping track. |
| GitHub Pages | Hosting / submission URL | Free, stable, permanent URL. Zero configuration for a static project. Push + enable Pages in settings. |

**Rejected and why:**
- Phaser 3 / Kaboom.js: ~1 MB overhead, hides Canvas API, defeats the assignment purpose
- Vite / Webpack: no build step needed, adds complexity without benefit
- Howler.js: 30 KB library for something Web Audio API handles natively
- TypeScript: requires a build step; JSDoc + `jsconfig.json` gives IntelliSense without one
- WebGL / Three.js: 2D sprites do not need a GPU pipeline

---

## Table Stakes Features

### Genre table stakes (expected by all players)

| Feature | Complexity |
|---------|------------|
| Auto-jump on platform contact (no manual jump button) | Low |
| Left/right movement — immediate, zero-lag response | Low |
| Procedurally generated platforms with guaranteed reachable gaps | Medium |
| Upward-only camera scroll — falling below screen = death | Low |
| Score based on maximum height reached | Low |
| Start screen (title, start button, controls hint) | Low |
| Game over screen (final score, high score, restart) | Low |
| Visual platform distinction from background | Low |

### Project-specific requirements (from PROJECT.md)

| Feature | Complexity | Notes |
|---------|------------|-------|
| Rising water level | Medium | Accelerates with score; contact = damage |
| Lives / HP system (3 lives) | Low | Heart indicator; water contact costs 1 life |
| Throw mechanic (downward) | Medium | Effect on water is TBD — implement throw first, decide effect in playtesting |
| Static hosted URL | Low | GitHub Pages |

### Differentiators (add after core loop is stable)

| Feature | Value | Complexity |
|---------|-------|------------|
| Animated water line (sine wave) | Makes threat feel alive | Medium |
| Throw freezes/slows water | Strategic depth to throw mechanic | Medium |
| Platform variety (crumbling, moving, spring) | Breaks monotony | Medium |
| Cat idle/jump/throw animations | Polish and personality | Medium |
| Water damage visual feedback (screen flash) | Reduces frustration | Low |
| Speed escalation curve | Tension arc | Low |
| Particle effects on landing/throw | Game feel ("juice") | Low-Med |

### Anti-features (deliberately excluded from v1)

Online leaderboard, mobile/touch controls, enemy characters, power-up inventory, multiple characters, story/cutscenes, audio settings panel, level editor, save/continue system, multiple difficulty modes, multiplayer.

---

## Architecture Overview

### Component Map

```
index.html (canvas element + <script type="module">)
    |
    v
main.js (init, start loop)
    |
    +-- game-loop.js     requestAnimationFrame, calls update(dt) then render(ctx)
    +-- input.js         keydown/keyup listeners → plain { left, right, shoot } state object
    |
    +-- game-state.js    Single source of truth: phase, score, lives, cameraY
    +-- player.js        Position, velocity, gravity, auto-jump, sprite draw
    +-- platform-manager.js  Spawn/pool/cull platforms; one-way AABB collision
    +-- water.js         Rising flood Y, acceleration, wave draw
    +-- throw-manager.js Spawn projectiles on input, movement, hit checks
    +-- ui.js            HUD (score, lives), start screen, game-over screen
```

### Key Patterns

**Game loop:** Semi-fixed timestep. Delta time calculated every frame, capped at 50 ms to prevent physics explosions after tab switch. All velocities multiplied by `dt / 1000` (seconds).

**State machine:** `GameState.phase` controls flow: `'start' → 'playing' → 'gameover'` (with optional `'paused'`). Defined before any game logic is written. Reset function re-initializes all entities without page reload.

**Camera:** `cameraY` = world Y of the top of screen. Applied as `ctx.translate(0, -cameraY)` before drawing world objects; removed with `ctx.restore()` before drawing HUD. Camera only moves upward, never down.

**Coordinate system:** All entities stored in world coordinates. Camera transform handles screen conversion at render time only. No coordinate conversion in update logic.

**Collision:** AABB for all overlaps. Platform landing is one-way: resolves only when player is falling downward AND player bottom crosses platform top within the current frame. This is the single most error-prone mechanic — implement and test in isolation before adding procedural generation.

**Object pooling:** Platform objects reuse a fixed array with `.active` flags; no per-frame garbage from `push`/`splice`. Required for smooth performance.

**Rendering order per frame:**
1. `ctx.clearRect(0, 0, W, H)`
2. `ctx.save()` → `ctx.translate(0, -cameraY)`
3. Draw: platforms, water, projectiles, player (all world space)
4. `ctx.restore()`
5. Draw: HUD, screens (screen space — unaffected by camera)

---

## Top Pitfalls to Avoid

### 1. No Delta Time (frame-rate-dependent physics) — CRITICAL
Physics values like `player.y -= 5` run at the developer's 60 Hz but at 2x speed on a 120 Hz monitor.
**Fix:** Calculate `deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05)` every frame. Multiply all velocity and acceleration values by it. Address in Phase 1 — retrofitting touches every moving object.

### 2. Broken One-Way Platform Collision — CRITICAL
Simple AABB catches collisions from all sides: cat gets stuck on platform edges, cannot pass through platforms jumping upward.
**Fix:** Check three conditions simultaneously: (a) horizontal overlap exists, (b) player was above platform top last frame, (c) player is moving downward. Only then resolve landing and trigger auto-jump. Address in Phase 2 before procedural generation.

### 3. Camera/Scroll Coordinate Mismatch — CRITICAL
Mixing world-space and screen-space coordinates causes hitboxes and visuals to diverge, or platforms to stop scrolling while physics continues.
**Fix:** All entities stored in world coordinates. One `ctx.translate(0, -cameraY)` in the render pass converts everything. HUD drawn after `ctx.restore()` — never inside the translated block. Decide on one approach and be consistent everywhere.

### 4. Canvas Sized via CSS Instead of HTML Attributes — CRITICAL
`canvas { width: 400px; }` in CSS stretches the 300x150 default drawing buffer. Result: blurry rendering and misaligned mouse/input coordinates.
**Fix:** Set `canvas.width = 480; canvas.height = 640;` via JS attributes or HTML attributes. Never via CSS dimensions alone. Fix in Phase 1 setup.

### 5. No Game State Machine — Restart Requires Page Reload — HIGH
Without explicit state (MENU / PLAYING / GAMEOVER), resetting the game requires `location.reload()`. Water continues advancing on the game-over screen. Score carries over.
**Fix:** Define `gameState = { phase: 'start', score: 0, lives: 3, cameraY: 0 }` before writing any game logic. Write a `resetGame()` function that re-initializes all entities. Gate the loop on `phase`. Define in Phase 1 — adding this later requires touching every conditional.

**Additional pitfalls documented (Phases 1-4):**
- Tab-switch delta time spike (physics explosion on return) — cap delta at 50 ms
- Asset images used before load completes — Promise-based asset loader before `requestAnimationFrame`
- Procedural gaps wider than max jump height — constrain to `MAX_JUMP_HEIGHT * 0.85`
- Web Audio API suspended on load — init `AudioContext` on start button click
- HUD scrolling with world — draw UI after `ctx.restore()`
- Missing `ctx.clearRect` — ghosting trails every frame
- Context state leaking between draw calls — `save()`/`restore()` on every function using `translate`/`rotate`/`alpha`
- Key repeat causing multi-throw — key-state boolean map + `e.repeat` guard
- Scope creep before core loop is stable — lock MVP list, no extras until all 9 items are playable

---

## Recommended Build Order / Phase Sequence

The dependency graph from ARCHITECTURE.md and the MVP priority order from FEATURES.md converge on the same sequence. Each phase ends with a testable, playable milestone.

### Phase 1: Foundation (no gameplay yet)
**Delivers:** Running game loop with canvas rendering, input capture, and state machine scaffold.
**Features:** Canvas setup (correct attribute sizing), `requestAnimationFrame` loop with delta time (capped), keyboard state map, `GameState` object with phase enum.
**Pitfalls to prevent:** Canvas CSS sizing, missing delta time, tab-switch spike, no state machine.
**Done when:** `console.log(deltaTime)` every frame shows ~0.016; canvas renders a colored rectangle; state switches from `'start'` to `'playing'` on keypress.

### Phase 2: Core Mechanics
**Delivers:** A single cat on a single platform, jumping and moving — the minimal game feel.
**Features:** Player entity (position, velocity, gravity, draw as rectangle), one-way platform collision (AABB directional), left/right input, camera scroll (cameraY only moves up), `ctx.clearRect` every frame, `save()`/`restore()` discipline.
**Pitfalls to prevent:** Broken one-way collision, camera coordinate mismatch, HUD-in-world-space, clearRect missing, context state leaks.
**Done when:** Cat auto-jumps on contact, passes through platforms from below, camera follows upward, no visual glitches on a second monitor or 120 Hz screen.

### Phase 3: Game World
**Delivers:** A completable run from start to fall-off-bottom death, with score.
**Features:** PlatformManager (procedural generation with gap constraints, object pooling), falling below camera = death, score (max height), start screen, game over screen with score display.
**Pitfalls to prevent:** Unreachable gaps (constrain to `< MAX_JUMP_HEIGHT * 0.85`), no restart (state machine handles it).
**Done when:** Play-through from start screen to game over and back to start screen works without page reload. Score increments. Three minutes of play never produces an unreachable gap.

### Phase 4: Project-Specific Mechanics
**Delivers:** The defining Cat Flood Jumper experience — water pressure, lives, and throw ability.
**Features:** Rising water (accelerates over time), lives system (3 hearts, subtract on water contact, trigger game over at 0), throw mechanic (downward projectile, any visual effect), water damage visual feedback (screen flash or cat blink), LocalStorage high score.
**Pitfalls to prevent:** Water effect on throw is TBD — implement throw as visual-only first, decide effect in playtesting. Audio blocked by autoplay policy — init on start button.
**Done when:** Water rises and speeds up, lives count down on contact, throw fires downward, game over triggers at 0 lives. High score persists across page reloads.

### Phase 5: Polish (time permitting, after submission deadline is 3+ days away)
**Delivers:** Presentation quality — sprites, animations, juice.
**Features:** Sprites replacing rectangles, cat idle/jump/throw animation frames, animated water line (sine wave), particle effects on landing and throw, throw effect on water (freeze/slow), platform variety (crumbling, moving, spring), background music + sound effects (Web Audio API gated on start click), speed escalation curve.
**Pitfalls to prevent:** Scope creep eating submission time. Only open `NICE_TO_HAVE.md` when all Phase 1-4 items are playable and tested.
**Done when:** Game is visually presentable, all core mechanics still work after visual layer added.

---

## Open Questions That Need Decisions

These cannot be resolved by research — they require design choices or playtesting.

| Question | Impact | When to Decide |
|----------|--------|----------------|
| What does the throw mechanic DO to the water? (freeze for N seconds? slow permanently? visual only?) | Affects ThrowManager-Water interaction design | After water mechanic is working in Phase 4; decide by playtesting |
| What is the water rise speed curve? (linear, exponential, step-function at score thresholds?) | Determines difficulty arc and game feel | During Phase 4 implementation; calibrate via playtesting |
| What is the starting platform density and gap size? | Determines early-game pacing | During Phase 3 procedural generation; calibrate so first 30 seconds are forgiving |
| How many platforms wide is the canvas? What is max jump height in pixels? | Required before gap constraint formula can be set | Phase 2 — measure actual jump arc before Phase 3 |
| Should water contact kill instantly or drain 1 life? | Lives system feel vs. tension | Already answered by PROJECT.md (lives), but threshold behavior (HP bar vs. discrete lives) needs implementation decision |
| Is there a cooldown on the throw? | Controls throw spam; affects difficulty | Phase 4; default recommendation: 1-2 second cooldown |
| Does the project need a pause key? | Quality-of-life feature; not in MVP | Optional; add to Phase 5 only if time permits |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Stack | HIGH | All choices backed by MDN official documentation. No library dependencies means no version risk. |
| Features (table stakes + anti-features) | HIGH | Drawn from direct genre analysis of 5+ shipping titles; anti-features grounded in PROJECT.md constraints. |
| Architecture patterns | HIGH | Component model and collision logic sourced from MDN Games documentation. Camera pattern is well-established. |
| Pitfalls | HIGH (critical) / MEDIUM (moderate) | Critical pitfalls from MDN. Moderate pitfalls from standard patterns, not single canonical sources. |
| Throw mechanic effect | LOW | Explicitly undefined in PROJECT.md. No research resolves this — requires design decision and playtesting. |
| Performance at scale | HIGH (sufficient) | AABB + simple array operations are well within browser capacity for this entity count. No profiling needed unless frame drops appear. |

**Gaps that cannot be closed by research:**
- Throw mechanic interaction with water (design, not technical)
- Specific numeric values for water speed curve, jump force, platform gap size (calibrate in implementation)
- Whether Phase 5 polish is achievable within remaining project time (depends on schedule)

---

## Sources (aggregated)

- MDN — Games/Anatomy (game loop): https://developer.mozilla.org/en-US/docs/Games/Anatomy
- MDN — 2D Collision Detection: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
- MDN — Canvas Optimization: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- MDN — Control Mechanisms (keyboard): https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard
- MDN — Audio for Web Games: https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games
- MDN — Web Audio API Best Practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- MDN — HTML Canvas Element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
- MDN — Canvas API / ctx.save/restore: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- MDN — requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
- MDN — OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- GitHub Pages docs: https://docs.github.com/en/pages
- Genre reference: Doodle Jump (Lima Sky, 2009), Icy Tower (Free Lunch Design, 2001), Alto's Adventure (Snowman, 2015)
- Project.md: `C:/Users/Teilnehmer/Desktop/Schule/PRG/Abschlussprojekt_SRH_26/.planning/PROJECT.md`
