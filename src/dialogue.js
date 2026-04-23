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

// Measure pixel width of a yellow-font string without drawing.
function measureYellowText(text, scale = 0.15) {
  const f = YELLOW_FONT;
  if (!f.img.complete || !f.img.naturalWidth) return 0;
  let cx = 0;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ')  { cx += 50 * scale; continue; }
    if (ch === '.')  { cx += 45 * scale; continue; } // dot drawn as filled rect
    const g = f.chars[ch];
    if (!g) continue;
    cx += g.xadv * scale;
  }
  return cx;
}

// Draw one uppercase string with the yellow (title) font.
// scale = destination-pixels per source-pixel. 0.15 maps 147px glyphs → ~22px on canvas.
function drawYellowText(ctx, text, x, y, scale = 0.15) {
  const f = YELLOW_FONT;
  if (!f.img.complete || !f.img.naturalWidth) return 0;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') { cx += 50 * scale; continue; }
    if (ch === '.') {
      const dotSz = Math.round(28 * scale);
      const dotX  = Math.round(cx + 4 * scale);
      const dotY  = Math.round(y  + (147 - 36) * scale); // bottom-aligned to glyph baseline
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(dotX, dotY, dotSz, dotSz);
      cx += 45 * scale;
      continue;
    }
    const g = f.chars[ch];
    if (!g) continue; // unknown chars — skip without advancing
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
// for good contrast on light bubble backgrounds. If maxWidth is given,
// word-wrap greedily and center each line horizontally around (x + maxWidth/2).
// Returns the total height used (lines * lineHeight).
function drawBodyText(ctx, text, x, y, pxSize = 18, color = '#111', maxWidth = 0) {
  ctx.save();
  ctx.fillStyle    = color;
  ctx.font         = 'bold ' + pxSize + 'px "BlockCraft", monospace';
  ctx.textBaseline = 'top';

  const lineHeight = Math.round(pxSize * 1.2);

  if (!maxWidth) {
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
    ctx.restore();
    return lineHeight;
  }

  // Greedy word-wrap. Hard line-breaks (\n) are honoured first.
  const paragraphs = text.split('\n');
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width <= maxWidth) {
        cur = test;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
  }

  ctx.textAlign = 'center';
  const cx = x + maxWidth / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, y + i * lineHeight);
  }
  ctx.restore();
  return lines.length * lineHeight;
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
// DIALOGUE INDEPENDENCE RULE
// Every dialogue key (l1_intro, l1_outro, l2_intro, …) is tuned independently.
// NEVER change a shared default to fix one key — always add/update the key's
// entry in the override tables below (_TITLE_SCALE_OVERRIDE, _BODY_PX_OVERRIDE).
// Once Julian marks a key as finished ("locked"), do NOT touch its values again
// unless he explicitly requests a change for that specific key.
//
// Locked keys (do not modify):
//   l1_intro  — level START dialogue. Title scale 0.29 (default), body 20px (default). FINISHED.
// ════════════════════════════════════════════════════════════════════════════

// Per-key title scale overrides. Unset keys fall back to the kind default (0.29 / 0.305).
// For multi-line titles (\n), use _TITLE_LINE_SCALES to set a scale per line index independently.
const _TITLE_SCALE_OVERRIDE = {
  l1_outro: 0.22,
};

// Per-key array of per-line scale multipliers (applied on top of _TITLE_SCALE_OVERRIDE).
// Index = line index in the split title. Missing entries use 1.0 (no change).
const _TITLE_LINE_SCALES = {
  l1_outro: [1.0, 0.75], // line 0 "NINE LIVES..." full, line 1 "REALLY?!" at 75%
};

// Per-key body font size overrides. Unset keys fall back to 20px.
const _BODY_PX_OVERRIDE = {
  l1_outro: 24,
};

// Per-key body Y offset (px, applied after centering — negative = higher).
// Fine-tune only. Primary centering is driven by interiorTop/interiorH.
const _BODY_Y_OFFSET = {
  l1_outro: -30,
};

// Per-bubble text content. Title = YELLOW_FONT uppercase.
// Body = BlockCraft regular case (mixed-case preserved as-is).
const _DIALOGUE_TEXT = {
  l1_intro:    { title: 'CITY ALERT!',  body: 'Pollution Levels critical.\nGet to Safety!' },
  l2_intro:    { title: 'ATTENTION!',   body: 'Elevator out of service\nStay Calm' },
  l3_intro:    { title: 'WARNING!',     body: 'High Tide\nKeep away from the Sea' },
  l1_outro:    { title: 'NINE LIVES...\nREALLY?!', body: 'Cough... Cough...' },
  l2_outro:    { title: 'PHEW!',        body: 'Saved by the Bell' },
  l3_outro:    { title: 'MEOW MEOW!',   body: 'Mommy!' },
  life_hazard: { title: 'YIKES!',       body: '' },
  life_wasp:   { title: 'OUCH OUCH!',   body: '' },
};

// Damage-dialogue pools. Picked at random in showLifeLost() and applied as a
// per-instance title override (the bubble PNG stays the same; only the text
// rotates). Each level gets a flavored line mixed into the shared hazard pool.
// Atlas-safe charset only: A-Z + '!' (no apostrophes, dashes, or commas).
const _HAZARD_TITLE_POOLS = {
  1: ['YIKES!', 'OOF!', 'HISS!', 'COUGH COUGH!'],
  2: ['YIKES!', 'OOF!', 'HISS!', 'ZAP!'],
  3: ['YIKES!', 'OOF!', 'HISS!', 'GLURP GLURP!'],
};
const _WASP_TITLE_POOL = ['OUCH OUCH!', 'YEOWCH!', 'YIHAA!'];

// Repeat-guard: remembers the last damage title shown so the same line never
// fires twice in a row on small pools.
let _lastLifeLostTitle = null;

function _pickLifeLostTitle(cause, level) {
  const pool = (cause === 'wasp')
    ? _WASP_TITLE_POOL
    : (_HAZARD_TITLE_POOLS[level] || _HAZARD_TITLE_POOLS[1]);
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (pick === _lastLifeLostTitle && pool.length > 1) {
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  _lastLifeLostTitle = pick;
  return pick;
}

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
    titleAnim:   0,
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
    titleAnim:   0,
  };
}

function showLifeLost(cause) {
  const bubbleKey = _TRIGGER.lifeLost[cause] || _TRIGGER.lifeLost.hazard;
  const level     = (typeof GameState !== 'undefined' && GameState && GameState.level) || 1;
  // Hazard/wasp notification duration: 0.72s (reduced 40% from 1.2s).
  _active = {
    bubbleKey,
    kind:          'lifeLost',
    blocking:      true,
    dismissible:   false,
    duration:      0.72,
    timer:         0.72,
    titleAnim:     0,
    titleOverride: _pickLifeLostTitle(cause, level),
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
  _active.titleAnim += dt;
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
  const isLifeLostBubble = _active.kind === 'lifeLost';
  const isOutro          = _active.kind === 'outro';
  const BY_INTRO       = 250;
  const BY_OUTRO       = 235;
  const BX_INTRO_NUDGE = 0;
  const BX_OUTRO_NUDGE = 20;
  const TITLE_Y_INTRO  = 40;
  const BUBBLE_SCALE   = 1.2;

  let bw, bh, bx, by;
  bw = Math.round(img.naturalWidth  * BUBBLE_SCALE);
  bh = Math.round(img.naturalHeight * BUBBLE_SCALE);
  bx = isLifeLostBubble
    ? Math.round((canvasW - bw) / 2)
    : Math.round((canvasW - bw) / 2) + (isOutro ? BX_OUTRO_NUDGE : BX_INTRO_NUDGE);
  by = isLifeLostBubble
    ? Math.round((canvasH - bh) / 2 - 40)
    : (isOutro ? BY_OUTRO : BY_INTRO);

  // Soft shake: first burst at 2s, then every 3s, duration 0.4s each.
  const _t   = _active.titleAnim;
  const SHAKE_FIRST = 0.5, SHAKE_EVERY = 1.5, SHAKE_DUR = 0.9, SHAKE_AMP = 3;
  if (_t >= SHAKE_FIRST) {
    const phase    = (_t - SHAKE_FIRST) % SHAKE_EVERY;
    if (phase < SHAKE_DUR) {
      const env  = Math.sin((phase / SHAKE_DUR) * Math.PI);
      bx += Math.round(SHAKE_AMP * env * Math.sin(_t * Math.PI * 7));
      by += Math.round(SHAKE_AMP * 0.5 * env * Math.sin(_t * Math.PI * 8));
    }
  }

  ctx.globalAlpha = 0.75;
  if (isLifeLostBubble) {
    ctx.drawImage(img, bx, by, bw, bh);
  } else if (isOutro) {
    // Outro: horizontal flip — tail points to the right.
    ctx.save();
    ctx.transform(-1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, -(bx + bw), by, bw, bh);
    ctx.restore();
  } else {
    // Intro: vertical flip — tail points upward toward the window.
    ctx.save();
    ctx.transform(1, 0, 0, -1, 0, 0);
    ctx.drawImage(img, bx, -(by + bh), bw, bh);
    ctx.restore();
  }
  ctx.globalAlpha = 1.0;

  const isLifeLost  = isLifeLostBubble;
  const BASE_SCALE  = _TITLE_SCALE_OVERRIDE[_active.bubbleKey]
    ?? (isLifeLost ? 0.305 : 0.29);
  const PULSE_AMP   = isOutro ? 0.014 : 0.04; // level-end titles: 65% less pulse than intros
  const TITLE_SCALE = BASE_SCALE + PULSE_AMP * Math.abs(Math.sin(_active.titleAnim * Math.PI * 0.75));
  const TITLE_H     = Math.round(147 * TITLE_SCALE);
  const baseText    = _DIALOGUE_TEXT[_active.bubbleKey];
  // titleOverride lets damage dialogues rotate text while reusing the same PNG.
  const text        = baseText && _active.titleOverride
    ? { title: _active.titleOverride, body: baseText.body }
    : baseText;
  let titleBottomY  = 0;
  if (text) {
    if (text.title) {
      const titleLines     = text.title.split('\n');
      const lineScales     = _TITLE_LINE_SCALES[_active.bubbleKey];
      // Build per-line scale (TITLE_SCALE × per-line multiplier) and height.
      const lineData = titleLines.map((ln, li) => {
        const sc = TITLE_SCALE * (lineScales ? (lineScales[li] ?? 1.0) : 1.0);
        return { text: ln, scale: sc, h: Math.round(147 * sc) };
      });
      // Total block height: sum of each line's height + 4px gap between lines.
      const LINE_GAP    = 4;
      const totalTitleH = lineData.reduce((sum, d, i) => sum + d.h + (i > 0 ? LINE_GAP : 0), 0);
      const ty0 = isLifeLost
        ? Math.round(by + (bh - totalTitleH) / 2)
        : TITLE_Y_INTRO;
      let curY = ty0;
      for (const d of lineData) {
        const lw = measureYellowText(d.text, d.scale);
        const lx = Math.round((canvasW - lw) / 2);
        drawYellowText(ctx, d.text, lx, curY, d.scale);
        curY += d.h + LINE_GAP;
      }
      titleBottomY = ty0 + totalTitleH;
    }

    // Body: BlockCraft inside bubble.
    // Flipped rect bubbles: spike now at top ~28px, interior starts below that.
    // Burst (lifeLost): no flip, use centered padding.
    if (text.body) {
      const isBurst = _active.bubbleKey === 'l3_outro' ||
                      _active.bubbleKey === 'life_hazard' ||
                      _active.bubbleKey === 'life_wasp';
      const BODY_PX     = _BODY_PX_OVERRIDE[_active.bubbleKey] ?? 20;
      const padX        = isBurst ? 60 : 8;
      const bodyMaxW    = bw - padX * 2;
      // Always center text on the bubble's own horizontal center.
      const bodyCenterX = bx + bw / 2;
      const bodyX       = Math.round(bodyCenterX - bodyMaxW / 2);
      // Intro: vertical flip → tail at top → interior starts 32px down.
      // Outro: measured from l1_outro.png (208×80 src, 1.2× → 250×96 display).
      //   Speech rect y=0-74 src → top border ≈6px, tail ≈7px at bottom → interiorH ≈ bh-13.
      // Burst: centered layout with wide padding.
      const interiorTop = isBurst ? by + 52 : (isOutro ? by + 6 : by + 32);
      const interiorH   = isBurst ? bh - 80 : (isOutro ? bh - 13 : bh - 36);
      const lineH       = Math.round(BODY_PX * 1.2);
      const lines       = text.body.split('\n').length;
      const blockH      = lines * lineH;
      const bodyY       = interiorTop + Math.max(0, Math.round((interiorH - blockH) / 2))
                        + (_BODY_Y_OFFSET[_active.bubbleKey] ?? 0);
      drawBodyText(ctx, text.body, bodyX, bodyY, BODY_PX, '#111', bodyMaxW);
    }
  }

  if (_active.dismissible) {
    const promptY = titleBottomY > 0 ? titleBottomY + 40 : by + bh + 35;
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE or CLICK to continue]', canvasW / 2, promptY);
    ctx.textAlign = 'left';
  }
}
