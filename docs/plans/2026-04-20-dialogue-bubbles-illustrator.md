# Dialogue Bubbles — Manual Illustrator Production Plan

> **Partially superseded (2026-04-21)** — the Illustrator workflow (8 artboards, one .ai file, PNG export per trigger) is still the active production pipeline. However:
> - Artboard sizes changed from the full 480×640 canvas to bubble-sized artboards (wide2/wide1 = 240×110, small2 = 200×110, burst = 240×240).
> - Output path is `PixelArt/thought_bubbles/dialogues/` with trigger-based filenames (l1_intro.png … life_wasp.png).
> - The dim overlay (55% black) is now drawn in code, NOT baked into the PNG.
> - Bitmap-font (`font.js`) removal already happened in Phase 5 — ignore the „remove font.js" steps, they are done.
> Current truth: `docs/plans/2026-04-21-project-cleanup.md` Phase 5 + MEMORY.md „Static bubble PNG approach".

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 8 static pre-rendered PNG images (bubble shape + text baked in) covering all 3 level intros, 3 level outros, and 2 life-lost overlays.

**Approach:** One .ai file, 8 artboards at 480×640 px (full game canvas). Each artboard = one dialogue moment. Semi-transparent dim layer + bubble + text all baked in with alpha channel. Code updated to drawImage() these assets directly.

**Tech Stack:** Adobe Illustrator, existing `thought-bubbles.png` as source for bubble shapes.

---

## Pre-flight checklist

Before starting, have these open/accessible:

- `PixelArt/thought_bubbles/thought-bubbles.png` — bubble shapes (reference + source)
- `PixelArt/fonts/alphabet_pixel_retro_video_game_style.ai` — title font glyphs
- `PixelArt/fonts/alphabet_black.ai` — body font glyphs

---

## Task 1: New Illustrator Document

**Step 1: Create the file**

File > New:
- Width: **480 px**
- Height: **640 px**
- Units: Pixels
- Farbmodus: RGB
- Rastereffekte: **72 ppi**
- Kantenglättung (Vorschau): **Keine**

**Step 2: Add 7 more artboards**

You need 8 artboards total, all 480×640. Name them exactly (Illustrator uses these as export filenames):

| # | Artboard name |
|---|---|
| 1 | `l1_intro` |
| 2 | `l2_intro` |
| 3 | `l3_intro` |
| 4 | `l1_outro` |
| 5 | `l2_outro` |
| 6 | `l3_outro` |
| 7 | `life_hazard` |
| 8 | `life_wasp` |

---

## Task 2: Bubble shape setup (do once per artboard)

The game code positions each bubble like this:
- Horizontally: centered on the 480px canvas
- Vertically: centered on the 640px canvas, shifted 40px upward

Calculated positions per bubble type:

| Bubble type | Used for | Artboard X | Artboard Y | Width | Height |
|---|---|---|---|---|---|
| wide2 | L1 / L2 / L3 intro | **120** | **225** | 240 | 110 |
| small2 | L1 outro | **140** | **225** | 200 | 110 |
| wide1 | L2 outro | **120** | **225** | 240 | 110 |
| burst | L3 outro + both life-lost | **0** | **160** | 480 | 240 |

**Step 1: Import thought-bubbles.png**

File > Platzieren → `PixelArt/thought_bubbles/thought-bubbles.png`

**Step 2: Crop to the right bubble region**

Use a clipping mask to expose only the relevant slice. Source coordinates in the PNG:

| Bubble | sx | sy | sw | sh |
|---|---|---|---|---|
| wide2 | 240 | 130 | 240 | 110 |
| small2 | 8 | 130 | 200 | 110 |
| wide1 | 240 | 4 | 240 | 110 |
| burst | 8 | 270 | 480 | (rest of image) |

**Step 3: Position on artboard**

Move the cropped bubble to the X/Y coordinates from the table above.
Scale: **none** — keep 1:1, no resize.

---

## Task 3: Dim overlay (intro/outro artboards only)

Skip this task for `life_hazard` and `life_wasp`.

**Step 1: Draw a full-canvas rectangle**

Rectangle tool → 480×640, positioned at 0, 0.
Fill: black `#000000`
Opacity: **55%**

**Step 2: Send to back**

Object > Anordnen > In den Hintergrund

The bubble must be on top of the dim layer.

---

## Task 4: Add text — all 8 artboards

Open the font AI files as references. Copy individual glyphs, arrange them inside the bubble.

Target glyph heights:
- Title: **20 px** tall (life-lost artboards: **26 px**)
- Body: **14 px** tall (life-lost artboards: **18 px**)

Text sits inside the cream/white interior of the bubble.
Center-align both title and body horizontally within the bubble.
Leave visible padding on all sides (roughly 12% of bubble width, 14% of bubble height).

Work top to bottom — each artboard in order:

---

### Artboard 1 — `l1_intro` (bubble: wide2, 240×110 at x=120 y=225)

| Layer | Text |
|---|---|
| Title | `ALERTA CIUDADANA!` |
| Body | `NIVELES ALTOS DE CONTAMINACIÓN EN LA CIUDAD` |

Body is long — may wrap to 2 lines inside the bubble.

---

### Artboard 2 — `l2_intro` (bubble: wide2, 240×110 at x=120 y=225)

| Layer | Text |
|---|---|
| Title | `ATENCIÓN!` |
| Body | `ASCENSOR FUERA DE SERVICIO MANTENGA LA CALMA` |

Body is long — may wrap to 2 lines.

---

### Artboard 3 — `l3_intro` (bubble: wide2, 240×110 at x=120 y=225)

| Layer | Text |
|---|---|
| Title | `ATENCIÓN!` |
| Body | `MAREA ALTA TOME DISTANCIA DEL MAR` |

---

### Artboard 4 — `l1_outro` (bubble: small2, 200×110 at x=140 y=225)

| Layer | Text |
|---|---|
| Title | `QUÉ NUEVE VIDAS?!` |
| Body | `COUGH COUGH` |

---

### Artboard 5 — `l2_outro` (bubble: wide1, 240×110 at x=120 y=225)

| Layer | Text |
|---|---|
| Title | `UFF!` |
| Body | `SALVADO POR LA CAMPANA` |

---

### Artboard 6 — `l3_outro` (bubble: burst, 480×240 at x=0 y=160)

| Layer | Text |
|---|---|
| Title | `MIAU MIAU!` |
| Body | `MAMI` |

Burst bubble has a wider interior. Center both lines in the spiky shape.

---

### Artboard 7 — `life_hazard` (bubble: burst, 480×240 at x=0 y=160 — NO dim overlay)

| Layer | Text |
|---|---|
| Title | `JUAPUCHIS!` |
| Body | *(none)* |

Title only. Use 26 px glyph height.

---

### Artboard 8 — `life_wasp` (bubble: burst, 480×240 at x=0 y=160 — NO dim overlay)

| Layer | Text |
|---|---|
| Title | `AYAYAYAY!` |
| Body | *(none)* |

Title only. Use 26 px glyph height.

---

## Task 5: Export all 8 PNGs

**Step 1: Export As**

Datei > Exportieren > Exportieren als:
- Format: PNG
- Zeichenflächen verwenden: **checked**
- Resolution: **72 ppi**
- Kantenglättung: **Keine**
- Hintergrundfarbe: **Transparent**
- Output folder: `PixelArt/thought_bubbles/dialogues/`

Result: 8 files named `l1_intro.png` through `life_wasp.png`.

**Step 2: Verify in browser**

Open each PNG in a browser tab. Check:
- Bubble positioned roughly center-screen, slightly above middle
- Text readable and inside bubble bounds
- Dim overlay visible (grey-black tint) on intro/outro — absent on life-lost
- Transparent background outside the dim area (checkerboard in browser dev tools)

---

## Task 6: Code update (dialogue.js)

After all PNGs are confirmed, update the code to use pre-made images instead of compositing at runtime.

**Files to change:**
- Modify: `src/dialogue.js`

**Step 1: Add image preloads near the top of `dialogue.js`**

Add this block after the existing `_sprBubbles` loader:

```js
// Pre-rendered dialogue images (bubble + text baked in, 480×640)
const _DIALOGUE_IMGS = {};
const _dialogueImgSrcs = {
  l1_intro:    'PixelArt/thought_bubbles/dialogues/l1_intro.png',
  l2_intro:    'PixelArt/thought_bubbles/dialogues/l2_intro.png',
  l3_intro:    'PixelArt/thought_bubbles/dialogues/l3_intro.png',
  l1_outro:    'PixelArt/thought_bubbles/dialogues/l1_outro.png',
  l2_outro:    'PixelArt/thought_bubbles/dialogues/l2_outro.png',
  l3_outro:    'PixelArt/thought_bubbles/dialogues/l3_outro.png',
  life_hazard: 'PixelArt/thought_bubbles/dialogues/life_hazard.png',
  life_wasp:   'PixelArt/thought_bubbles/dialogues/life_wasp.png',
};
for (const [key, src] of Object.entries(_dialogueImgSrcs)) {
  const img = new Image();
  img.src = src;
  _DIALOGUE_IMGS[key] = img;
}
```

**Step 2: Add `imgKey` to each `_DIALOGUE` entry**

```js
const _DIALOGUE = {
  levelStart: [
    null,
    { title: 'ALERTA CIUDADANA!', body: '...', bubble: 'wide2', imgKey: 'l1_intro' },
    { title: 'ATENCIÓN!',         body: '...', bubble: 'wide2', imgKey: 'l2_intro' },
    { title: 'ATENCIÓN!',         body: '...', bubble: 'wide2', imgKey: 'l3_intro' },
  ],
  levelEnd: [
    null,
    { title: 'QUÉ NUEVE VIDAS?!', body: '...', bubble: 'small2', imgKey: 'l1_outro' },
    { title: 'UFF!',               body: '...', bubble: 'wide1',  imgKey: 'l2_outro' },
    { title: 'MIAU MIAU!',         body: '...', bubble: 'burst',  imgKey: 'l3_outro' },
  ],
  lifeLost: {
    hazard: { title: 'JUAPUCHIS!', body: '', bubble: 'burst', imgKey: 'life_hazard' },
    wasp:   { title: 'AYAYAYAY!',  body: '', bubble: 'burst', imgKey: 'life_wasp'   },
  },
};
```

**Step 3: Replace `renderDialogue()` body with a single drawImage call**

```js
function renderDialogue(ctx) {
  if (!_active) return;
  const imgKey = _active.entry.imgKey;
  const img = imgKey ? _DIALOGUE_IMGS[imgKey] : null;
  if (!img || !img.complete || img.naturalWidth === 0) return;
  ctx.drawImage(img, 0, 0);
}
```

**Step 4: Remove now-unused code**

Delete from `dialogue.js`:
- `_sprFontTitle` / `_sprFontBody` Image loaders (lines ~41–44)
- `_TITLE_CONFIG` / `_BODY_CONFIG` objects
- `_finalizeFontConfig()` function
- Both `addEventListener('load', ...)` + `if (complete)` guards for the fonts
- `_drawDebugFontGrid()` function and its two call sites in the old `renderDialogue`
- All `drawText` / `measureText` / `fontIsReady` calls inside `renderDialogue`
- The `console.log` debug line

**Step 5: Remove font.js from index.html** (if nothing else uses it)

Check `index.html` — if `font.js` is only used by `dialogue.js`, remove the `<script>` tag for it.

---

## Completion checklist

- [ ] All 8 PNGs exported to `PixelArt/thought_bubbles/dialogues/`
- [ ] Each PNG verified in browser: bubble visible, text readable, transparency correct
- [ ] `dialogue.js` updated with image preloads + imgKey entries + simplified renderDialogue
- [ ] Unused font code removed from `dialogue.js`
- [ ] `font.js` script tag removed from `index.html` (if unused)
- [ ] Full smoke test: 7-step test from `2026-04-18-dialogue-system-design.md` still passes
