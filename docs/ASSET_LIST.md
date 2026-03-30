# Soggy Moggy — Asset List

**Created:** 2026-03-09 (Phase 04.1)
**Updated:** 2026-03-30 — naming convention sync (snake_case, collectibles folder)
**Purpose:** Source of truth for all game assets. Every asset, its real filename, status, and where it's used in code.

---

## Status Legend

- **wired** — file in repo, referenced in code, working
- **exists** — file in repo, not yet referenced in code
- **needs-draw** — asset does not exist yet, must be created
- **canvas-drawn** — rendered via code, no sprite file needed

---

## Cat Character Sprites (`PixelArt/cat/`)

All frames loaded in `src/player.js` and wired to the frame selection logic.

| Frame | File | Size | Status |
|-------|------|------|--------|
| Idle (standing) | `PixelArt/cat/idle.png` | 64x64 | wired |
| Rise (ascending) | `PixelArt/cat/rise.png` | 64x64 | wired |
| Peak (airborne) | `PixelArt/cat/peak.png` | 64x64 | wired |
| Push rise (Z, low) | `PixelArt/cat/push_rise.png` | 64x64 | wired |
| Push peak (Z, high) | `PixelArt/cat/push_peak.png` | 64x64 | wired |
| Walk frame 1 | `PixelArt/cat/walk_1.png` | 64x64 | wired |
| Walk frame 2 | `PixelArt/cat/walk_2.png` | 64x64 | wired |

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

## Level 2 — Offener See / Open Sea (`PixelArt/backgrounds/level2_see/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Sea launchpad / shore | `sea_launchpad.png` | wired | Shoreline background — keep for now, review in Phase 04.2 |
| Sun | `sun.png` | wired | Sun element |
| Rocket sprites (all) | ~~rocket_bottom, rocket_mid_top, rocket_top, rocket_scaffolding_*~~ | RETIRED | Replaced by Lighthouse in Phase 04.2 |
| Lighthouse building | — | needs-draw | Phase 04.2 — central vertical structure, stone/brick |
| Lighthouse surroundings | — | needs-draw | Phase 04.2 — rocks, sea, environment |
| L2 platform sprites | — | needs-draw | Phase 5 — rocky ledges / wave-breaker steps (new concept) |

---

## Level 3 — Aufzugschacht / Elevator Shaft

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Elevator cabin | `PixelArt/_wip/Elevator.pxo` | WIP (no PNG) | Starting area |
| Elevator shaft | `PixelArt/_wip/Elevator_shaft.pxo` | WIP (no PNG) | Main climbing area |
| Shaft backwall | `PixelArt/_wip/Elevator_shaft_Backwall.pxo` | WIP (no PNG) | Background layer |
| Wall-step platforms | — | needs-draw | Ledge steps on shaft walls |
| Mid-layer (cables/pipes) | — | needs-draw | Parallax mid-layer, Julian's concept |

---

## Platforms (`PixelArt/platforms/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Jalousie sprite sheet (L1) | `platforms/level1_city/jalousie_sheet.png` | wired | 3-part: capL + tiled mid + capR, 7 rows |
| Jalousie parts reference | `platforms/level1_city/jalousie_parts.png` | exists | Reference sheet |
| L2 platforms | — | needs-draw | Rocket tower arms |
| L3 platforms | — | needs-draw | Shaft wall ledge steps |

---

## Collectibles (`PixelArt/collectibles/`)

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Balloon extra-life | `balloon.png` | wired | 150x220 source, drawn 70x106; Lissajous bob pattern |
| HUD lives icon | `life_icon.png` | wired | 20x16 per life in HUD (top-right) |
| Plush cat reference | `life_plush.png` | exists | Reference for balloon sub-zone |

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
| L2 platform sprites | Phase 5 | Lighthouse platform elements (rocky ledges / wave-breaker steps) |
| L3 shaft background PNG exports | Phase 5 | PXO files exist in _wip/ |
| L3 wall-step platform sprites | Phase 5 | Ledge steps on shaft walls |
| L3 mid-layer (cables/pipes) | Phase 5 | Julian's concept, confirmed |
| Pushable object sprites | Phase 5 | 3 types (score, bonus, cultural) |
| Cultural element sprites | TBD | Latin American/Colombian themed |
| Title screen art | TBD | Custom artwork for start screen |

---

## Palette Reference

Full palette in `docs/STYLE_GUIDE.md`.
Importable as `PixelArt/_dev/_palette/soggy_moggy.gpl` (16 colors).
