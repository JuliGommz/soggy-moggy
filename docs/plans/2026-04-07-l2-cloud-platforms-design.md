# L2 Cloud Platforms — Design

> **Superseded (2026-04-21)** — this document describes an earlier L2 concept (cloud platforms / sinking clouds / lighthouse context).
> L2 is now the elevator shaft („Pozo Eléctrico") with the 9-variant jump-platform sheet. L3 is the open sea / lighthouse level.
> See MEMORY.md section „L2 Shaft Platforms" + `src/platforms.js` atlas coords for the current implementation. Kept as historical record only.

**Date:** 2026-04-07
**Branch:** feature/04.2-l2-lighthouse
**Status:** Approved — ready for implementation

---

## Summary

Level 2 (Open Sea / Lighthouse) replaces the sea-green placeholder platforms with cloud platforms. Clouds introduce two distinct mechanics alongside stable platforms. The sinking cloud is a new mechanic not present in any other level.

---

## Platform Types (L2 only)

| Type | Behavior | Visual |
|---|---|---|
| `'normal'` | Stable — no movement, no disappear | Full, round cloud sprite |
| `'cloud-sink'` | Sinks while cat stands on it; floats back when cat leaves | Slightly compressed cloud sprite |
| `'crumble'` | Existing 2-landing disappear mechanic (same as L1) | Wispy / thin cloud sprite |

---

## Data Model

`cloud-sink` platforms get one additional field at generation time:

```javascript
{
  x, y,               // y = current (moving) position
  w, h,
  type: 'cloud-sink',
  baseY,              // new — rest/spawn Y; cloud returns here when not loaded
  catOnTop: false,    // reset each frame before collision; set true by collision
  state: 'intact',
  crumbleTimer: 0,
}
```

`'normal'` and `'crumble'` objects are unchanged in structure.

---

## Behavior Logic

### Sink / rise (in `updatePlatforms`)

```javascript
if (p.type === 'cloud-sink') {
  if (p.catOnTop) {
    p.y += CLOUD_SINK_SPEED * dt;         // sinks downward
  } else {
    p.y = Math.max(p.baseY, p.y - CLOUD_RISE_SPEED * dt);  // floats back, clamps at rest
  }
  p.catOnTop = false; // reset each frame — set true by collision system
}
```

### Contact detection (in `checkPlatformCollisions`)

When a collision is detected on a `cloud-sink` platform, add:
```javascript
if (p.type === 'cloud-sink') p.catOnTop = true;
```

### Constants (tunable in playtesting)

```javascript
const CLOUD_SINK_SPEED  = 40;  // px/s — how fast the cloud sinks under cat weight
const CLOUD_RISE_SPEED  = 20;  // px/s — how fast it floats back (slower = more forgiving)
```

### Limits

No explicit floor — the rising flood (L2 hazard) is the natural lower limit. If the cat stands on a sinking cloud long enough, the flood will reach it.

---

## Generation Mix (L2)

```javascript
// In generateLevelPlatforms(), level 2 branch:
const roll = Math.random();
const type = roll < 0.25 ? 'crumble'
           : roll < 0.50 ? 'cloud-sink'
           : 'normal';
```

| Type | % |
|---|---|
| `'normal'` | 50% |
| `'cloud-sink'` | 25% |
| `'crumble'` | 25% |

`cloud-sink` platforms store `baseY = worldY` at generation time.

---

## Visuals

### Phase 1 (now): Placeholders

Colored `fillRect` blocks distinguish cloud types visually during development:

| Type | Fill color | Top edge |
|---|---|---|
| `'normal'` | `#e8e8f0` (light grey-white) | `#c0c0d0` |
| `'cloud-sink'` | `#b0c8e8` (sky blue) | `#8aaac8` |
| `'crumble'` intact | `#d0d0e8` (muted lavender) | `#a0a0c0` |
| `'crumble'` cracked | `#c0a0b0` (pinkish) | existing crumble colors |
| `'crumble'` crumbling | `#e8a830` | existing crumble colors |

### Phase 2 (after art): cloud_sheet.png

Sprite sheet at `PixelArt/platforms/level2_see/cloud_sheet.png`. Rows:

| Row | Type | Visual description |
|---|---|---|
| 1 | `'normal'` | Full, round, solid cloud |
| 2 | `'cloud-sink'` | Slightly flattened — looks weighted |
| 3 | `'crumble'` intact | Wispy, thinner |
| 4 | `'crumble'` cracked | Partially transparent / breaking apart |
| 5 | `'crumble'` crumbling | Mostly gone |

Sheet format mirrors `jalousie_sheet.png`: 3-part tiling (left cap + tiled middle + right cap), height per row measured via PIL alpha-scan after export.

---

## Files Changed

| File | Change |
|---|---|
| `src/platforms.js` | Add `CLOUD_SINK_SPEED`, `CLOUD_RISE_SPEED` constants; update `generateLevelPlatforms` (L2 type mix, `baseY`); update `checkPlatformCollisions` (`catOnTop` set); update `updatePlatforms` (sink/rise logic); update `_renderPlatformSprite` (L2 placeholder colors, later sprite rows) |

No other files change.

---

## Out of Scope

- cloud_sheet.png sprite drawing (Julian draws in Pixelorama — separate task)
- PIL alpha-scan of cloud_sheet.png (happens after art is exported)
- Wiring sprite sheet into the renderer (happens after art exists)
