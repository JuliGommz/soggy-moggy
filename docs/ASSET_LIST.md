# Soggy Moggy — Phase 5 Asset List

**Created:** 2026-03-09 (Phase 04.1)
**Updated:** 2026-03-09 — reflects actual integrated sprites and 4-level design
**Purpose:** Source of truth for Phase 5. Every asset, its real filename, status, and which Phase 5 plan uses it.

---

## How to read this list

- **exists + wired** — file in repo, referenced in code, working
- **exists + unwired** — file in repo, not yet referenced in any source file
- **needs-draw** — asset does not exist yet, must be drawn in Pixelorama
- **needs-draw (per level)** — one variant per level needed

---

## Cat Character Sprites

### Jump animation (3 frames) — INTEGRATED

All three frames are loaded in `src/player.js` and wired to the bounce animation timer.

| Frame | File | Size | Status |
|-------|------|------|--------|
| Contact / down | `PixelArt/Cats/Cat1_grey-pink_down-jump.png` | 64x64 | exists + wired |
| Launch / middle | `PixelArt/Cats/Cat1_grey-middle-jump.png` | 64x64 | exists + wired |
| Peak / high | `PixelArt/Cats/Cat1_grey-pink_high-jump.png` | 64x64 | exists + wired |

Rendering: 96x96 display (3× hitbox), bottom-aligned, horizontal flip on left movement.

### Throw pose — EXISTS, not yet wired

| Frame | File | Size | Status | Phase 5 plan |
|-------|------|------|--------|--------------|
| Throw / paw-up | `PixelArt/Cats/Cat1_grey_Paw-Up.png` | 64x64 | exists + unwired | 05-01 throw mechanic |

Wire via `_sprThrow` in `src/player.js` — show while throw cooldown is active.

---

## Background Layers (existing)

### Layer 1 — Sky (bg_far equivalent for current system)

| File | Size | Status | Notes |
|------|------|--------|-------|
| `PixelArt/Paralax/Layer1/day.png` | 480x640 | exists + wired | Day sky fill |
| `PixelArt/Paralax/Layer1/night.png` | 480x640 | exists + wired | Night sky fill |
| `PixelArt/Paralax/Layer1/bf_far_Sky_grandient.png` | — | exists, verify size | Sky gradient variant |

### Layer 2 — Mid (clouds, stars)

| File | Size | Status | Notes |
|------|------|--------|-------|
| `PixelArt/Paralax/Layer2/Clouds_bright.png` | 480x220 | exists + wired | Content rows y=16–201; tileH=186 |
| `PixelArt/Paralax/Layer2/Clouds_dark.png` | 480x640 | exists + wired | tileH=210 |
| `PixelArt/Paralax/Layer2/bf_mid_Stars.png` | 480x640 | exists + wired | tileH=363 |

### Layer 3 — Near (platform sprites)

| File | Size | Status | Notes |
|------|------|--------|-------|
| `PixelArt/Paralax/Layer3/Jallosien/Jallosien_SpriteMap.png` | — | exists + wired | 3-part platform sprite (capL/mid/capR), 7 rows |
| `PixelArt/Paralax/Layer3/Jallosien/3Parts_Jal_1.png` | — | exists | Reference / parts sheet |

---

## 4-Level Design — Assets Needed

Game has 4 levels, each with level-specific parallax layers. Structure:
- **bg_far**: Setting silhouette (unique per level, vague/distant)
- **bg_mid 1**: Clouds + stars (reuse existing)
- **bg_mid 2–4**: Level-specific mid elements
- **bg_near 1–4**: Level-specific near elements

### Level 1 — Stadtsetting (City)

| Asset | File | Notes | Status |
|-------|------|-------|--------|
| City silhouette | bg_far_level1_city.png | Distant rooftops, vague, night look | needs-draw |
| Jalousien (near) | Jallosien_SpriteMap.png | Reuse existing | exists + wired |
| bg_mid elements | — | TBD | — |
| Danger element | — | TBD | — |

### Level 2 — Offener See (Open Lake/Sea)

| Asset | File | Notes | Status |
|-------|------|-------|--------|
| Sea horizon | bg_far_level2_sea.png | Water horizon, sky | needs-draw |
| Masten / Posts | bg_mid_level2_mast.png | Posts that anchor platforms | needs-draw |
| Platform arms | bg_near_level2_platform.png | Platforms extending from masts | needs-draw |
| Water danger | — | Reuse/extend existing water system | exists (water.js) |

### Level 3 — Aufzugschacht (Elevator Shaft)

| Asset | File | Notes | Status |
|-------|------|-------|--------|
| Shaft walls | bg_far_level3_shaft.png | Dark concrete/metal shaft | needs-draw |
| Cables + metal | bg_mid_level3_cables.png | Hanging cables, metal parts | needs-draw |
| Steam clouds | bg_mid_level3_steam.png | Rising steam puffs | needs-draw |
| Elektroboxen | bg_near_level3_boxes.png | Electric distribution boxes | needs-draw |
| Electric shock VFX | — | Danger: periodic electric zap | needs-draw |

### Level 4 — Freizeitpark (Amusement Park)

| Asset | File | Notes | Status |
|-------|------|-------|--------|
| Park silhouette | bg_far_level4_park.png | Distant rides, Ferris wheel outline | needs-draw |
| Ghost train | bg_near_level4_ghosttrain.png | Stationary; possible slight sideways drift | needs-draw |
| Ghost enemies | enemy_ghost.png | Moving threat: drifts toward player | needs-draw |
| bg_mid elements | — | TBD | — |

---

## UI Elements

| Asset | File | Notes | Status |
|-------|------|-------|--------|
| Heart full | `PixelArt/UI/heart_full.png` | 16x16 | needs-draw |
| Heart empty | `PixelArt/UI/heart_empty.png` | 16x16 | needs-draw |

Current HUD uses Unicode hearts — acceptable for submission. Pixel-art hearts are polish only.

---

## Thrown Object

| Asset | File | Notes | Status |
|-------|------|-------|--------|
| Projectile | `PixelArt/Objects/throw_ball.png` | 16x16, ball of yarn or beanbag | needs-draw |

---

## What is NOT needed for Phase 5

| Item | Reason |
|------|--------|
| cat_idle.png / cat_throw.png aliases | Sprites use their real Pixelorama filenames directly |
| Multi-frame walk cycle | v1 scope: jump animation only |
| Tilemap sheet | Project uses single-sprite drawImage |
| Bitmap font sheet | System font is sufficient for submission |
| Enemy sprites (non-ghost) | No enemies in v1 except Level 4 ghosts |

---

## Image Loading Pattern (Phase 5 reference)

Standard preload for all sprites. Add to `src/sprites.js` (new file):

```js
const sprites = {};

function loadSprites(onComplete) {
  const toLoad = {
    catDown:       'PixelArt/Cats/Cat1_grey-pink_down-jump.png',
    catMiddle:     'PixelArt/Cats/Cat1_grey-middle-jump.png',
    catHigh:       'PixelArt/Cats/Cat1_grey-pink_high-jump.png',
    catThrow:      'PixelArt/Cats/Cat1_grey_Paw-Up.png',
    cloudsBright:  'PixelArt/Paralax/Layer2/Clouds_bright.png',
    cloudsDark:    'PixelArt/Paralax/Layer2/Clouds_dark.png',
    bgDay:         'PixelArt/Paralax/Layer1/day.png',
    bgNight:       'PixelArt/Paralax/Layer1/night.png',
    stars:         'PixelArt/Paralax/Layer2/bf_mid_Stars.png',
  };
  let pending = Object.keys(toLoad).length;
  for (const [key, src] of Object.entries(toLoad)) {
    const img = new Image();
    img.onload = () => { if (--pending === 0) onComplete(); };
    img.onerror = () => console.error('Failed to load sprite:', src);
    img.src = src;
    sprites[key] = img;
  }
}
```

Note: cat sprites are currently loaded inline in `src/player.js` — migrate to this central loader in Phase 5 as part of sprite-wiring plan.

---

## Palette Reference

Full palette in `docs/STYLE_GUIDE.md`. Importable as `PixelArt/soggy_moggy_palette.gpl`.
