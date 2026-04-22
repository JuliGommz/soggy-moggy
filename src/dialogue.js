/*
====================================================================
* dialogue.js - Bubble overlay + lifecycle
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
*
* Bubbles are static PNGs with text already rendered inside them by Julian
* in Illustrator. No automatic text generation, no bitmap font, no atlas.
* This file only:
*   - loads the 8 dialogue bubble PNGs
*   - draws them centered on screen
*   - shows a clearly marked placeholder when a PNG is missing
*   - manages the overlay lifecycle (show / dismiss / auto-clear)
====================================================================
*/
// No runtime dependencies — pure screen-space overlay module.

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — DIALOGUE BUBBLE PNG LOADER
// ════════════════════════════════════════════════════════════════════════════

const _BUBBLE_KEYS = [
  'l1_intro', 'l2_intro', 'l3_intro',
  'l1_outro', 'l2_outro', 'l3_outro',
  'life_hazard', 'life_wasp',
];

const _bubbleSprites = {};
for (const key of _BUBBLE_KEYS) {
  const img = new Image();
  img.src = `PixelArt/thought_bubbles/dialogues/${key}.png`;
  _bubbleSprites[key] = img;
}

// Placeholder footprints (approximate target artboard sizes). Only used when
// the PNG is missing so the placeholder box approximates the final bubble area.
const _PLACEHOLDER_SIZE = {
  l1_intro:    { w: 240, h: 110 },
  l2_intro:    { w: 240, h: 110 },
  l3_intro:    { w: 240, h: 110 },
  l1_outro:    { w: 200, h: 110 },
  l2_outro:    { w: 240, h: 110 },
  l3_outro:    { w: 240, h: 240 },
  life_hazard: { w: 240, h: 240 },
  life_wasp:   { w: 240, h: 240 },
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1.5 — TITLE + BODY TEXT RENDERING (hybrid font stack)
// ════════════════════════════════════════════════════════════════════════════
// Two fonts, two delivery methods — picked after iterating through several
// failed approaches (see .planning/logs/ + docs/plans/2026-04-18*.md history):
//
//   TITLE  — YELLOW_FONT: yellow-red pixel-art bitmap atlas.
//     Atlas data is inlined as a JS object (mirror of the generated JSON)
//     so no runtime fetch is needed — works on file:// without CORS. The
//     source PNG is loaded as a regular <img>. drawYellowText() uses
//     per-glyph x/y/w/h/xadv for proportional-width rendering.
//
//   BODY   — BlockCraft.otf loaded via @font-face declaration in index.html.
//     drawBodyText() uses native ctx.fillText with the 'BlockCraft' family
//     (monospace fallback while the OTF loads). No bitmap atlas, no cell
//     math. Chosen because an earlier attempt at a second bitmap atlas
//     (alphabet_black_230px.png, 7x4 grid) gave inconsistent spacing and
//     row-bleed artifacts — archived under PixelArt/fonts/Archive/.
//
// Both renderers are additive — callers draw text AFTER the bubble background.

const YELLOW_FONT = {
  img: (() => { const i = new Image(); i.src = 'PixelArt/fonts/alphabet_pixel_retro_video_game_style.png'; return i; })(),
  lineHeight: 171,
  chars: {
    '0': {x:    0, y: 863, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '1': {x:   41, y: 648, w:  65, h: 147, xoff: 0, yoff:  0, xadv:  67},
    '2': {x:  217, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '3': {x:  445, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '4': {x:  686, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '5': {x:  924, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '6': {x: 1167, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '7': {x: 1415, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '8': {x: 1647, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '9': {x: 1899, y: 648, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'A': {x:    0, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'B': {x:  217, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'C': {x:  445, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'D': {x:  686, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'E': {x:  924, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'F': {x: 1167, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'G': {x: 1415, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'H': {x: 1647, y:   0, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'I': {x: 1905, y:   0, w: 135, h: 147, xoff: 0, yoff:  0, xadv: 137},
    'J': {x:    0, y: 216, w: 147, h: 147, xoff: 0, yoff: 12, xadv: 149},
    'K': {x:  212, y: 216, w: 158, h: 147, xoff: 0, yoff: 12, xadv: 160},
    'L': {x:  445, y: 216, w: 147, h: 147, xoff: 0, yoff: 12, xadv: 149},
    'M': {x:  674, y: 216, w: 171, h: 147, xoff: 0, yoff: 12, xadv: 173},
    'N': {x:  924, y: 216, w: 147, h: 147, xoff: 0, yoff: 12, xadv: 149},
    'O': {x: 1167, y: 216, w: 147, h: 147, xoff: 0, yoff: 12, xadv: 149},
    'P': {x: 1415, y: 216, w: 147, h: 147, xoff: 0, yoff: 12, xadv: 149},
    'Q': {x: 1647, y: 204, w: 147, h: 171, xoff: 0, yoff:  0, xadv: 149},
    'R': {x: 1899, y: 216, w: 147, h: 147, xoff: 0, yoff: 12, xadv: 149},
    'S': {x:    0, y: 432, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'T': {x:  223, y: 432, w: 136, h: 147, xoff: 0, yoff:  0, xadv: 138},
    'U': {x:  445, y: 432, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'V': {x:  686, y: 432, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'W': {x:  913, y: 432, w: 170, h: 147, xoff: 0, yoff:  0, xadv: 172},
    'X': {x: 1167, y: 432, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    'Y': {x: 1409, y: 432, w: 159, h: 147, xoff: 0, yoff:  0, xadv: 161},
    'Z': {x: 1647, y: 432, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '?': {x: 1899, y: 432, w: 147, h: 147, xoff: 0, yoff:  0, xadv: 149},
    '!': {x:  259, y: 863, w:  64, h: 147, xoff: 0, yoff:  0, xadv:  66},
  },
};

// Body font is BlockCraft.otf — loaded via @font-face in index.html.
// No bitmap atlas, no cell math. drawBodyText() uses native ctx.fillText
// with 'BlockCraft' family + 'monospace' fallback so text still shows if
// the OTF hasn't finished loading yet.

// Draw one uppercase string with the yellow (title) font.
// scale = destination-pixels per source-pixel. 0.15 maps 147px glyphs → ~22px on canvas.
function drawYellowText(ctx, text, x, y, scale = 0.15) {
  const f = YELLOW_FONT;
  if (!f.img.complete || !f.img.naturalWidth) return 0;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') { cx += 50 * scale; continue; }
    const g = f.chars[ch];
    if (!g) { cx += 70 * scale; continue; }
    ctx.drawImage(
      f.img,
      g.x, g.y, g.w, g.h,
      Math.round(cx + g.xoff * scale),
      Math.round(y  + g.yoff * scale),
      Math.round(g.w * scale),
      Math.round(g.h * scale),
    );
    cx += g.xadv * scale;
  }
  return cx - x;
}

// Draw body text using BlockCraft (OTF) via native ctx.fillText.
// pxSize = font size in canvas pixels. color defaults to near-black
// for good contrast on light bubble backgrounds.
function drawBodyText(ctx, text, x, y, pxSize = 18, color = '#111') {
  ctx.save();
  ctx.fillStyle    = color;
  ctx.font         = pxSize + 'px "BlockCraft", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Font smoke test — renders sample YELLOW_FONT and BlockCraft.otf text on
// the START screen so both font delivery paths can be visually verified.
// Called from main.js renderStart(). Safe to remove once dialogue bubbles
// are fully wired to use drawYellowText + drawBodyText.
function renderFontSmokeTest(ctx) {
  ctx.save();
  // Title font (yellow bitmap) on dark background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(10, 480, 460, 45);
  ctx.fillStyle = '#888';
  ctx.font      = '10px monospace';
  ctx.fillText('title (yellow bitmap):', 14, 492);
  drawYellowText(ctx, 'SOGGY MOGGY', 14, 495, 0.16);
  // Body font (BlockCraft OTF) on light background
  ctx.fillStyle = '#eee';
  ctx.fillRect(10, 530, 460, 100);
  ctx.fillStyle = '#555';
  ctx.font      = '10px monospace';
  ctx.fillText('body (BlockCraft OTF):', 14, 542);
  drawBodyText(ctx, 'The quick brown cat jumps', 14, 548, 18);
  drawBodyText(ctx, 'over the rising flood 123?!', 14, 575, 18);
  drawBodyText(ctx, 'MEOW MEOW - PHEW! YIKES!', 14, 602, 18);
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — TRIGGER KEYS (which bubble shows when)
// ════════════════════════════════════════════════════════════════════════════

const _TRIGGER = {
  levelStart: [null, 'l1_intro', 'l2_intro', 'l3_intro'],
  levelEnd:   [null, 'l1_outro', 'l2_outro', 'l3_outro'],
  lifeLost:   { hazard: 'life_hazard', wasp: 'life_wasp' },
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Active overlay state + lifecycle
// ════════════════════════════════════════════════════════════════════════════

// _active = null (no overlay) | {
//   bubbleKey:   string                     — key into _bubbleSprites
//   kind:        'intro' | 'outro' | 'lifeLost'
//   blocking:    boolean                    — true → physics pause
//   dismissible: boolean                    — true → Space/click advances
//   duration:    number (seconds)           — 0 = wait for input; >0 = auto-clear
//   timer:       number                     — counts down to 0
//   readyTimer:  number                     — suppresses dismiss input briefly
//   onDismiss:   function (optional)        — called when overlay clears
// }
let _active = null;

function showLevelStart(level) {
  const bubbleKey = _TRIGGER.levelStart[level];
  if (!bubbleKey) return;
  _active = {
    bubbleKey,
    kind:        'intro',
    blocking:    true,
    dismissible: true,
    duration:    0,
    timer:       0,
    readyTimer:  0.15,
  };
}

function showLevelEnd(level, onDismiss) {
  const bubbleKey = _TRIGGER.levelEnd[level];
  if (!bubbleKey) return;
  _active = {
    bubbleKey,
    kind:        'outro',
    blocking:    true,
    dismissible: true,
    duration:    0,
    timer:       0,
    readyTimer:  0.15,
    onDismiss,
  };
}

function showLifeLost(cause) {
  const bubbleKey = _TRIGGER.lifeLost[cause] || _TRIGGER.lifeLost.hazard;
  _active = {
    bubbleKey,
    kind:        'lifeLost',
    blocking:    true,
    dismissible: false,
    duration:    1.2,
    timer:       1.2,
  };
}

function advanceDialogue() {
  if (!_active || !_active.dismissible) return false;
  if (_active.readyTimer && _active.readyTimer > 0) return false;
  const cb = _active.onDismiss;
  _active = null;
  if (typeof cb === 'function') cb();
  return true;
}

function updateDialogue(dt) {
  if (!_active) return;
  if (_active.readyTimer && _active.readyTimer > 0) {
    _active.readyTimer = Math.max(0, _active.readyTimer - dt);
  }
  if (_active.duration > 0) {
    _active.timer -= dt;
    if (_active.timer <= 0) {
      const cb = _active.onDismiss;
      _active = null;
      if (typeof cb === 'function') cb();
    }
  }
}

function isDialogueBlocking() {
  return _active !== null && _active.blocking === true;
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Rendering
// ════════════════════════════════════════════════════════════════════════════

// Screen-space draw. Caller must call AFTER ctx.restore() (i.e. outside world space).
function renderDialogue(ctx) {
  if (!_active) return;

  const canvasW = 480;
  const canvasH = 640;

  if (_active.kind !== 'lifeLost') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  const img    = _bubbleSprites[_active.bubbleKey];
  const hasImg = img && img.complete && img.naturalWidth > 0;

  let bw, bh, bx, by;

  if (hasImg) {
    bw = img.naturalWidth;
    bh = img.naturalHeight;
    bx = Math.round((canvasW - bw) / 2);
    by = Math.round((canvasH - bh) / 2 - 40);
    ctx.drawImage(img, bx, by, bw, bh);
  } else {
    // PLACEHOLDER — bubble PNG missing. Clearly marked so the gap is obvious.
    const hint = _PLACEHOLDER_SIZE[_active.bubbleKey] || { w: 240, h: 140 };
    bw = hint.w;
    bh = hint.h;
    bx = Math.round((canvasW - bw) / 2);
    by = Math.round((canvasH - bh) / 2 - 40);

    ctx.fillStyle = 'rgba(20, 20, 20, 0.88)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#ff4fff';
    ctx.lineWidth   = 3;
    ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
    ctx.setLineDash([]);

    ctx.fillStyle = '#ff4fff';
    ctx.font      = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PLACEHOLDER: ${_active.bubbleKey}.png`, bx + bw / 2, by + 20);
    ctx.textAlign = 'left';
  }

  if (_active.dismissible) {
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE or CLICK to continue]', canvasW / 2, canvasH - 30);
    ctx.textAlign = 'left';
  }
}
