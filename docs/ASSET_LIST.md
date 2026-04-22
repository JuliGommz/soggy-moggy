# Soggy Moggy — Asset List

**Created:** 2026-03-09 (Phase 04.1)
**Updated:** 2026-04-21 — Phase-8 Doku-Sync: Level-Ordner umbenannt (L2 Shaft / L3 Sea), `characters/` + `ui/hud/` Gruppen, L2 shaft Jump-Platform Sheet ergänzt
**Purpose:** Source of truth for all game assets. Every asset, its real filename, status, and where it's used in code.

---

## Status Legend

- **wired** — file in repo, referenced in code, working
- **exists** — file in repo, not yet referenced in code
- **needs-draw** — asset does not exist yet, must be created
- **canvas-drawn** — rendered via code, no sprite file needed

---

## Cat Character Sprites (`PixelArt/characters/cat/`)

All frames loaded in `src/player.js` and wired to the frame selection logic.

| Frame | File | Size | Status |
|-------|------|------|--------|
| Idle (standing) | `PixelArt/characters/cat/idle.png` | 64x64 | wired |
| Rise (ascending) | `PixelArt/characters/cat/rise.png` | 64x64 | wired |
| Peak (airborne) | `PixelArt/characters/cat/peak.png` | 64x64 | wired |
| Push rise (Z, low) | `PixelArt/characters/cat/push_rise.png` | 64x64 | wired |
| Push peak (Z, high) | `PixelArt/characters/cat/push_peak.png` | 64x64 | wired |
| Walk frame 1 | `PixelArt/characters/cat/walk_1.png` | 64x64 | wired |
| Walk frame 2 | `PixelArt/characters/cat/walk_2.png` | 64x64 | wired |

Rendering: 96x96 display (3x hitbox 32x32), bottom-aligned, `player.flipped` triggers ctx.scale(-1,1) for right-facing.

---

## Background Layers — Shared (`PixelArt/backgrounds/shared/`)

All layers loaded in `src/background.js`. 5-layer parallax system with day/night crossfade.

| Layer | File | Size | Status |
|-------|------|------|--------|
| Day sky | `PixelArt/backgrounds/shared/sky_day.png` | 480x640 | wired |
| Night sky | `PixelArt/backgrounds/shared/sky_night.png` | 480x640 | wired |
| Stars | `PixelArt/backgrounds/shared/stars.png` | 480x640, tileH=363 | wired |
| Clouds bright | `PixelArt/backgrounds/shared/clouds_bright.png` | 480x220, tileH=186 | wired |
| Clouds dark | `PixelArt/backgrounds/shared/clouds_dark.png` | 480x640, tileH=210 | wired |

---

## Level 1 — Stadt / City (`PixelArt/backgrounds/level1_city/`)

Building composition sprites loaded in `src/background.js` for L1 background rendering.

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Building wall | `building_wall.png` | wired | Main wall texture, tiled vertically |
| Windows | `windows.png` | wired | Window rows overlaid on wall |
| Entrance + garbage | `entrance_garbage.png` | wired | Ground-level entrance area |
| Building door | `building_door.png` | wired | Door element (invisible platform collider at x=280, y=423, w=140) |
| Trash bin | `trash_bin.png` | wired | Trash bins (invisible platform collider at x=85, y=465, w=171) |
| Cornice | `cornice.png` | wired | Ledge element (invisible platform collider at x=28, y=294, w=422) |
| Building roof | `building_roof.png` | wired | Rooftop element (finish trigger area) |
| City silhouette (bg_far) | — | DROPPED | Dropped for MVP |

---

## Level 2 — Aufzugschacht / Elevator Shaft (`PixelArt/backgrounds/level_2_shaft/`)

> **Hinweis (2026-04-21):** L2 und L3 wurden im Cleanup getauscht. Früher war L2=Offener See, L3=Aufzugschacht. Jetzt: L2=Aufzug, L3=Offener See.

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Elevator interior | `elevator.png` | wired | Starting area (world bottom) |
| Shaft bg bottom | `shaft_bg_bottom.png` | wired | Shaft bottom section |
| Shaft bg mid (var 1) | `shaft_bg_mid1.png` | wired | Shaft mid section variant 1 |
| Shaft bg mid (var 2) | `shaft_bg_mid2.png` | wired | Shaft mid section variant 2 |
| Shaft bg top | `shaft_bg_top.png` | wired | Shaft top + golden bar + hatch |
| Pipes bottom | `pipes_bottom.png` | wired | Mid-layer pipes, bottom segment (first pipe above elevator ceiling) |
| Pipes mid | `pipes_mid.png` | wired | Mid-layer pipes, repeating tile |
| Pipes top | `pipes_top.png` | wired | Mid-layer pipes, top segment |

---

## Level 3 — Offener See / Leuchtturm (`PixelArt/backgrounds/level_3_sea/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Sea launchpad / shore | `sea_launchpad.png` | wired | Shoreline background |
| Sun | `sun.png` | wired | Sun element with pulse animation |
| Lighthouse sheet | `lighthouse_sheet.png` | wired | 9-sprite sheet (base, mid_1–mid_7, top cap) |
| Rocket sprites (all) | ~~rocket_bottom, rocket_mid_top, rocket_top, rocket_scaffolding_*~~ | REMOVED (Phase 6 code-cleanup 2026-04-21) | Rocket-Subsystem aus `background.js` entfernt |

---

## Platforms (`PixelArt/platforms/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Jalousie sprite sheet (L1) | `platforms/level1_city/jalousie_sheet.png` | wired | 3-part: capL + tiled mid + capR, 7 rows |
| Jalousie parts reference | `platforms/level1_city/jalousie_parts.png` | exists | Reference sheet |
| L2 shaft jump-platforms | `platforms/level_2_lift/jump_plattforms.png` | wired | 480x258 sheet, 9 variants (L/C/R × L/M/S size tiers); see MEMORY.md „L2 Shaft Platforms" |
| L3 platforms | — | canvas-drawn | Lighthouse bridges drawn in `src/platforms.js` L3 branch (no sprite) |

---

## Collectibles (`PixelArt/collectibles/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Balloon extra-life | `balloon.png` | wired | 150x220 source, drawn 70x106; Lissajous bob pattern |

## UI / HUD Assets (`PixelArt/ui/hud/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| HUD lives icon | `life_icon.png` | wired | 20x16 per life in HUD (top-right + game-over screen) |
| Plush cat reference | `life_plush.png` | exists | Reference for balloon sub-zone (not loaded by game) |

## Wasp Enemy Sprites (`PixelArt/characters/wasp/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Wasp sheet | `wasp_sheet.png` | wired | 252x44, 4 frames of 63x44; loaded in `src/enemies.js` |
| Wasp frame references | `einzel_sprites/wasp_body*.png` | exists | Individual frames, not loaded by game |

---

## Finish Trigger Objects (canvas-drawn in `src/main.js`)

| Object | Level | Status | Notes |
|--------|-------|--------|-------|
| Pinwheel (spinning) | L1 | canvas-drawn | Weather vane style, rotates on trigger |
| Bell (swaying) | L2 | canvas-drawn | Sways on trigger |
| Lever (snapping) | L3 | canvas-drawn | Snaps to turn off electricity |
| Golden slab platform | All | canvas-drawn | 100px wide, right-aligned (x=360) |

---

## Hazards (canvas-drawn in `src/water.js`)

| Hazard | Level | Status | Notes |
|--------|-------|--------|-------|
| Smog | L1 | canvas-drawn | 3 gradient bands + cosine billowing edge + 2-pass glow |
| Flood | L2 | canvas-drawn | Sine wave surface |
| Electricity | L3 | canvas-drawn | 3-layer bolt system with pulsing alpha |

---

## UI / HUD Elements

| Asset | Status | Notes |
|-------|--------|-------|
| Lives (cat icon) | wired | `life_icon.png`, drawn as pixel icons |
| Score display | canvas-drawn | System font, screen-space after ctx.restore() |
| Height display | canvas-drawn | System font |
| Pause menu | canvas-drawn | Overlay with 3 options |
| Level complete screen | canvas-drawn | Title + score + 4 menu options |
| Game over screen | canvas-drawn | Title + high score |
| Start screen | canvas-drawn | Title + controls hint |

---

## Still Missing (all levels)

| Asset | Priority | Notes |
|-------|----------|-------|
| Dialogue bubble PNGs (8 stk) | Blocker vor Abgabe | `PixelArt/thought_bubbles/dialogues/` — l1_intro.png … life_wasp.png; Text in Illustrator gebacken |
| Pushable object sprites | Post-deadline | 3 types (score, bonus, cultural) — nicht im MVP |
| Cultural element sprites | TBD | Latin American/Colombian themed |
| Title screen art | TBD | Custom artwork for start screen |

---

## Palette Reference

Full palette in `docs/STYLE_GUIDE.md`.
Importable as `PixelArt/_dev/_palette/soggy_moggy.gpl` (16 colors).
