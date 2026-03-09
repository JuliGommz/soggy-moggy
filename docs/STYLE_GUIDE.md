# Soggy Moggy — Visual Style Guide

**Version:** 1.0 (Phase 04.1)
**Status:** Locked for Phase 5 implementation
**Last updated:** 2026-03-06

---

## Mood and Atmosphere

Soggy Moggy is "cozy danger." The upper portions of the canvas feel warm and inviting — soft pixel clouds, earthy platforms, a stuffed cat bouncing upward. As the flood rises, the lower portion darkens and turns cold. The emotional arc is: playful to tense to urgent. The art never becomes horror — it stays charming even when the water is close.

**In one sentence:** A plush toy navigating a slowly drowning world, rendered in warm pixel art that stays cute until the flood reaches your chin.

---

## Art Style: Warm Pixel Art with Plush-Toy Character

| Rule | Decision |
|------|----------|
| Source resolution | 64x64 pixels (all sprites drawn at this size) |
| Display resolution | 32x32 pixels (drawImage scales down 2x in-game) |
| Palette | 16 colors, shared across ALL assets — no colors outside this list |
| Outlines | Colored outlines only — no pure black (#000000). Use the darkest shade of the adjacent color |
| Shading | Hue-shifted cel shading — 2 shades per surface maximum, shadow hue shifts slightly cool |
| View angle | Side-view. Character faces right by default |
| Anti-aliasing | None. Every pixel is intentional. Jagged diagonals at 64x64 source are correct |
| Gradients | Not used. Flat fill plus colored outline is correct at 32x32 display size |

---

## Color Palette (16 Colors)

Every asset in the game draws from this list only. Do not introduce any color outside this palette.

| Slot | Hex | RGB (decimal) | Role |
|------|-----|---------------|------|
| BG-1 | #7eb8c9 | 126, 184, 201 | Sky light (day background fill) |
| BG-2 | #2e3a5c | 46, 58, 92 | Sky dark (night and deep background) |
| BG-3 | #ffd4a3 | 255, 212, 163 | Cloud highlight / warm accent |
| BG-4 | #c8a07a | 200, 160, 122 | Cloud shadow / mid background tone |
| PLAT-1 | #5a7a3a | 90, 122, 58 | Normal platform body |
| PLAT-2 | #3d5229 | 61, 82, 41 | Platform edge / shadow trim |
| PLAT-3 | #c0662a | 192, 102, 42 | Crumble platform — cracked state |
| PLAT-4 | #e8a830 | 232, 168, 48 | Crumble platform — crumbling state |
| CAT-1 | #b09070 | 176, 144, 112 | Cat body main (warm tan/grey) |
| CAT-2 | #7a6555 | 122, 101, 85 | Cat body shadow (hue-shifted cooler) |
| CAT-3 | #e8c8a0 | 232, 200, 160 | Cat belly / highlight (warm cream) |
| CAT-4 | #d86060 | 216, 96, 96 | Cat inner ear / accent (coral-pink) |
| CAT-5 | #3a7a8a | 58, 122, 138 | Cat button eyes (teal-blue) |
| WATER-1 | #2a5fa8 | 42, 95, 168 | Water body fill |
| WATER-2 | #5090d0 | 80, 144, 208 | Wave crest highlight |
| UI-1 | #ffffff | 255, 255, 255 | HUD text / UI elements |

**Note on UI-1:** White is a utility color for readability only. It appears on HUD text, never on sprites or backgrounds.

---

## Contrast Rules

| Foreground | Background | Readable? | Why |
|------------|------------|-----------|-----|
| CAT-1 #b09070 | BG-1 #7eb8c9 | Yes | Warm tan vs cool blue — strong hue contrast |
| CAT-1 #b09070 | PLAT-1 #5a7a3a | Yes | Tan on dark green — value contrast |
| PLAT-1 #5a7a3a | BG-1 #7eb8c9 | Yes | Dark green on light blue |
| WATER-1 #2a5fa8 | PLAT-1 #5a7a3a | Yes | Blue vs green with value contrast |
| UI-1 #ffffff | BG-1 #7eb8c9 | Yes | White on light blue |
| UI-1 #ffffff | WATER-1 #2a5fa8 | Yes | White on dark blue |
| CAT-2 #7a6555 | BG-2 #2e3a5c | Marginal | Body shadow close in value to night sky |

**Critical rule:** When the cat is against the night sky (BG-2), the body shadow color (CAT-2) can blend into the background. Include at least one row of CAT-3 (#e8c8a0) highlight pixels as a visible silhouette edge on the lit side of the body.

---

## Do / Don't Rules

| Do | Don't |
|----|-------|
| Use colored outlines (darkest shade of adjacent color) | Use pure black #000000 as outline anywhere |
| Draw at 64x64 source, test at 32x32 display in browser | Judge readability only in Pixelorama at zoom level |
| Keep button eyes as 2x2 or 3x3 solid pixel blocks | Draw curved or detailed eye shapes — they vanish at 32x32 |
| Use PLAT-2 #3d5229 as the platform edge shadow | Use pure black under platforms |
| Use 2 shades per surface maximum | Use 3+ shades at this scale |
| Render cloud strips at 60% alpha (globalAlpha = 0.6) | Render cloud strips at full opacity |
| Floor all draw coordinates in drawImage calls | Use non-integer draw positions — causes sub-pixel blur |
| Export PNG from Pixelorama alongside every .pxo save | Rely on .pxo files — the browser cannot load them |
| Use #7eb8c9 as sky background fill (fillRect) | Use CSS gradients for the sky background |

---

## Stuffed Cat Design Notes

### What makes this a plush toy at 64x64

| Visual cue | How to implement at 64x64 |
|------------|--------------------------|
| Button eyes | 2x2 or 3x3 solid pixel blocks in CAT-5 #3a7a8a. One 1px dark pixel at center as button hole. No curved eye shapes |
| Seam lines | 1px line in CAT-3 #e8c8a0 along body center and limb joins — marks where stuffing panels meet |
| Floppy limbs | Limb tips end in 2-3 pixel round blobs. No claws, no pointed ends |
| Plush texture cue | 2-3 horizontal hatch lines (1px) across belly area only — suggest fur direction |
| Rounded silhouette | No sharp right-angle corners in body outline. All corners are 1px diagonal steps |
| Plush proportions | Head is 40% of total sprite height. Body mass low and wide |

### Existing sprites

**Cat1_beishe.pxo** is the current idle/falling sprite candidate. Refinement checklist only:
1. Confirm button eyes are clearly distinct 2x2 or 3x3 pixel blocks
2. Add 1-2 seam line pixels at body/limb joins if not present
3. Confirm limb tips end in round blobs, not points

**Cat1_grey_Paw-Up.pxo** is the throw pose candidate. The raised paw maps to the throw mechanic. The grey coloration distinguishes the throwing state visually.

**Note:** Final sprite direction is not yet decided as of Phase 04.1. This section will be updated when the sprite decision is confirmed.

**Damage blink:** Handled entirely in code via iframeTimer. No separate damaged sprite needed.

---

## Layer Render Order

| Order | Layer | Canvas space | Alpha | Notes |
|-------|-------|--------------|-------|-------|
| 1 | Sky fill | World | 100% | fillRect with BG-1 #7eb8c9 (day) or BG-2 #2e3a5c (night) |
| 2 | Cloud strips | World | 60% | drawImage cloud PNGs, set globalAlpha = 0.6 before draw |
| 3 | Platforms | World | 100% | fillRect with palette colors |
| 4 | Player | World | 100% | drawImage cat sprite |
| 5 | Water | World | 75% | Wave fill with WATER-1, crest in WATER-2 |
| 6 | HUD | Screen | 100% | After ctx.restore() — hearts, score, level |

World-space layers (1-5) go inside ctx.save / ctx.translate / ctx.restore. HUD (6) goes after ctx.restore.

---

## Background Strip Tiling

All four existing background strips are confirmed at 480x640px. They are ready to use as-is.

Tiling formula for vertical scroll:

    const bgY = cameraY - (cameraY % stripHeight);
    ctx.drawImage(sprite, 0, bgY);
    ctx.drawImage(sprite, 0, bgY - stripHeight);

The top and bottom pixel rows of every strip must match for seamless vertical tiling.

---

## Confirmed Asset Dimensions

| File | Confirmed Size | Status |
|------|----------------|--------|
| PixelArt/Paralax/Layer1/day.png | 480x640 | Ready to use |
| PixelArt/Paralax/Layer1/night.png | 480x640 | Ready to use |
| PixelArt/Paralax/Layer1/Clouds_bright.png | 480x640 | Ready to use |
| PixelArt/Paralax/Layer1/Clouds_dark.png | 480x640 | Ready to use |

---

## Canvas Rendering Setup

Set once immediately after getContext — never override later:

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;

Always floor sprite draw coordinates:

    ctx.drawImage(img, 0, 0, 64, 64,
                  Math.floor(x), Math.floor(y),
                  32, 32);

Important: ctx.save() and ctx.restore() do not reliably persist imageSmoothingEnabled across all browsers. Set it once at startup and do not rely on save/restore to preserve it.
