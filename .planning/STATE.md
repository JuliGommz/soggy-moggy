---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-04-06T12:00:00.000Z"
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 11
  completed_plans: 11
---

# State: Soggy Moggy

**Last updated:** 2026-04-06
**Updated by:** Cat spritesheet migration complete; lighthouse renderer implemented; branch feature/04.2-l2-lighthouse created; Arbeitsprotokoll updated through 06.04

---

## Project Reference

**Core Value:** A playable, complete gameplay loop: cat jumps up, level-specific hazards rise from below (smog/flood/electricity), tension builds — the game feels real from first play.

**Current Focus:** Phase 04.2 (L2 Lighthouse Redesign) — in progress on branch feature/04.2-l2-lighthouse. Renderer implemented, platform sprites + platform concept next.

**Stack:** Vanilla JavaScript ES2022+ + HTML Canvas 2D (480x640) + Web Audio API + GitHub Pages

---

## Current Position

**Active Phase:** 04.2 — L2 Lighthouse Redesign (IN PROGRESS — renderer done, plan pending)
**Active Plan:** none — phase plan not yet created; renderer WIP committed on branch
**Phase Status:** Phases 1–4, 04.1 complete — Phase 04.2 in progress on feature branch

```
Progress: [x][x][x][x][x][~][ ][ ][ ]  5/8 complete + 04.2 in progress
           P1  P2  P3  P4 04.1 04.2 P5  P6  P7
           Phases 1-4 + 04.1 complete; 04.2 lighthouse in progress
```

---

## Phase Status

| Phase | Name | Status | Plans Done |
|-------|------|--------|------------|
| 1 | Foundation | Complete | 2/2 |
| 2 | Core Mechanics | Complete | 2/2 |
| 3 | Game World | Complete | 3/3 |
| 4 | Flood + Lives | Complete | 2/2 |
| 04.1 | Visual Concept | Complete | 2/2 |
| 04.2 | L2 Lighthouse Redesign | In progress | 0/? |
| 5 | Push + HUD | Not started | 0/? |
| 6 | Audio | Not started | 0/? |
| 7 | Hosting | Not started | 0/? |

---

## Performance Metrics

- Requirements defined: 45
- Requirements mapped: 45 (100%)
- Phases complete: 5/7 (+ 04.1)
- Plans complete: 11/11
- v1 features shipped: 0/45

| Phase | Plan | Duration (s) | Tasks | Files |
|-------|------|-------------|-------|-------|
| 01 | 01 | 99 | 3 | 3 |
| 01 | 02 | 110 | 2 | 3 |
| 02 | 01 | 900 | 4 | 5 |
| 02 | 02 | 76 | 3 | 1 |
| 03 | 01 | 97 | 2 | 1 |
| 03 | 02 | 133 | 2 | 1 |
| 03 | 03 | 174 | 2 | 2 |
| 04 | 01 | 76 | 2 | 2 |
| 04 | 02 | 118 | 2 | 2 |
| 04.1 | 01 | 60 | 4 | 4 |
| 04.1 | 02 | — | 1 | 1 |

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Vanilla JS + HTML Canvas only | No framework — runs anywhere, matches school constraint, demonstrates Canvas fundamentals | — |
| 480x640 canvas (portrait) | Matches Doodle Jump proportions; set via JS attributes, never CSS | Phase 1 |
| Semi-fixed timestep with 50 ms delta cap | Prevents physics explosion on tab switch or 120 Hz monitor | Phase 1 |
| State machine first (`start` / `playing` / `gameover`) | Restart without page reload; gates all loop logic; hardest to retrofit | Phase 1 |
| One-way AABB collision | Four-condition check: overlapX + wasAbove(prevBottom) + nowBelow(currBottom) + movingDown(vy>0) | Phase 2 |
| World coordinates for all entities | Camera transform (`ctx.translate`) applied once in render; HUD drawn after `ctx.restore()` | Phase 2 |
| Camera one-way gate: if (newCameraY < cameraY) | cameraY can only decrease — when player falls, newCameraY increases, condition fails, camera holds | Phase 2 |
| Fall detection after updateCamera() | Fall check uses cameraY + canvas.height; must use current frame cameraY, not stale value | Phase 2 |
| Height formula: 528 - maxHeightReached | 528 = player start world Y; maxHeightReached stores minimum Y seen; result = pixels climbed | Phase 2 |
| Push item spawn system DROPPED from MVP | PUSH-02/03 deferred as nice-to-have; Kletter-Kiste (L3 single puzzle box) is the only push element in MVP | Phase 5 |
| Lives system over instant death | More forgiving; makes the push mechanic feel more meaningful | Phase 4 |
| Working title: Soggy Moggy | Renamed from "Cat Flood Jumper" | — |
| Player = Stuffed Cat | Not a real/live cat — specific visual character with floppy limbs, button eyes, stitched seams | Phase 04.1 |
| Placeholders until sprites | Colored rectangles used through Phase 4; real sprites produced after Phase 04.1 | Phase 1–4 |
| canvas sized via JS attributes only | canvas.width = 480; canvas.height = 640 — never CSS; avoids blur at non-1:1 DPR | Phase 1 |
| lastTime = performance.now() before first rAF | Prevents dt spike on frame 1 — initialized outside gameLoop callback | Phase 1 |
| HUD drawn after ctx.restore() — permanent pattern | HUD must always be in screen coordinates; established now so Phase 2 camera doesn't break it | Phase 1 |
| ctx.getContext('2d', { alpha: false }) | Opaque canvas allows fillRect clear without compositing overhead | Phase 1 |
| Math.floor on render positions | Prevents sub-pixel blur in fillRect; applied in renderPlayer | Phase 1 |
| MVP-first approach | Core loop must work before polish; clear MVP boundary established | All phases |
| Visual Concept phase (04.1) | Expert-agent-driven art direction before Phase 5 sprite work; placed after MVP is proven | Phase 04.1 |
| Cat sprite direction: grey-pink, 3-frame jump | Grey-pink coloring; down/middle/high frames driven by bounceTimer in player.js; hitbox 32x32, drawn 96x96 | Phase 04.1 |
| Game language: Spanish | All UI text, screen titles, HUD labels in Spanish for the dramaturgical layer | Phase 5 |
| 3-level structure: Stadt, See, Aufzugschacht | Each level has unique parallax layers and danger mechanic; L4 Freizeitpark DROPPED for MVP | Phase 5 |
| Level-specific parallax per level | bg_far is always the setting silhouette; bg_mid/bg_near slots filled with level-specific sprites; clouds/stars reused across levels | Phase 5 |
| Danger per level: L1=Smog, L2=Flood, L3=Electricity | All three renderers implemented in water.js; hazard dispatcher per GameState.level | Phase 4 |
| Prompting strategy documentation | Two-stage system: auto-maintained log throughout + analysis at project end | All phases |
| Classic script tags (no ES6 modules) | Works on file:// without dev server; matches school example pattern (jumprun, scripteroids) | Phase 1 |
| GamePhase as Object.freeze | Prevents accidental mutation of phase string constants | Phase 1 |
| highScore excluded from resetGame() | Must persist across play sessions so the all-time best survives full game resets | Phase 3 |
| lives excluded from startNextLevel() | Lives carry forward across levels to create a natural difficulty ramp | Phase 3 |
| levelGoalY initialized undefined, set by generateLevelPlatforms() | Decouples GameState init from platform generation; Plan 03-02 owns that value | Phase 3 |
| localStorage wrapped in try/catch | Required for file:// protocol and private mode during development and submission | Phase 3 |
| loadHighScore() called at module bottom | Ensures highScore is populated before any HUD or screen code reads GameState.highScore | Phase 3 |
| GAP_PX=120 (48% of 250px theoretical max jump) | Comfortable platform spacing; hard limit 200px from physics; leaves room for flood pressure | Phase 3 |
| Crumble removal via backward splice in updatePlatforms | setTimeout unreliable under 50ms delta-capped loop; dt-accumulator is deterministic | Phase 3 |
| Collision sets state='cracked' only, never splices | Prevents "modify array during iteration" bug; removal always deferred to updatePlatforms | Phase 3 |
| Level height = LEVEL_BASE_HEIGHT + (level-1)*500 | Level 1=~16 platforms, Level 2=~20; natural ramp without touching flood speed (Phase 4) | Phase 3 |
| keys.shoot included in Phase 1 | Avoids retrofitting input.js when Phase 5 throw mechanic is implemented | Phase 1 |
| e.code over e.key/e.keyCode | Layout-independent (QWERTY/QWERTZ/AZERTY); e.keyCode is deprecated | Phase 1 |
| One-shot Enter key: keys.enter = false immediately after consuming | Prevents screen-skip bug when Enter is held across a phase transition (START, LEVEL_COMPLETE, GAMEOVER) | Phase 3 |
| Score computation moved from renderHUD() into PLAYING update case | GameState.score is always current for both HUD display and level-goal/gameover transitions on the same frame | Phase 3 |
| World objects render during LEVEL_COMPLETE | Player and platforms stay visible behind the level-complete overlay; goal line also visible | Phase 3 |
| takeDamage() does not check iframeTimer — caller owns the guard | Separation of concerns: updateWater() is the collision detector and owns the guard; takeDamage() is a pure "apply damage" function | Phase 4 |
| Water collision at waterY - WAVE_AMPLITUDE | Player hits the visible wave crest, not the invisible mean line — matches what the eye sees | Phase 4 |
| floodSpeed scaled in resetWater(), not per-frame | One-time cost per level start rather than 60x per second | Phase 4 |
| Flash overlay uses inline rgba() not ctx.globalAlpha | Prevents globalAlpha state leak that would make HUD text semi-transparent after damage | Phase 4 |
| Fall-off-bottom respawns at cameraY+60 with JUMP_VELOCITY | Consistent auto-bounce feel on respawn; guarded by iframeTimer to prevent double-damage in same window | Phase 4 |
| renderWater() has its own PLAYING/LEVEL_COMPLETE guard (flat, not nested) | Structurally symmetrical with how renderPlatforms/renderPlayer are guarded; easier to read | Phase 4 |

### Roadmap Evolution

- Phase 04.1 "Visual Concept" inserted after Phase 4: art style, color palette, mood, contrast rules, asset list — produced by expert agents before sprite implementation in Phase 5

### Critical Pitfalls (from research)

1. **Canvas sized via CSS** — always use `canvas.width = 480; canvas.height = 640` via JS or HTML attributes
2. **No delta time** — all velocities must be multiplied by `dt / 1000`; address in Phase 1 or retrofit touches everything
3. **Broken one-way collision** — three simultaneous conditions required; implement and test before procedural generation
4. **Coordinate mismatch** — all entities in world space; one `ctx.translate(0, -cameraY)` in render pass only
5. **No state machine** — define `GameState.phase` before any game logic; write `resetGame()` before Phase 3

### Open Design Questions

| Question | When to Decide |
|----------|----------------|
| What does the push do to the hazard? (splash / visual only) | Phase 5 planning |
| Push cooldown duration | Phase 5 default recommendation: 1-2 seconds |

### Resolved Design Questions

| Question | Resolution |
|----------|------------|
| Does the project need a pause key? | YES — Escape key pauses, implemented with menu (resume/restart/quit) |
| Max jump height in pixels | Variable jump implemented; GAP_PX=120 confirmed reachable |
| How many levels? | 3 levels (L4 Freizeitpark dropped for MVP, 16.03.2026) |
| Danger per level? | L1=Smog, L2=Flood, L3=Electricity — all implemented |

### Todos

- [x] Measure actual max jump height — variable jump implemented, GAP_PX=120 confirmed
- [ ] Decide push mechanic hazard interaction after playtesting — Phase 5 scope
- [ ] Confirm GitHub Pages is enabled on the repository before Phase 7

### Resolved Decisions (Phase 04.1)

- [x] **DECISION-01** — RESOLVED: Grey-pink direction chosen. 3-frame jump animation (down/middle/high) integrated in player.js. Cat1_beishe retired.
- [x] **DECISION-02** — RESOLVED: #5a7a3a approved and implemented. Platform debug colors fully replaced.

### School Formality Todos (deadline 22.04.2026)

- [x] **SCHOOL-01** — Projektplan: `Dokumente_Schule/Ausgefuellt/Projektplan_Julian_Gomez.docx` — DONE
- [x] **SCHOOL-02** — Arbeitsprotokoll: `Dokumente_Schule/Ausgefuellt/Arbeitsprotokoll_Julian_Gomez.docx` — DONE (needs daily updates)
- [x] **SCHOOL-03** — GDD: `Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.md` + `.docx` — DONE
- [ ] **SCHOOL-04** — Create Medienkatalog — list all third-party assets, Claude Code AI usage (with prompts), pixel art tools, any external references
- [ ] **SCHOOL-05** — Create README.md at repo root — name, asset list, startup instructions, where each requirement is met
- [ ] **SCHOOL-06** — Gameplay video — recorded after game is feature-complete (Phase 5 area)
- [ ] **SCHOOL-07** — Selbstständigkeitserklärung (independence declaration, signed) — at submission
- [ ] **SCHOOL-08** — USB folder structure: Endergebnis / Konzeption / Arbeitsdateien / Material — at submission

### Blockers

None.

---

## Session Continuity

**To resume after a break:**
1. Read this file and ROADMAP.md to confirm current phase and status
2. Check which phase is active and what plans are complete
3. Read the active plan file in `.planning/phases/` if it exists
4. Continue from the last incomplete plan step

**Repository:** `C:/Users/Teilnehmer/Desktop/Schule/PRG/Abschlussprojekt_SRH_26`
**Planning files:** `.planning/`
**Last session:** 2026-04-06
**Next action:** Phase 04.2 lighthouse renderer is implemented. Next: `/gsd:plan-phase 04.2` to create the phase plan, then execute platform sprite work + L2 platform concept.

---
*State initialized: 2026-03-03 after roadmap creation*
*Updated: 2026-04-06 — cat spritesheet migration + lighthouse renderer + branch created*
