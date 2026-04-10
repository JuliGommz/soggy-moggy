# Roadmap: Soggy Moggy (in-game: Gato Sin Botas)

**Project:** Soggy Moggy
**Created:** 2026-03-03
**Updated:** 2026-03-21 — Doc consistency audit: fixed stale criteria (auto-bounce→manual jump, 4→3 levels, danger types)
**Depth:** Standard (7 phases + 04.1)
**Coverage:** 45/45 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation** - Running canvas, game loop with delta time, keyboard input, state machine scaffold
- [x] **Phase 2: Core Mechanics** - Cat physics, one-way platform collision, camera scroll, fall-off-bottom death
- [x] **Phase 3: Game World** - Procedural platforms (normal + crumbling), level structure (height goal + level-complete screen + progression), screens (start/game over), score system, LocalStorage high score
- [x] **Phase 4: Flood + Lives** - Rising water with escalating speed, lives system (3 hearts), damage feedback, animated wave
- [x] **Phase 04.1: Visual Concept** - Art style, color palette, style guide, asset list, sprite exports (completed 2026-03-09)
- [ ] **Phase 04.2: L2 Lighthouse Redesign** - Replace rocket setting with lighthouse; new pixel art; rewrite background.js L2 section; new platform concept (rocky ledges / wave-breaker steps)
- [ ] **Phase 5: Push + HUD** - Kletter-Kiste puzzle (L3), NPC patrolling creature, balloon chase mechanic, Spanish speech bubbles, level platform sprites (L2+L3)
- [ ] **Phase 6: Audio** - Jump SFX, damage SFX, game over sting, background music loop, push/impact sound
- [ ] **Phase 7: Hosting** - GitHub Pages deployment, shareable URL, final browser smoke test

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-05 |
| 2. Core Mechanics | 2/2 | Complete | 2026-03-06 |
| 3. Game World | 3/3 | Complete | 2026-03-06 |
| 4. Flood + Lives | 2/2 | Complete | 2026-03-10 |
| 04.1 Visual Concept | 2/2 | Complete | 2026-03-09 |
| 04.2 L2 Lighthouse | 0/? | Not started | - |
| 5. Push + HUD | 0/? | Not started | - |
| 6. Audio | 0/? | Not started | - |
| 7. Hosting | 0/? | Not started | - |

---

## Phase Details

### Phase 1: Foundation
**Goal:** A running canvas environment exists with a stable game loop, keyboard input, and state machine — the scaffold every subsequent phase builds on.
**Depends on:** Nothing (first phase)
**Requirements:** (none directly — all are infrastructure prerequisites)
**Success Criteria:**
  1. Opening the game in a browser shows a canvas (480x640) rendering at least one colored shape without blurring or stretching
  2. The browser console shows delta time logged at approximately 0.016 seconds per frame — no frame-rate-dependent values
  3. Pressing arrow keys or A/D keys produces a visible state change (logged or visual) confirming input is captured
  4. The game state machine has a defined phase enum (`start`, `playing`, `gameover`) and transitions between them on keypress without page reload
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — HTML shell, GamePhase/GameState, key-state input (Wave 1) — DONE 2026-03-05
- [x] 01-02-PLAN.md — Game loop, player stub, canvas init, render pass (Wave 2) — DONE 2026-03-05

### Phase 2: Core Mechanics
**Goal:** A single cat on a single platform jumps, moves left/right, and the camera follows upward — the minimum gameplay feel exists.
**Depends on:** Phase 1
**Requirements:** LOOP-01, LOOP-02, LOOP-04, LOOP-05
**Success Criteria:**
  1. Cat jumps upward when Space/click is pressed while on a platform (manual jump; auto-bounce was removed)
  2. Cat moves left and right smoothly in response to arrow keys or A/D with no lag
  3. Cat passes through a platform from below without collision triggering — only landing from above resolves
  4. Camera scrolls upward as the cat climbs and never scrolls back down, even if the cat falls
  5. Cat falling below the bottom edge of the visible canvas costs 1 life (or triggers game over in the stub), not a silent freeze
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Physics + Platform Collision: gravity, one-way collision, auto-bounce (Wave 1) — DONE 2026-03-06
- [x] 02-02-PLAN.md — Camera Scroll + Fall Detection: cameraY tracking, GAMEOVER on fall (Wave 2) — DONE 2026-03-06

### Phase 3: Game World
**Goal:** A complete level cycle is playable — start screen, level with height goal, level-complete screen with score, progression to next level, and game over screen when lives are exhausted. Procedural platforms in both types are reachable, and a persisted high score survives browser close.
**Depends on:** Phase 2
**Requirements:** LOOP-03, LOOP-06, LOOP-07, LEVEL-01, LEVEL-02, LEVEL-03, SCRN-01, SCRN-02, SCRN-03, PLAT-01, PLAT-02, PLAT-03
**Success Criteria:**
  1. Start screen is displayed on load with the game title, a controls explanation, and a start button — game does not begin until the button is pressed
  2. Each level has a visible height goal marker — when the cat reaches it, a level-complete screen appears (not a game over) showing the level score, then the next level begins
  3. Platform gaps within a level never exceed what the cat can jump — the cat can always reach the next platform within the bounded level height
  4. Crumbling platforms crack visually on first landing and disappear before the next jump attempt
  5. Score (height reached in the level) increments in real-time on the HUD and is displayed on both the level-complete screen and the game over screen
  6. Closing the browser and reopening shows the same all-time high score on the game over screen (LocalStorage persists)
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — GameState Foundation: LEVEL_COMPLETE phase, startNextLevel(), LocalStorage high score (Wave 1) — DONE 2026-03-06
- [x] 03-02-PLAN.md — Procedural Platforms: generateLevelPlatforms(), crumble state machine (Wave 1) — DONE 2026-03-06
- [x] 03-03-PLAN.md — Wiring: screens, HUD, Enter key, goal line detection (Wave 2) — DONE 2026-03-06

### Phase 4: Flood + Lives
**Goal:** The defining Soggy Moggy experience exists — rising water chases the player, the threat escalates, and lives drain on contact.
**Depends on:** Phase 3
**Requirements:** FLOOD-01, FLOOD-02, FLOOD-03, FLOOD-04, LIFE-01, LIFE-02, LIFE-03, LEVEL-04
**Success Criteria:**
  1. A visible animated wave rises from the bottom of the screen throughout gameplay, accelerating noticeably at higher scores
  2. Touching the water causes the HUD heart count to drop by one — not instant death — and a visible screen flash confirms the damage hit
  3. After three water contacts the game over screen appears — not a freeze or silent loop restart
  4. Three heart icons are visible on the HUD from the start of a run and decrement one by one as damage is taken
  5. The wave surface shows a sine-wave ripple animation — not a flat rectangle
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Water module: src/water.js + index.html script tag (Wave 1) — DONE 2026-03-10
- [x] 04-02-PLAN.md — Wiring: main.js + game-state.js integration, fall stub, HUD hearts + flash (Wave 2) — DONE 2026-03-10

### Phase 04.1: Visual Concept (INSERTED)
**Goal:** A complete visual language is defined for Soggy Moggy — art style, color palette, mood, contrast rules, and a key asset list — so that all sprite and UI work in Phase 5 has a clear, consistent reference to build from.
**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Depends on:** Phase 4 (game is mechanically proven before art direction is locked)
**Plans:** 2/2 plans complete

**Success Criteria:**
  1. An art style is chosen (pixel art) with a written rationale — DONE
  2. A color palette is defined: primary, secondary, accent, background, flood color with contrast rules — DONE
  3. A mood/atmosphere statement exists — DONE
  4. A key asset list is produced: every sprite and UI element needed in Phase 5 — produced in ASSET_LIST.md
  5. A visual reference sheet (style card) is committed to the repo as docs/STYLE_GUIDE.md — DONE

Plans:
- [x] 04.1-01-PLAN.md — Style guide, palette file, placeholder color updates (Wave 1) — DONE 2026-03-09
- [x] 04.1-02-PLAN.md — Sprite exports, background asset verification, ASSET_LIST.md (Wave 2) — DONE 2026-03-09

### Phase 04.2: L2 Lighthouse Redesign (NEW — confirmed 30.03.2026)
**Goal:** Level 2 has a fully working lighthouse setting replacing the rocket — new background, new platform concept, no rocket references remain.
**Depends on:** Phase 04.1
**Success Criteria:**
  1. All rocket sprites removed from L2 rendering in background.js — no rocket code remains
  2. Lighthouse background renders correctly across all altitude levels in L2
  3. L2 platform sprites reflect new setting (rocks, ledges, wave-breaker steps)
  4. L2 hazard (rising flood/water) unchanged — visual only redesign
**Plans:** TBD (estimated 2)

### Phase 5: Push + HUD
**Goal:** L3 has a functional Kletter-Kiste puzzle, a patrolling NPC creature adds risk to platforms, balloon chase mechanic is active, and Spanish speech bubbles react to key game events.
**Depends on:** Phase 04.2, Phase 04.1
**Requirements:** PUSH-01, HUD-01, HUD-02, HUD-03, VIS-06, VIS-08, NPC-01
**Note:** Manual jump (Space key, onGround gate), variable jump, walk animation, finish trigger system, balloon collectible, and 3 hazard renderers were all implemented on the feature/asset-restructure-mechanics branch before Phase 5 planning.
**Note:** PUSH-02 (item spawn system) and PUSH-03 (item-hazard interaction) are DROPPED from MVP — deferred as nice-to-have. VIS-07 (item sprites) also deferred.

**Success Criteria:**
  1. ~~Pressing Space while on a platform jumps~~ (DONE on mechanics branch)
  2. L3 Scene 1 (Elevator): a pre-placed Kletter-Kiste can be pushed with Z into position; cat can jump on it to reach the ceiling hatch
  3. NPC creature spawns on select platforms, patrols full platform width, reverses at edges, contact with cat triggers takeDamage()
  4. Balloon rises upward at chase speed — disappears if it reaches levelGoalY before being caught
  5. A speech bubble appears on damage, level-complete, and game-over events — Spanish phrase, fades cleanly
**Plans:** TBD (estimated 5–6)

### Phase 6: Audio
**Goal:** Sound accompanies every key player action — the game has audio presence from jump through game over.
**Depends on:** Phase 5 (all gameplay events defined before audio binds to them)
**Requirements:** AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05
**Note:** Audio was explicitly separated from the original "Throw + Audio" scope — it is its own cohesive concern (Web Audio API, asset pipeline, browser autoplay policy).

**Success Criteria:**
  1. Jump sound plays immediately on Space press (no perceptible lag)
  2. Damage SFX plays when cat touches water and loses a life
  3. Game over audio sting plays when all three lives are lost
  4. Background music loops throughout gameplay and stops on the game over screen
  5. Audio respects browser autoplay policy — game mutes until the user first interacts
**Plans:** TBD (estimated 2)

### Phase 7: Hosting
**Goal:** The game is live at a permanent URL that anyone can open in a modern desktop browser and play immediately.
**Depends on:** Phase 6
**Requirements:** HOST-01, HOST-02
**Success Criteria:**
  1. Opening the shareable URL in a fresh browser session (Chrome, Firefox, or Edge) shows the start screen without any install, download, or build step
  2. The URL is stable and accessible — not a localhost address — and can be shared as plain text
**Plans:** TBD

---

## Coverage Map

| Requirement | Description | Phase |
|-------------|-------------|-------|
| LOOP-01 | Delta-time game loop | Phase 1 |
| LOOP-02 | Keyboard input state map | Phase 1 |
| LOOP-03 | Score system (height-based) | Phase 3 |
| LOOP-04 | Cat left/right movement | Phase 2 |
| LOOP-05 | Gravity + jump physics | Phase 2 |
| LOOP-06 | LocalStorage high score | Phase 3 |
| LOOP-07 | Restart without page reload | Phase 3 |
| LEVEL-01 | Level height goal + goal line | Phase 3 |
| LEVEL-02 | Level-complete screen + progression | Phase 3 |
| LEVEL-03 | Reachable platform gaps | Phase 3 |
| LEVEL-04 | Hazard speed escalation per level | Phase 4 |
| SCRN-01 | Start screen | Phase 3 |
| SCRN-02 | Level-complete screen | Phase 3 |
| SCRN-03 | Game over screen | Phase 3 |
| FLOOD-01 | Rising water (sine-wave surface) | Phase 4 |
| FLOOD-02 | Water collision → life lost + flash | Phase 4 |
| FLOOD-03 | Three lives → game over | Phase 4 |
| FLOOD-04 | HUD hearts (3 icons, decrement) | Phase 4 |
| LIFE-01 | Lives system (3 lives) | Phase 4 |
| LIFE-02 | Damage iframe (no double-hit) | Phase 4 |
| LIFE-03 | Fall-off-bottom → life lost | Phase 4 |
| PLAT-01 | Procedural platform generation | Phase 3 |
| PLAT-02 | Crumbling platform state machine | Phase 3 |
| PLAT-03 | Gap constraint (always reachable) | Phase 3 |
| VIS-01 | Art style rationale (pixel art) | Phase 04.1 ✓ |
| VIS-02 | Color palette + contrast rules | Phase 04.1 ✓ |
| VIS-03 | Mood/atmosphere statement | Phase 04.1 ✓ |
| VIS-04 | Key asset list (ASSET_LIST.md) | Phase 04.1 ✓ |
| VIS-05 | Style guide (docs/STYLE_GUIDE.md) | Phase 04.1 ✓ |
| VIS-06 | Cat sprite frames (push paw, walk, jump) | Phase 5 |
| VIS-07 | Item sprites (diverse types for platforms) | Phase 5 |
| VIS-08 | Speech bubble shapes (canvas-drawn) | Phase 5 |
| PUSH-01 | Manual jump from ground (Space + onGround gate) | Phase 5 |
| PUSH-02 | Push mechanic + item physics (Z key, proximity, gravity) | Phase 5 |
| PUSH-03 | Push score feedback + hazard interaction (floating text, splash, stubs) | Phase 5 |
| HUD-01 | Spanish speech bubble system (shapes, lifecycle, positioning) | Phase 5 |
| HUD-02 | Event-to-bubble mapping (damage, level complete, push, game over) | Phase 5 |
| HUD-03 | Game title: Gato sin Botas on start/gameover screens | Phase 5 |
| AUDIO-01 | Jump sound effect | Phase 6 |
| AUDIO-02 | Damage sound effect (water contact) | Phase 6 |
| AUDIO-03 | Game over audio sting | Phase 6 |
| AUDIO-04 | Background music loop (gameplay) | Phase 6 |
| AUDIO-05 | Push/item impact sound | Phase 6 |
| HOST-01 | GitHub Pages deployment (public URL) | Phase 7 |
| HOST-02 | Stable shareable URL, no install required | Phase 7 |

**Coverage: 45/45 v1 requirements mapped**

---
*Roadmap created: 2026-03-03*
*Updated 2026-03-12: "Throw + Audio" dissolved — "throw" renamed "push" throughout. Phase 5 = Push + HUD. Phase 6 = Audio (new, separated). Phase 7 = Hosting (renumbered from 6). Requirements: 34 → 45 (added PUSH, HUD, AUDIO, VIS-06/07/08).*
