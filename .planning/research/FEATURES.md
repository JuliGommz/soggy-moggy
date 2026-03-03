# Feature Landscape: Vertical Platformer (Doodle Jump Style)

**Domain:** Browser-based vertical auto-jump platformer with chase mechanic
**Project:** Cat Flood Jumper
**Researched:** 2026-03-03
**Confidence:** HIGH (genre well-established; findings from deep familiarity with Doodle Jump, Icy Tower, Pogo Swing, Alto's Adventure, and similar titles)

---

## Table Stakes

Features players expect from the vertical platformer genre. Missing = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto-jump on platform contact | Core mechanic of the genre — player never presses jump manually | Low | Player lands on platform → immediate upward bounce. No button for jump. |
| Left/right movement control | The only direct player input; must feel immediate and responsive | Low | Arrow keys or A/D. Must have zero input lag. |
| Procedurally generated platforms | Infinite vertical progression without hand-crafted levels | Medium | Platform gap sizing, density, and variety must scale with height |
| Upward camera scroll | Camera follows player upward; falling below camera = death | Low | Camera tracks player center; scrolls only upward, never down |
| Score based on height | Players need a number to chase for replayability | Low | Score = max height reached (in pixels or abstract units) |
| Start screen | Context and entry point; players won't play without it | Low | Game title, start button, optionally controls explanation |
| Game over screen | Closure and score display; loops player back into replayability | Low | Show final score, high score if available, restart button |
| Falling-off-screen death | Standard genre kill condition | Low | Player falls below visible screen edge = game over (or life lost) |
| Platform visual distinction | Players need to instantly read which surfaces are safe | Low | Platforms must contrast clearly with background at a glance |
| Bouncy feel on landing | Core game feel; without it the game feels stiff and wrong | Low-Med | Slight squash/stretch or particle burst on land reinforces feedback |

---

## Project-Specific Table Stakes

These are required by the Cat Flood Jumper concept specifically, not genre-wide.

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| Rising water level | The central tension mechanic; the game's unique hook | Medium | Water rises at increasing speed as score grows; touches water = damage |
| Lives / HP system | Defined in project scope; makes water contact survivable | Low | 3 lives typical; visual indicator (hearts); lose one on water contact |
| Throw mechanic (downward) | Defined in project scope; the cat's active ability | Medium | Player fires an object downward; exact effect TBD (slow water? kill enemies? visual only?) |
| Persistent cat character | The game's visual identity and player avatar | Low | Simple sprite; must be readable at small canvas size |
| Game hosted via static URL | Delivery requirement for submission | Low | GitHub Pages or Netlify; zero backend needed |

---

## Differentiators

Features that distinguish Cat Flood Jumper from generic Doodle Jump clones. Not expected by players, but add meaningful value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Water visual (animated flood) | Visceral urgency — player sees the threat rising below them | Medium | Animated water line (sine wave or ripple) makes threat feel alive |
| Throw object slows/freezes water | Gives throw mechanic strategic depth; creates decision moment | Medium | Timed freeze creates risk/reward: throw now or save for crisis? |
| Platform variety (bounce/crumble/moving) | Breaks monotony; requires player adaptation | Medium | 3-4 types max: normal, crumbling (one-use), moving, spring-boost |
| Cat idle/jump/throw animations | Personality and charm; makes game feel polished beyond prototype | Medium | Minimal sprite frames needed: idle, jump arc, throw |
| Water damage visual feedback | Player clearly sees HP loss; reduces frustration | Low | Screen flash red or cat blinks when taking water damage |
| Speed escalation over time | Difficulty curve; game becomes increasingly tense | Low | Water rise speed increases every N seconds or score threshold |
| Particle effects on landing/throw | Juice — makes the game feel satisfying to play | Low-Med | Small burst on land, arc trail on thrown object |

---

## Anti-Features

Things to deliberately NOT build for v1. Each entry has a reason and an alternative.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Online leaderboard | Requires backend (Node/database); out of scope per PROJECT.md | LocalStorage high score only — same player engagement, zero infrastructure |
| Mobile / touch controls | PROJECT.md explicitly out of scope; adds event handling complexity | Desktop keyboard-only; document this on start screen |
| Enemy characters | Adds AI, hit detection against moving targets, sprite work; scope creep | Rising water IS the enemy — simpler, more thematically coherent |
| Power-up inventory system | Inventory UI, item persistence, stacking logic — disproportionate to scope | Single consumable throw per cooldown (no inventory needed) |
| Multiple playable characters | Character selection screen, balancing, extra sprites — no return for v1 | One cat, one feel — personality through animation not selection |
| Story / cutscenes | Narrative game is a different product; adds no gameplay value here | Title screen art establishes theme without cutscenes |
| Sound settings / music player | Audio settings panel adds UI complexity; not graded | Single background loop + SFX; hardcoded volume or muted by default |
| Level editor | PROJECT.md explicitly out of scope | Procedural generation handles replayability |
| Save system / continue | No meaningful game state to persist between sessions in a prototype | LocalStorage high score is sufficient persistence |
| Multiple difficulty modes | Mode selection adds a decision before the fun; adds balancing work | Single difficulty that escalates internally via speed curve |
| Multiplayer | PROJECT.md explicitly out of scope | — |

---

## Feature Dependencies

```
Start Screen
  └── Game Loop starts
        ├── Platform Generation → Camera Scroll → Score update (all coupled)
        ├── Cat Physics (auto-jump) → requires Platform Generation
        ├── Rising Water → requires Camera Scroll reference point
        │     └── Water Damage → requires Lives System
        │           └── Lives System → Game Over condition
        ├── Throw Mechanic → requires Cat position + downward projectile physics
        │     └── (optional) Throw effect on Water → requires Water system
        └── Game Over Screen
              └── Score display → requires Score system
                    └── LocalStorage high score → requires Score system
```

**Critical path:** Platform generation + camera scroll + cat auto-jump physics. Everything else is additive.

---

## MVP Recommendation

Build in this priority order:

1. **Cat physics + auto-jump** — nothing is playable without this
2. **Platform generation + camera scroll** — the game world
3. **Falling = game over** — first complete loop
4. **Score display** — gives the loop a goal
5. **Start screen + game over screen** — makes it a presentable game
6. **Rising water** — the project's defining feature; add once base loop is solid
7. **Lives system** — pairs with water; keeps game from being too punishing
8. **Throw mechanic** — the unique ability; add after water is working
9. **Platform variety** (crumbling, moving) — depth without rewrite
10. **Juice layer** — particles, animations, screen flash — add last

**Defer with clear rationale:**

| Deferred Feature | Reason |
|-----------------|--------|
| Throw effect on water | Throw mechanic effect is explicitly undefined in PROJECT.md; implement throw first, decide effect in playtesting |
| Cat multi-frame animations | Sprite work can be added after logic works; placeholder colored rect is fine in early build |
| Water visual animation | Logic-correct water (rising rectangle) before visual water (animated wave) |
| LocalStorage high score | Nice to have; add after game over screen is complete |

---

## Genre Reference Points

These titles define the genre conventions this project draws from:

| Game | What It Contributes to Genre Definition |
|------|----------------------------------------|
| Doodle Jump (2009, Lima Sky) | Auto-jump on contact, procedural platforms, tilt/directional input, enemy shooting, score = height — the genre archetype |
| Icy Tower (2001, Free Lunch Design) | Platform momentum, combo scoring, speed escalation as you climb higher |
| Pogo Swing | Physics-based vertical movement variation |
| Alto's Adventure / Odyssey | Chase mechanic (avalanche) proving urgency-from-below is a proven design pattern |
| Flappy Bird (adjacent) | Demonstrates that extreme simplicity + clear death condition = high replayability |

**Key insight from genre history:** The genre's replayability comes from the tension between player skill improving and score ceiling being always just out of reach. The chase mechanic (water) amplifies this by adding a second pressure axis (time) on top of the spatial one (height).

---

## Confidence Notes

- Table stakes: HIGH — drawn from direct analysis of 5+ shipping genre titles
- Differentiators: HIGH — identified from gap between base genre and this project's stated hooks
- Anti-features: HIGH — each justified by PROJECT.md constraints or disproportionate scope cost
- Throw mechanic effect: LOW — PROJECT.md itself flags this as undefined; no research can resolve it before playtesting

---

## Sources

- PROJECT.md: `C:/Users/Teilnehmer/Desktop/Schule/PRG/Abschlussprojekt_SRH_26/.planning/PROJECT.md`
- Genre knowledge: Doodle Jump (Lima Sky, 2009), Icy Tower (Free Lunch Design, 2001), Alto's Adventure (Snowman, 2015)
- Web research: blocked during this session — findings based on training knowledge of the genre (cutoff August 2025, genre is stable and well-documented)
