# Roadmap: Cat Flood Jumper

**Project:** Cat Flood Jumper
**Created:** 2026-03-03
**Depth:** Standard (6 phases)
**Coverage:** 30/30 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation** - Running canvas, game loop with delta time, keyboard input, state machine scaffold
- [x] **Phase 2: Core Mechanics** - Cat physics, one-way platform collision, camera scroll, fall-off-bottom death
- [x] **Phase 3: Game World** - Procedural platforms (normal + crumbling), level structure (height goal + level-complete screen + progression), screens (start/game over), score system, LocalStorage high score
- [ ] **Phase 4: Flood + Lives** - Rising water with escalating speed, lives system (3 hearts), damage feedback, animated wave
- [ ] **Phase 5: Throw + Audio** - Throw mechanic with downward projectile, cat sprite, all sound effects, background music
- [ ] **Phase 6: Hosting** - GitHub Pages deployment, shareable URL, final browser smoke test

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-05 |
| 2. Core Mechanics | 2/2 | Complete | 2026-03-06 |
| 3. Game World | 3/3 | Complete | 2026-03-06 |
| 4. Flood + Lives | 0/? | Not started | - |
| 5. Throw + Audio | 0/? | Not started | - |
| 6. Hosting | 0/? | Not started | - |

---

## Phase Details

### Phase 1: Foundation
**Goal:** A running canvas environment exists with a stable game loop, keyboard input, and state machine — the scaffold every subsequent phase builds on.
**Depends on:** Nothing (first phase)
**Requirements:** (none directly — all are infrastructure prerequisites)
**Success Criteria** (what must be TRUE when this phase is done):
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
**Success Criteria** (what must be TRUE when this phase is done):
  1. Cat automatically bounces upward every time it lands on a platform — no jump key required
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
**Success Criteria** (what must be TRUE when this phase is done):
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
**Goal:** The defining Cat Flood Jumper experience exists — rising water chases the player, the threat escalates, and lives drain on contact.
**Depends on:** Phase 3
**Requirements:** FLOOD-01, FLOOD-02, FLOOD-03, FLOOD-04, LIFE-01, LIFE-02, LIFE-03
**Success Criteria** (what must be TRUE when this phase is done):
  1. A visible animated wave rises from the bottom of the screen throughout gameplay, accelerating noticeably at higher scores
  2. Touching the water causes the HUD heart count to drop by one — not instant death — and a visible screen flash confirms the damage hit
  3. After three water contacts the game over screen appears — not a freeze or silent loop restart
  4. Three heart icons are visible on the HUD from the start of a run and decrement one by one as damage is taken
  5. The wave surface shows a sine-wave ripple animation — not a flat rectangle
**Plans:** TBD

### Phase 04.1: Visual Concept (INSERTED)

**Goal:** A complete visual language is defined for Soggy Moggy — art style, color palette, mood, contrast rules, and a key asset list — so that all sprite and UI work in Phase 5 has a clear, consistent reference to build from. Produced by expert agents with Julian's input.
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05 (visual prep)
**Depends on:** Phase 4 (game is mechanically proven before art direction is locked)
**Plans:** 0 plans

**Success Criteria:**
  1. An art style is chosen (e.g. pixel art, hand-drawn, flat) with a written rationale
  2. A color palette is defined: primary, secondary, accent, background, flood color — with contrast rules
  3. A mood/atmosphere statement exists: what the game should feel like visually and emotionally
  4. A key asset list is produced: every sprite and UI element that needs to be drawn in Phase 5
  5. A visual reference sheet (mood board or style card) is committed to the repo

Plans:
- [ ] TBD (run /gsd:plan-phase 04.1 to break down)

### Phase 5: Throw + Audio
**Goal:** The cat looks like a cat, sounds accompany all key actions, and the throw mechanic fires a visible projectile downward.
**Depends on:** Phase 4
**Requirements:** THROW-01, THROW-02, THROW-03, VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Success Criteria** (what must be TRUE when this phase is done):
  1. The player character is drawn as a hand-drawn cat sprite — not a colored rectangle
  2. Pressing the throw key fires a visible projectile that travels downward on screen and produces any observable effect on the game world (visual-only interaction is accepted for submission)
  3. A jump sound plays every time the cat bounces off a platform
  4. A damage sound plays when the cat touches the water and loses a life
  5. Background music loops continuously during gameplay and a game over audio sting plays when all lives are lost
**Plans:** TBD

### Phase 6: Hosting
**Goal:** The game is live at a permanent URL that anyone can open in a modern desktop browser and play immediately.
**Depends on:** Phase 5
**Requirements:** HOST-01, HOST-02
**Success Criteria** (what must be TRUE when this phase is done):
  1. Opening the shareable URL in a fresh browser session (Chrome, Firefox, or Edge) shows the start screen without any install, download, or build step
  2. The URL is stable and accessible — not a localhost address — and can be shared as plain text
**Plans:** TBD

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| LOOP-01 | Phase 2 |
| LOOP-02 | Phase 2 |
| LOOP-03 | Phase 3 |
| LOOP-04 | Phase 2 |
| LOOP-05 | Phase 2 |
| LOOP-06 | Phase 3 |
| LOOP-07 | Phase 3 |
| LEVEL-01 | Phase 3 |
| LEVEL-02 | Phase 3 |
| LEVEL-03 | Phase 3 |
| LEVEL-04 | Phase 4 |
| SCRN-01 | Phase 3 |
| SCRN-02 | Phase 3 |
| SCRN-03 | Phase 3 |
| FLOOD-01 | Phase 4 |
| FLOOD-02 | Phase 4 |
| FLOOD-03 | Phase 4 |
| FLOOD-04 | Phase 4 |
| LIFE-01 | Phase 4 |
| LIFE-02 | Phase 4 |
| LIFE-03 | Phase 4 |
| THROW-01 | Phase 5 |
| THROW-02 | Phase 5 |
| THROW-03 | Phase 5 |
| PLAT-01 | Phase 3 |
| PLAT-02 | Phase 3 |
| PLAT-03 | Phase 3 |
| VIS-01 | Phase 5 |
| VIS-02 | Phase 5 |
| VIS-03 | Phase 5 |
| VIS-04 | Phase 5 |
| VIS-05 | Phase 5 |
| HOST-01 | Phase 6 |
| HOST-02 | Phase 6 |

**Coverage: 34/34 v1 requirements mapped**

---
*Roadmap created: 2026-03-03*
*Last updated: 2026-03-06 — 03-03 executed: Screen wiring complete (Enter key, LEVEL_COMPLETE case, HUD overlays, goal line). Phase 3: 3/3 plans done — COMPLETE.*
