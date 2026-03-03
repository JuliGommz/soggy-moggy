# Requirements: Cat Flood Jumper

**Defined:** 2026-03-03
**Core Value:** A playable, complete gameplay loop: cat jumps up, water rises below, tension builds — the game feels real from first play.

## v1 Requirements

### Core Loop

- [ ] **LOOP-01**: Player's cat auto-jumps upward when landing on any platform (no manual jump input)
- [ ] **LOOP-02**: Player can move cat left and right using arrow keys or A/D keys
- [ ] **LOOP-03**: Platforms are procedurally generated as the player climbs higher
- [ ] **LOOP-04**: Camera scrolls upward with the player and never scrolls back down
- [ ] **LOOP-05**: Player falling below the bottom edge of the camera costs 1 life
- [ ] **LOOP-06**: Player score equals the maximum height reached during the run
- [ ] **LOOP-07**: Score is displayed in real-time on the HUD during gameplay

### Screens & Flow

- [ ] **SCRN-01**: Start screen displays game title, controls explanation, and a start button
- [ ] **SCRN-02**: Game over screen displays final score, all-time high score, and a restart button
- [ ] **SCRN-03**: High score is stored in LocalStorage and survives browser close/reopen

### Flood Mechanic

- [ ] **FLOOD-01**: Rising water level chases the player upward from below
- [ ] **FLOOD-02**: Water speed increases over time, creating escalating difficulty
- [ ] **FLOOD-03**: Touching the water costs 1 life (not instant game over)
- [ ] **FLOOD-04**: Water displays as an animated wave (sine-wave ripple on the surface)

### Lives System

- [ ] **LIFE-01**: Player starts with 3 lives, displayed as hearts on the HUD
- [ ] **LIFE-02**: Player receives a brief visual indicator (screen flash) when taking damage
- [ ] **LIFE-03**: Losing all 3 lives triggers the game over screen

### Throw Mechanic

- [ ] **THROW-01**: Player can throw an object downward (button TBD — spacebar or click)
- [ ] **THROW-02**: Thrown object has visible projectile travel downward on screen
- [ ] **THROW-03**: Throw effect on game world (water interaction) decided in playtesting — placeholder accepted for submission

### Platforms

- [ ] **PLAT-01**: Normal platforms allow unlimited jumps and are visually distinct from background
- [ ] **PLAT-02**: Crumbling platforms break after one landing (visual crack then disappear)
- [ ] **PLAT-03**: Platform gap sizing ensures the cat can always reach the next platform

### Visual & Audio

- [ ] **VIS-01**: Cat character is a simple hand-drawn static sprite (not a colored rectangle)
- [ ] **VIS-02**: Jump sound plays on every platform bounce
- [ ] **VIS-03**: Damage sound plays when player takes water damage
- [ ] **VIS-04**: Game over audio sting plays when all lives are lost
- [ ] **VIS-05**: Background music loop plays during gameplay

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
| LOOP-01 | Phase 2 | Pending |
| LOOP-02 | Phase 2 | Pending |
| LOOP-03 | Phase 3 | Pending |
| LOOP-04 | Phase 2 | Pending |
| LOOP-05 | Phase 2 | Pending |
| LOOP-06 | Phase 3 | Pending |
| LOOP-07 | Phase 3 | Pending |
| SCRN-01 | Phase 3 | Pending |
| SCRN-02 | Phase 3 | Pending |
| SCRN-03 | Phase 3 | Pending |
| FLOOD-01 | Phase 4 | Pending |
| FLOOD-02 | Phase 4 | Pending |
| FLOOD-03 | Phase 4 | Pending |
| FLOOD-04 | Phase 4 | Pending |
| LIFE-01 | Phase 4 | Pending |
| LIFE-02 | Phase 4 | Pending |
| LIFE-03 | Phase 4 | Pending |
| THROW-01 | Phase 5 | Pending |
| THROW-02 | Phase 5 | Pending |
| THROW-03 | Phase 5 | Pending |
| PLAT-01 | Phase 3 | Pending |
| PLAT-02 | Phase 3 | Pending |
| PLAT-03 | Phase 3 | Pending |
| VIS-01 | Phase 5 | Pending |
| VIS-02 | Phase 5 | Pending |
| VIS-03 | Phase 5 | Pending |
| VIS-04 | Phase 5 | Pending |
| VIS-05 | Phase 5 | Pending |
| HOST-01 | Phase 6 | Pending |
| HOST-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation — traceability populated*
