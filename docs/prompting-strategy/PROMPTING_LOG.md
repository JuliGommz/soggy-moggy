# Prompting Log — Soggy Moggy

> Auto-maintained by Claude throughout the project. Updated after each major session or phase milestone.
> **Julian's effort: review only — no required input.**

---

## Pre-Phase — Project Setup & Planning

**Date:** 2026-03-03 → 2026-03-05

### Commands Used (in order)
- `/gsd:new-project` — initialized project, gathered requirements, created roadmap
- `/gsd:progress` — checked project state at session start
- `/gsd:check-todos` — reviewed pending items
- `/gsd:list-phase-assumptions 1` — surfaced Claude's assumptions about Phase 1 before planning

### Key Directions Julian Gave
- "Soggy Moggy is the working title" (renamed from "Cat Flood Jumper")
- "We are working with placeholders until I have the sprites"
- "Most important point is to get a functioning MVP"
- "Good separation of MVP features and all else"
- "We need a side project planning for a feature the teacher wants: documenting my prompting strategy"
- Preferred format for prompting strategy: **capture now, analyze + present at project end**
- Tracking effort preference: **minimal — mostly automatic**

- "Player character is a stuffed cat (not a real/live cat)"

### What Julian Changed or Rejected
- Rejected per-session manual journaling (too high effort)
- Rejected committing to a fixed presentation format before seeing what was captured
- Chose "auto-assembled per phase" → refined to "live log + end-of-project analysis" based on clarifying questions
- Clarified that "prompts" = commands + chat directions + overrides (not just GSD commands)

### What GSD Produced
- Goal: Project initialized with 34 requirements, 6-phase roadmap
- Key decisions captured in STATE.md: canvas sizing, delta time, state machine, one-way collision, world coordinates
- Prompting strategy design: two-stage capture-then-present system

### MVP Boundary Established
| MVP — must work | Later / polish |
|---|---|
| Canvas, loop, delta time, input, state machine | — |
| Cat physics + auto-jump | — |
| Basic platforms (rectangles) | Crumbling platforms |
| Camera follows up | — |
| Rising water (flat rectangle) | Animated sine-wave surface |
| 3 lives, damage on contact | — |
| Level complete + game over screens | Polished UI |
| Hosted URL | — |
| Score display | LocalStorage high score |
| Basic throw (box downward) | Cat sprite, throw VFX, sound |

---

- "We need a visual concept phase: style, color, mood, contrasts — done with expert agents. Place it where expert deems fitting."
- Expert placement decision: **between Phase 4 and Phase 5** — after MVP is mechanically proven, before sprite implementation begins

- Git workflow decision: **branch-per-phase** (not per-feature) — recommended as sinnvoll for solo school project; phase branches merge into master via PR when GSD verify-work passes

<!-- New phase entries will be appended here by Claude after each phase milestone -->

---

## Phase 1 — Foundation

**Date:** 2026-03-05
**Branch:** `phase-1-foundation`
**Status:** ✓ Complete (human-verified)

### Commands Used (in order)
- `/gsd:plan-phase 1` — spawned research + planner + checker agents; 2 plans created and verified
- `/gsd:execute-phase 1` — spawned executor agents per wave; all 5 source files created

### Key Directions Julian Gave
- *(No overrides — fully autonomous execution approved)*

### What Julian Changed or Rejected
- No mid-execution changes; approved human verification checkpoint without issues

### What GSD Produced
- **Wave 1 (01-01):** `index.html`, `src/game-state.js`, `src/input.js` — HTML shell, frozen GamePhase enum, input key-state set
- **Wave 2 (01-02):** `src/player.js`, `src/main.js` — placeholder player rect, delta-time game loop, render pass with camera translate
- All files use classic `<script>` tags (no ES6 modules) — works on `file://` without a dev server
- Commit pattern: one atomic commit per task (total 5 source files, 5 commits)

### Interesting Decisions Made
- `lastTime = performance.now()` before first `requestAnimationFrame` — prevents first-frame spike where dt = several seconds
- `Math.floor()` on player position in `renderPlayer` — prevents sub-pixel blur on integer canvas
- `GameState.phase = 'gameover'` via console is the only PLAYING→GAMEOVER path in Phase 1; keyboard-driven transition deferred to Phase 2

### Verification Result
- 4/4 must-haves: ✓ passed automated checks
- Human items verified: canvas renders, player moves left/right, game loop runs smoothly

---

## Phase 2 — Core Mechanics

**Date:** 2026-03-06
**Status:** ✓ Complete (verified)

### Commands Used (in order)
- `/gsd:plan-phase 2` — spawned research + planner + checker agents; 2 plans created
- `/gsd:execute-phase 2` — two plans executed sequentially
- `/gsd:verify-work` — automated static checks passed

### Key Directions Julian Gave
- *(No overrides — fully autonomous execution approved)*

### What Julian Changed or Rejected
- None — both plans executed exactly as written

### What GSD Produced
- **Plan 02-01 (~15 min):** Gravity (980 px/s²), one-way AABB four-condition collision, auto-bounce — cat falls and bounces continuously without key input
- **Plan 02-02 (~76 s):** Peak-tracking one-way camera scroll, fall-off-bottom GAMEOVER detection, height counter in HUD
- Key pattern: `prevY` saved before physics update so collision can compare last-frame vs current feet position
- Camera gate: `if (newCameraY < cameraY)` — camera can only scroll up, never back down

---

## Phase 3 — Game World

**Date:** 2026-03-06
**Status:** ✓ Complete (verified 6/6 success criteria, 12/12 requirements)

### Commands Used (in order)
- `/gsd:plan-phase 3`
- `/gsd:execute-phase 3` — three plans executed
- `/gsd:verify-work` — 6/6 truths verified, 12/12 requirements satisfied

### Key Directions Julian Gave
- *(No overrides — fully autonomous execution approved)*

### What Julian Changed or Rejected
- None

### What GSD Produced
- Full playable level cycle: start screen → play → level-complete screen → advance to next level → game over
- `startNextLevel()` intentionally preserves lives across levels (difficulty ramp)
- `highScore` intentionally excluded from `resetGame()` — survives browser close via localStorage with try/catch
- Procedural platform generation: slot-based, GAP_PX=120 (48% of theoretical max jump)
- Crumbling platforms: dt-accumulator instead of setTimeout (deterministic under delta-cap)

---

## Phase 4 — Flood + Lives

**Date:** 2026-03-06
**Status:** ✓ Complete (verified 5/5 success criteria, 8/8 requirements)

### Commands Used (in order)
- `/gsd:plan-phase 4`
- `/gsd:execute-phase 4`
- `/gsd:verify-work` — 5/5 truths verified

### Key Directions Julian Gave
- *(No overrides — fully autonomous execution approved)*

### What Julian Changed or Rejected
- None

### What GSD Produced
- `src/water.js`: sine-wave flood rising from below, level-scaled speed, invincibility frames, screen flash on damage
- Lives system: 3 hearts displayed in HUD, persist across levels (do not reset between levels)
- Collision at wave crest (`waterY - WAVE_AMPLITUDE`) — player hits where the eye sees the wave
- Separation of concerns: `takeDamage()` is pure; collision guard lives in `updateWater()` (the caller)

---

## Phase 04.1 — Visual Concept

**Date:** 2026-03-09
**Status:** ✓ Complete

### Commands Used (in order)
- Expert-agent-driven visual concept session (outside formal GSD)
- `/gsd:plan-phase 04.1`
- `/gsd:execute-phase 04.1`

### Key Directions Julian Gave
- Confirmed **grey-pink direction** for the stuffed cat character
- "Player = stuffed cat, not a real/live cat — floppy limbs, button eyes, stitched seams"
- Approved "Warm Pixel Art" mood statement and 16-color locked palette
- Confirmed 3-frame jump animation (down/middle/high) already integrated in player.js

### What Julian Changed or Rejected
- Retired Cat1_beishe direction; chose grey-pink variant
- Crumble-intact platform intentionally identical color to normal — surprise is the mechanic, not a visual tell
- Phase inserted between Phase 4 and Phase 5 at Julian's direction ("after MVP is proven, before sprite work begins")

### What GSD Produced
- `docs/STYLE_GUIDE.md`: 16-color locked palette, mood, art rules, do/don't table, stuffed cat design notes
- `PixelArt/soggy_moggy_palette.gpl`: GPL file for Pixelorama import
- `docs/ASSET_LIST.md`: accurate asset inventory with real filenames and per-level status
- Platform debug colors replaced with palette values in `src/platforms.js`
- `ctx.imageSmoothingEnabled = false` wired at canvas init

---

## Dozent Presentation — 2026-03-25 (Major Pivot)

**Date:** 2026-03-25
**Context:** Mid-project review with teacher. Four concrete requirements received.

### Commands Used
- *(No GSD commands — manual decision session)*
- Julian created `FEEDBACK_DOZENT_2026-03-25.md` to convert oral feedback into written planning artifacts

### What Julian Directed
- Confirmed all four teacher requirements as binding constraints
- Assigned each to a phase: FB-03 → new Phase 04.2; FB-01 → Phase 05-e; FB-02/04 → Phase 5
- Decision on FB-03 (explicit, in writing): "Leuchtturm wird implementiert. Alle Raketen-Sprites werden nicht mehr verwendet." — accepted the rework cost

### Teacher Requirements and Julian's Responses

| ID | Requirement | Julian's Action |
|----|-------------|-----------------|
| FB-01 | NPCs must be present | Wasp enemy system (patrol + stomp kill) — became Phase 05-e |
| FB-02 | Ladder-box mechanic in elevator level | Planned; later trimmed to static outro prop |
| FB-03 | L2 setting: rocket → lighthouse | New Phase 04.2 created; rocket sprites fully retired |
| FB-04 | Balloon chase mechanic | Confirmed; rise speed and horizontal drift tuned |

---

## Phase 04.2 — L2 Lighthouse Redesign

**Date:** 2026-03-30 to 2026-04-07
**Status:** ✓ Shipped (outside formal GSD plan; code in master)

### Commands Used (in order)
- `/gsd:research-phase 04.2` — produced detailed RESEARCH.md with full L2 code audit and asset design guidance
- Shipped directly to master (no formal plan/execute cycle for this phase)

### Key Directions Julian Gave
- "Visual-only redesign — no gameplay mechanics change"
- Hazard stays as rising flood (fits lighthouse setting even better than rocket)
- Rocket sprites retired despite existing pixel-art investment

### What Julian Changed or Rejected
- Level order finalized: L1=City(Smog), L2=Shaft(Electricity), L3=Sea(Flood) — swapped from original assignment
- Accepted the cost of discarding finished rocket artwork to satisfy teacher requirement

### What GSD Produced
- `src/background.js`: lighthouse rendering (base + tiled mid + top cap), elevator shaft interior
- Rocket Image declarations removed entirely (not just draw calls — to prevent 404 console noise)
- L2 platform sprites reflecting lighthouse setting

---

## Phase 04.3 + Phase 05-e — Dialogue System, Elevator Interior, Wasp Enemies

**Date:** 2026-04-07 to 2026-04-22
**Status:** ✓ Complete (merged to master via PR #1, 2026-04-22)

### Key Directions Julian Gave
- **Language change: Spanish → English** — Julian's own decision; font-atlas with special characters (¡ ¿ á é) was more complex than needed
- "YELLOW bitmap atlas for titles, BlockCraft.otf for body text" — hybrid font approach
- Dialogue pools: level-flavored damage reactions ("COUGH COUGH!" / "ZAP!" / "GLURP GLURP!")
- "Independence rule: never change a shared default; always use override tables" — established after a dialogue spacing bug
- Wasp: patrol 4–8s, stomp = kill + bounce, sting = damage; base counts 8/12/16 per level

### What Julian Changed or Rejected
- Spanish identity ("Gato sin Botas") dropped entirely — was a core concept in the Phase 5 CONTEXT.md
- All in-game text migrated to English across all source files
- Push mechanic de-scoped as a core feature (Z key retained for balloon/wasp/outro-trigger only)

### What GSD Produced
- Full dialogue system: intro/outro/life-lost bubbles, YELLOW atlas titles, BlockCraft body
- Bubble positions, flip logic, shake animation — all values locked after visual iteration
- Dev browse mode (F2) for playtesting specific sections without playing through full levels
- English migration: code identifiers, comments, in-game strings, level names across all src/ files

---

## Phase 5 — HUD + UI Screens

**Date:** 2026-04-21 to 2026-04-27 (largely complete; Pause screen remains)
**Status:** Largely complete

### Commands Used
- Planning and execution outside formal GSD plan framework
- `/gsd:progress` for session restarts
- Research sessions for difficulty system naming, start menu layout options

### Key Directions Julian Gave
- Difficulty names: "Explorer / Adventurer / Enlightened" — named and locked by Julian
- "React DOM overlay on Canvas for the start menu — CDN-loaded, no build tools"
- "JSX/Babel blocked on file:// due to CORS/XHR — use React.createElement only"
- Cloud drift: reduced 20% after playtesting ("Adventurer was too hard")
- "Push mechanic fully dropped — Z key stays for balloon, wasp, and outro triggers only"
- FlatLayoutB chosen after evaluating multiple layout options

### What Julian Changed or Rejected
- Push mechanic dropped entirely — was Phase 5's original core feature per CONTEXT.md
- Rejected Babel/JSX (CORS blocks XHR on file://) → chose React.createElement
- Cloud drift multipliers reduced after playtesting: Adventurer 1.00→0.80, Enlightened 1.75→1.40
- Outro windrad: discovered save-stack-leak bug (ctx.restore outside for-loop) — Julian identified symptom ("broken mirror effect"), directed fix

### What GSD Produced
- Difficulty system: Explorer/Adventurer/Enlightened with 4 tuning levers
- Start screen React overlay (FlatLayoutB, file:// compatible, JSX-free)
- Outro trigger system: L1 windrad (JS-drawn, accelerating spin), L2 bell (pivot-swing animation), L3 lever (left/mid/right cycle)
- Game Over + Success screens (React overlays with canvas animation)
- Score animation between levels
- Cleanup pass: English comments, dead-code removal, magic-number constants, 14 src/ files

---

## Phase 6 — Audio

**Date:** 2026-04-26
**Status:** Largely complete; one known issue deferred post-submission

### Commands Used
- Research agents for audio file selection and license verification
- Planning and execution outside formal GSD framework

### Key Directions Julian Gave
- "HTMLAudio API only — must work on file:// in Firefox without a server"
- "Jump sound latency is a known limitation — document it in the GDD, do not try to fix it"
- "clearTimeout fix required — stale duration timers caused inconsistent playback on rapid re-trigger"
- Web Audio rejected after browser testing: "the researcher said XHR works on file:// in Chromium — but Firefox blocks it for all local files. Submission must work on any browser."

### What Julian Changed or Rejected
- Rejected Web Audio API (Chromium-only; Firefox incompatible on file://)
- Deferred music dur+loop conflict post-submission (BGM goes silent on looping tracks that also have a dur value)
- Removed stomp_bounce from stomp-kill path — only wasp_death plays on stomp

### What GSD Produced
- `src/audio.js` v2.1: SOUNDS map (29 entries with trim values), HTMLAudio playSound/playMusic/fadeOutMusic
- Wasp buzz proximity system (quadratic falloff, 350px range, max 35% sfx volume)
- Hazard ambient proximity for all three level hazards (smog/electricity/flood)
- All `_onPhaseChange` hooks wired in `src/main.js`
- `audio/ATTRIBUTION.md`: complete attribution for all 29 audio slots
