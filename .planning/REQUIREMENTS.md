# Requirements: Soggy Moggy

**Defined:** 2026-03-03
**Core Value:** A playable, complete gameplay loop: cat jumps up, water rises below, tension builds — the game feels real from first play.

## v1 Requirements

### Core Loop

- [x] **LOOP-01**: Player's cat jumps on manual input (Space/left-click) while `onGround === true` — no auto-jump
- [x] **LOOP-02**: Player can move cat left and right using arrow keys or A/D keys
- [x] **LOOP-03**: Platforms are procedurally generated as the player climbs higher
- [x] **LOOP-04**: Camera scrolls upward with the player and never scrolls back down
- [x] **LOOP-05**: Player falling below the bottom edge of the camera costs 1 life
- [x] **LOOP-06**: Player score equals the maximum height reached within the current level
- [x] **LOOP-07**: Score is displayed in real-time on the HUD during gameplay

### Level Structure

- [x] **LEVEL-01**: Each level has a defined height goal — reaching it completes the level (not a game over)
- [x] **LEVEL-02**: Level-complete screen displays the score for that level and transitions to the next level
- [x] **LEVEL-03**: Platforms are procedurally generated within each level's bounded height range (not infinite)
- [x] **LEVEL-04**: Flood speed resets or adjusts per level to create escalating difficulty across levels

### Screens & Flow

- [x] **SCRN-01**: Start screen displays game title, controls explanation, and a start button
- [x] **SCRN-02**: Game over screen displays final score, all-time high score, and a restart button
- [x] **SCRN-03**: High score is stored in LocalStorage and survives browser close/reopen

### Flood Mechanic

- [x] **FLOOD-01**: Rising water level chases the player upward from below
- [x] **FLOOD-02**: Water speed increases over time, creating escalating difficulty
- [x] **FLOOD-03**: Touching the water costs 1 life (not instant game over)
- [x] **FLOOD-04**: Water displays as an animated wave (sine-wave ripple on the surface). NOTE: L1 smog / L2 electricity verwenden dieselbe hazard.js-Logik; Wave ist L3-spezifisch.

### Lives System

- [x] **LIFE-01**: Player starts with 3 lives, displayed as hearts on the HUD
- [x] **LIFE-02**: Player receives a brief visual indicator (screen flash) when taking damage
- [x] **LIFE-03**: Losing all 3 lives triggers the game over screen

### Action Key (Z / right-click)

- [x] **ACTION-01**: Z / right-click triggers action animation; sprite switches to push_rise or push_peak (250 ms); used for balloon catch, wasp defense, and end-trigger. Frame names locked in code.
- [ ] ~~**PUSH-02**: Push mechanic + item spawn system + item physics~~ — **DROPPED** (gestrichen)
- [ ] ~~**PUSH-03**: Item-hazard interaction (splash, bonus points, floating text)~~ — **DROPPED** (gestrichen)
- [ ] ~~**PUSH-04**: Kletter-Kiste as pushable object~~ — **DROPPED**; Kletter-Kiste appears as static prop in L2 outro only

### Platforms

- [x] **PLAT-01**: Normal platforms allow unlimited jumps and are visually distinct from background
- [x] **PLAT-02**: Crumbling platforms break after one landing (visual crack then disappear)
- [x] **PLAT-03**: Platform gap sizing ensures the cat can always reach the next platform

### Visual & Audio

- [x] **VIS-01**: Cat character is a simple hand-drawn static sprite (not a colored rectangle)
- [ ] **VIS-02**: Jump sound plays on every platform bounce (Phase 6 — infrastructure ready; SFX call audit pass pending)
- [ ] **VIS-03**: Damage sound plays when player takes water damage (Phase 6 — infrastructure ready; SFX call audit pass pending)
- [x] **VIS-04**: Game over audio sting plays when all lives are lost (Phase 6 — wired in _onPhaseChange 2026-04-26)
- [x] **VIS-05**: Background music loop plays during gameplay (Phase 6 — wired in _onPhaseChange per level 2026-04-26)

### Hosting

- [ ] **HOST-01**: Game is deployed to a static host (GitHub Pages or equivalent)
- [ ] **HOST-02**: Game is accessible via a shareable URL that works in any modern desktop browser

## v2 Requirements

### Polish

- **POL-01**: Cat multi-frame animation (idle, jump arc, throw pose)
- **POL-02**: Particle burst on platform landing
- **POL-03**: Particle trail on thrown projectile
- **POL-04**: Moving platform type (slides left/right)
- **POL-05**: Spring/bounce platform type (extra height boost)
- **POL-06**: HiDPI / Retina canvas scaling

### Audio

- **AUD-01**: Volume control or mute toggle
- **AUD-02**: Separate SFX and music volume sliders

### Gameplay

- **GAME-01**: Difficulty mode selection (easy / hard)
- **GAME-02**: Multiple playable characters / skins
- **GAME-03**: Achievement system (reach X height, survive N seconds, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Online leaderboard | Requires backend infrastructure; out of scope per PROJECT.md |
| Mobile / touch controls | Desktop keyboard-only per PROJECT.md; adds significant complexity |
| Enemy characters | Rising water serves as the pressure mechanic — enemies would add AI complexity without adding coherence |
| Multiplayer | Explicitly out of scope per PROJECT.md |
| Level editor | Explicitly out of scope per PROJECT.md |
| Story / cutscenes | Narrative adds no gameplay value; not a graded criterion |
| Power-up inventory system | Disproportionate UI complexity for one-button throw mechanic |
| Save / continue system | No meaningful session state to persist beyond high score |
| Server-side anything | Static site constraint — no Node, no database |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOOP-01 | Phase 2 | Complete (02-01) |
| LOOP-02 | Phase 2 | Complete (02-01) |
| LOOP-03 | Phase 3 | Complete |
| LOOP-04 | Phase 2 | Complete |
| LOOP-05 | Phase 2 | Complete |
| LOOP-06 | Phase 3 | Complete (03-03) |
| LOOP-07 | Phase 3 | Complete (03-03) |
| LEVEL-01 | Phase 3 | Complete (03-03) |
| LEVEL-02 | Phase 3 | Complete (03-03) |
| LEVEL-03 | Phase 3 | Complete |
| LEVEL-04 | Phase 4 | Complete |
| SCRN-01 | Phase 3 | Complete (03-03) |
| SCRN-02 | Phase 3 | Complete (03-03) |
| SCRN-03 | Phase 3 | Complete (03-01) |
| FLOOD-01 | Phase 4 | Complete |
| FLOOD-02 | Phase 4 | Complete |
| FLOOD-03 | Phase 4 | Complete |
| FLOOD-04 | Phase 4 | Complete |
| LIFE-01 | Phase 4 | Complete |
| LIFE-02 | Phase 4 | Complete |
| LIFE-03 | Phase 4 | Complete |
| PUSH-01 | Mechanics branch | Complete |
| PUSH-02 | — | DROPPED (MVP) |
| PUSH-03 | — | DROPPED (MVP) |
| PUSH-04 | — | DROPPED (Kletter-Kiste static prop only) |
| PLAT-01 | Phase 3 | Complete |
| PLAT-02 | Phase 3 | Complete |
| PLAT-03 | Phase 3 | Complete |
| VIS-01 | Phase 04.1 | Complete |
| VIS-02 | Phase 6 | Pending |
| VIS-03 | Phase 6 | Pending |
| VIS-04 | Phase 6 | Pending |
| VIS-05 | Phase 6 | Pending |
| HOST-01 | Phase 7 | Pending |
| HOST-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-04-21 — Drift-Fix: LOOP-04/05, LEVEL-04, FLOOD-01..04, LIFE-01..03 auf Complete gesetzt (waren fälschlich Pending). VIS-02..05 auf Pending zurückgesetzt (waren fälschlich Complete — Phase 6 Audio nicht implementiert). HOST-01/02 Mapping Phase 6 → Phase 7 korrigiert.*
*Updated 2026-04-26: Phase 5 partial — outro triggers (L1 pinwheel + L2 bell + L3 lever) and difficulty system shipped. ACTION-01/HUD-01/HUD-02/VIS-06/VIS-08 already marked complete in upstream traceability. HUD-03 (Soggy Moggy title on start/gameover) to be verified during Start-Menu work.*
*Updated 2026-04-26 (audio session): VIS-04 + VIS-05 marked complete — both wired via _onPhaseChange in main.js. VIS-02 + VIS-03 notes updated: HTMLAudio infrastructure ready; SFX calls need audit pass in gameplay files (player.js, hazards.js) to complete.*
