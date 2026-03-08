---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-03-06T14:00:00Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 11
  completed_plans: 9
---

# State: Cat Flood Jumper

**Last updated:** 2026-03-06
**Updated by:** Phase 04.1 planned — 2 plans created (04.1-01 style guide + code fixes, 04.1-02 sprite export + asset list)

---

## Project Reference

**Core Value:** A playable, complete gameplay loop: cat jumps up, water rises below, tension builds — the game feels real from first play.

**Current Focus:** Phase 04.1 (Visual Concept) — planned, ready to execute

**Stack:** Vanilla JavaScript ES2022+ + HTML Canvas 2D (480x640) + Web Audio API + GitHub Pages

---

## Current Position

**Active Phase:** 04.1 — Visual Concept (IN PROGRESS)
**Active Plan:** 04.1-02 — sprite export + ASSET_LIST.md (on hold: sprite direction undecided)
**Phase Status:** Phase 04.1 in progress — 1/2 plans done

```
Progress: [x][x][x][x][ ][ ]  4/6 main phases complete
           P1  P2  P3  P4  P5  P6
           Phase 04.1 (visual concept) in progress
```

---

## Phase Status

| Phase | Name | Status | Plans Done |
|-------|------|--------|------------|
| 1 | Foundation | Complete | 2/2 |
| 2 | Core Mechanics | Complete | 2/2 |
| 3 | Game World | Complete | 3/3 |
| 4 | Flood + Lives | Complete | 2/2 |
| 04.1 | Visual Concept | Planned | 0/2 |
| 5 | Throw + Audio | Not started | 0/? |
| 6 | Hosting | Not started | 0/? |

---

## Performance Metrics

- Requirements defined: 30
- Requirements mapped: 30 (100%)
- Phases complete: 4/6
- Plans complete: 9/?
- v1 features shipped: 0/30

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
| Throw effect on water: TBD | Decide after water mechanic is working in Phase 4; playtesting informs the design | Phase 5 |
| Lives system over instant death | More forgiving; makes the throw mechanic feel more meaningful | Phase 4 |
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
| What does the throw do to the water? (freeze / slow / visual only) | Now — Phase 4 is complete, playtesting is possible |
| Throw cooldown duration | Phase 5 default recommendation: 1-2 seconds |
| Does the project need a pause key? | Phase 5 only if time permits |
| Max jump height in pixels (needed for gap constraint formula) | Measure in Phase 2 before Phase 3 starts |

### Todos

- [ ] Measure actual max jump height (pixels) after Phase 2 physics are implemented — required for PLAT-03 gap constraint
- [ ] Decide throw mechanic water interaction after Phase 4 playtesting — Phase 4 is now complete, decision can be made
- [ ] Confirm GitHub Pages is enabled on the repository before Phase 6

### Open Decisions (blocking Phase 04.1 execution)

- [ ] **DECISION-01** — Cat sprite: Keep Cat1_beishe (beige, existing) with minor refinements only, OR redesign sprite? Plan 04.1-01 assumes keep-and-refine. Must confirm before executing.
- [ ] **DECISION-02** — Platform color: Approve #5a7a3a (earthy dark green) replacing debug green #27ae60? Already written into 04.1-01-PLAN.md. Must confirm before executing.

### School Formality Todos (deadline 22.04.2026)

- [ ] **SCHOOL-01** — Create Projektplan from template (`Dokumente_Schule/Vorlagen/Projektplan_Abschlussarbeit_Vorlage.docx`) — worth 20pts in Projektmanagement grade
- [ ] **SCHOOL-02** — Create Arbeitsprotokoll from template (`Dokumente_Schule/Vorlagen/Arbeitsprotokoll_Abschlussarbeit_Vorlage.docx`) — retroactive entries from 04.03.2026 to current date, then maintained daily
- [ ] **SCHOOL-03** — Create GDD (Grobkonzept + Feinkonzept + Designkonzept) — Designkonzept is always separate; Phase 04.1 Style Guide can become the Designkonzept basis
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
**Last session:** 2026-03-06 — Planned Phase 04.1 Visual Concept: spawned researcher (inspected existing .pxo sprites and PixelArt/Paralax/Layer1 assets), created 16-color palette from Cat1_beishe colors, produced 04.1-01-PLAN.md and 04.1-02-PLAN.md (verified PASS). Phase 04.1 is planned and ready to execute.
**Next action:** Run `/gsd:execute-phase 04.1` — Wave 1 (04.1-01) is fully autonomous. Wave 2 (04.1-02) requires Pixelorama sprite export at the human checkpoint.

---
*State initialized: 2026-03-03 after roadmap creation*
*Updated: 2026-03-06 after 04-02-PLAN.md execution*
