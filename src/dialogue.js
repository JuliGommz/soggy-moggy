/*
====================================================================
* dialogue.js - Content table, bubble rendering, lifecycle manager
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-18
* Version: 1.0 - Initial dialogue + bubble overlay system
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Content table DIALOGUE maps 6 level-intro/outro + 2 life-lost variants;
*   each entry carries { titleLine, bodyLine, bubble, duration? }
* - Overlay lifecycle pattern (_active = null | {...}) mirrors _balloon idiom
* - Life-lost variant selection keyed by cause ∈ { 'hazard', 'wasp' }
*
* NOTES:
* - Fonts + bubble sheet loaded here at module-top (same pattern as other sprites)
* - Must load AFTER font.js, AFTER game-state.js
* - ATLAS GRID CONSTANTS live near top of this file — tune in Aseprite if off
* - Life-lost overlays pause physics via isDialogueBlocking(); main.js checks
*
* VERSION HISTORY:
* - v1.0: Initial; Level intro/outro + life-lost hazard/wasp overlays
====================================================================
*/
// Depends on: loadFont, drawText, measureText, normalizeText, fontIsReady (font.js)
//             GameState, GamePhase (game-state.js)

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — SPRITE ASSETS + ATLAS GRIDS (tunable constants)
// ════════════════════════════════════════════════════════════════════════════

// ── Font source images ───────────────────────────────────────────────────────
// Both atlases processed in Illustrator: transparent bg, banner rows removed
// on title font, cropped to alphabet grid only. Exports are vector-sourced
// at 576 px width (10 cols × 4 rows for title, 7 cols × 4 rows for body).
const _sprFontTitle = new Image();
_sprFontTitle.src = 'PixelArt/fonts/alphabet_pixel_retro_video_game_style.png';

const _sprFontBody = new Image();
_sprFontBody.src = 'PixelArt/fonts/alphabet_black_230px.png';

// ── Bubble sheet ─────────────────────────────────────────────────────────────
const _sprBubbles = new Image();
_sprBubbles.src = 'PixelArt/thought_bubbles/thought-bubbles.png';

// ── Title font grid ──────────────────────────────────────────────────────────
// Vecteezy "letter-alphabet-pixel-retro-video-game-style" — banner rows
// removed in Illustrator, exported as clean 10-col × 4-row alphabet grid:
//   Row 1: A B C D E F G H I _      (9 glyphs + 1 empty cell)
//   Row 2: J K L M N O P Q R _      (9 glyphs + 1 empty cell)
//   Row 3: S T U V W X Y Z ? !      (10 glyphs)
//   Row 4: 1 2 3 4 5 6 7 8 9 0      (10 digits)
// cellW/cellH computed from naturalWidth/naturalHeight at load.
const _TITLE_CONFIG = {
  cols:       10,
  rows:       4,
  startX:     0,
  startY:     0,
  order:      'ABCDEFGHI JKLMNOPQR STUVWXYZ?!1234567890',
  // cellW, cellH, advance, lineHeight, spaceWidth filled in by _finalizeFontConfig()
};

// ── Body font grid ───────────────────────────────────────────────────────────
// Vecteezy "vector-pixel-alphabet-set" — source keyed to transparent bg,
// cropped to a single color variant. 7 cols × 4 rows, last 2 cells empty.
const _BODY_CONFIG = {
  cols:       7,
  rows:       4,
  startX:     0,
  startY:     0,
  // Image layout: row 0 ABCDEFG, row 1 HIJKLMN, row 2 OPQRST_, row 3 UVWXYZ_
  // (last cell of rows 2 & 3 is empty — mark with spaces at positions 20 & 27)
  order:      'ABCDEFGHIJKLMNOPQRST UVWXYZ ',
  // cellW, cellH, advance, lineHeight, spaceWidth filled in by _finalizeFontConfig()
};

// Derive cell metrics from the loaded image. `decoRows` = rows at the top to
// skip via startY (for a title banner); 0 for a clean alphabet-only sheet.
// cellW/cellH stay fractional — drawImage accepts non-integer source rects and
// Math.round on the final destination keeps blits pixel-aligned. Floor'ing here
// would accumulate drift across columns (eg 576/10 = 57.6 → col 9 off by 5.4px).
function _finalizeFontConfig(img, cfg, decoRows) {
  cfg.cellW      = img.naturalWidth  / cfg.cols;
  cfg.cellH      = img.naturalHeight / cfg.rows;
  if (decoRows) cfg.startY = decoRows * cfg.cellH;
  cfg.advance    = cfg.cellW * 0.88; // slight kerning overlap
  cfg.lineHeight = cfg.cellH * 1.05;
  cfg.spaceWidth = cfg.cellW * 0.5;

}

// Register fonts on image load — fontIsReady() checks will gate rendering until ready.
_sprFontTitle.addEventListener('load', () => {
  _finalizeFontConfig(_sprFontTitle, _TITLE_CONFIG, 0);
  loadFont('title', _sprFontTitle, _TITLE_CONFIG);
});
_sprFontBody.addEventListener('load', () => {
  _finalizeFontConfig(_sprFontBody, _BODY_CONFIG, 0);
  loadFont('body', _sprFontBody, _BODY_CONFIG);
});

// Also register immediately if already cached (covers Firefox fast-load edge case)
if (_sprFontTitle.complete && _sprFontTitle.naturalWidth > 0) {
  _finalizeFontConfig(_sprFontTitle, _TITLE_CONFIG, 0);
  loadFont('title', _sprFontTitle, _TITLE_CONFIG);
}
if (_sprFontBody.complete && _sprFontBody.naturalWidth > 0) {
  _finalizeFontConfig(_sprFontBody, _BODY_CONFIG, 0);
  loadFont('body', _sprFontBody, _BODY_CONFIG);
}

// ── Bubble atlas ─────────────────────────────────────────────────────────────
// thought-bubbles.png layout (3 rows):
//   Row 1 (y~4):   small1 (sx~8)  | wide1 (sx~240)
//   Row 2 (y~130): small2 (sx~8)  | wide2 (sx~240)
//   Row 3 (y~270): burst (spans full width)
// MEASURE IN ASEPRITE if clipping/padding appears.
const _BUBBLES = {
  small1: { sx:   8, sy:   4, w: 200, h: 110 },
  wide1:  { sx: 240, sy:   4, w: 240, h: 110 },
  small2: { sx:   8, sy: 130, w: 200, h: 110 },
  wide2:  { sx: 240, sy: 130, w: 240, h: 110 },
  burst:  { sx:   8, sy: 270, w: 240, h: 240 },
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — CONTENT TABLE (Julian's text; edit here to retune)
// ════════════════════════════════════════════════════════════════════════════
//
// Each entry: { title, body, bubble }
//   title  — rendered with title font (supports A-Z + 0-9 + ? + !).
//            Empty string = no title row.
//   body   — rendered with body font (A-Z only; digits/accents/punct stripped).
//            Kept short; wraps inside bubble.
//   bubble — named key into _BUBBLES.
//
// Text normalization: normalizeText() strips accents, Ñ→N, unsupported
// punctuation → space, uppercases everything. So the raw strings here can
// be written naturally; the renderer does the conversion.

const _DIALOGUE = {
  levelStart: [
    // [0] unused (levels are 1-indexed)
    null,
    // [1] Level 1 — Stadt (smog)
    { title: 'ALERTA CIUDADANA!', body: 'NIVELES ALTOS DE CONTAMINACIÓN EN LA CIUDAD', bubble: 'wide2' },
    // [2] Level 2 — Aufzugschacht (electricity)
    { title: 'ATENCIÓN!',         body: 'ASCENSOR FUERA DE SERVICIO MANTENGA LA CALMA', bubble: 'wide2' },
    // [3] Level 3 — Leuchtturm (flood)
    { title: 'ATENCIÓN!',         body: 'MAREA ALTA TOME DISTANCIA DEL MAR',            bubble: 'wide2' },
  ],
  levelEnd: [
    null,
    // [1] end of L1
    { title: 'QUÉ NUEVE VIDAS?!', body: 'COUGH COUGH',            bubble: 'small2' },
    // [2] end of L2
    { title: 'UFF!',              body: 'SALVADO POR LA CAMPANA', bubble: 'wide1'  },
    // [3] end of L3 — final victory
    { title: 'MIAU MIAU!',        body: 'MAMI',                   bubble: 'burst'  },
  ],
  lifeLost: {
    hazard: { title: 'JUAPUCHIS!', body: '', bubble: 'burst' },
    wasp:   { title: 'AYAYAYAY!',  body: '', bubble: 'burst' },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Active overlay state + lifecycle
// ════════════════════════════════════════════════════════════════════════════

// _active = null (no overlay) | {
//   entry:       { title, body, bubble }   — resolved content
//   kind:        'intro' | 'outro' | 'lifeLost'
//   blocking:    boolean                   — true → physics pause
//   dismissible: boolean                   — true → Space/click advances
//   duration:    number (seconds)          — 0 = wait for input; >0 = auto-clear
//   timer:       number                    — counts down to 0
//   onDismiss:   function (optional)       — called when overlay clears
// }
let _active = null;

// ────────────────────────────────────────────────────────────────────────────
// showLevelStart(level)
// Shown before playing a level. Blocks updates until player presses Space/click.
// ────────────────────────────────────────────────────────────────────────────
function showLevelStart(level) {
  const entry = _DIALOGUE.levelStart[level];
  if (!entry) return;
  _active = {
    entry,
    kind:        'intro',
    blocking:    true,
    dismissible: true,
    duration:    0,
    timer:       0,
    readyTimer:  0.15, // reject Space/Z dismiss for first 150ms (avoids input bleed from prev screen)
  };
}

// ────────────────────────────────────────────────────────────────────────────
// showLevelEnd(level, onDismiss)
// Shown after finish trigger completes, before LEVEL_COMPLETE menu.
// ────────────────────────────────────────────────────────────────────────────
function showLevelEnd(level, onDismiss) {
  const entry = _DIALOGUE.levelEnd[level];
  if (!entry) return;
  _active = {
    entry,
    kind:        'outro',
    blocking:    true,
    dismissible: true,
    duration:    0,
    timer:       0,
    readyTimer:  0.15, // reject dismiss for first 150ms (finish-trigger Z press bleeds through otherwise)
    onDismiss,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// showLifeLost(cause)
// Transient overlay after takeDamage. cause ∈ { 'hazard', 'wasp' }.
// Auto-dismisses after 1.2s; blocks physics during that time.
// ────────────────────────────────────────────────────────────────────────────
function showLifeLost(cause) {
  const entry = _DIALOGUE.lifeLost[cause] || _DIALOGUE.lifeLost.hazard;
  _active = {
    entry,
    kind:        'lifeLost',
    blocking:    true,
    dismissible: false,
    duration:    1.2,
    timer:       1.2,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// advanceDialogue()
// Called by main.js when Space/click is pressed during an intro/outro overlay.
// ────────────────────────────────────────────────────────────────────────────
function advanceDialogue() {
  if (!_active || !_active.dismissible) return false;
  if (_active.readyTimer && _active.readyTimer > 0) return false; // input held from previous screen — ignore
  const cb = _active.onDismiss;
  _active = null;
  if (typeof cb === 'function') cb();
  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// updateDialogue(dt)
// Ticks the timer on auto-dismiss overlays (life-lost) and the readyTimer
// (which suppresses dismiss input for the first 150ms after an intro/outro
// opens, so a Space/Z held from the previous screen does not immediately
// clear the bubble).
// ────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────
// isDialogueBlocking()
// True when a blocking overlay is active. main.js uses this to early-return
// from physics updates while still ticking updateDialogue.
// ────────────────────────────────────────────────────────────────────────────
function isDialogueBlocking() {
  return _active !== null && _active.blocking === true;
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Rendering
// ════════════════════════════════════════════════════════════════════════════

// Screen-space draw. Caller must call AFTER ctx.restore() (i.e. outside world space).
function renderDialogue(ctx) {
  if (!_active) return;
  if (!_sprBubbles.complete || _sprBubbles.naturalWidth === 0) return;

  const canvasW = 480;
  const canvasH = 640;

  if (_active.kind !== 'lifeLost') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  const bubbleDef = _BUBBLES[_active.entry.bubble] || _BUBBLES.wide1;
  // Burst source rect is too narrow for the spiky shape; use full sheet width
  // and remaining sheet height from sy downward. Other bubbles use their def.
  const srcW = (bubbleDef === _BUBBLES.burst) ? _sprBubbles.naturalWidth : bubbleDef.w;
  const srcH = (bubbleDef === _BUBBLES.burst) ? (_sprBubbles.naturalHeight - bubbleDef.sy) : bubbleDef.h;
  const bw = Math.min(srcW, canvasW);
  const bh = Math.min(srcH, Math.round(canvasH * 0.55));
  const bx = Math.round((canvasW - bw) / 2);
  const by = Math.round((canvasH - bh) / 2 - 40);

  ctx.drawImage(_sprBubbles, bubbleDef.sx, bubbleDef.sy, srcW, srcH,
                              bx, by, bw, bh);

  // ── Text inside bubble (atlas fonts via font.js) ─────────────────────────
  const marginX  = Math.round(bw * 0.12);
  const marginY  = Math.round(bh * 0.14);
  const textMaxW = bw - marginX * 2;
  const cx       = bx + Math.round(bw / 2);
  let   cy       = by + marginY;

  const isLifeLost = _active.kind === 'lifeLost';

  // Scales computed from target glyph height — source atlas can be any resolution.
  const titleTargetPx = isLifeLost ? 26 : 20;
  const bodyTargetPx  = isLifeLost ? 18 : 14;

  const rawTitle = _active.entry.title || '';
  if (rawTitle && fontIsReady('title')) {
    const titleScale = titleTargetPx / _TITLE_CONFIG.cellH;
    const res = drawText(ctx, 'title', normalizeText(rawTitle), cx, cy, {
      scale:    titleScale,
      align:    'center',
      maxWidth: textMaxW,
    });
    cy += res.h + 4;
  }

  const rawBody = _active.entry.body || '';
  if (rawBody && fontIsReady('body')) {
    const bodyScale = bodyTargetPx / _BODY_CONFIG.cellH;
    drawText(ctx, 'body', normalizeText(rawBody), cx, cy, {
      scale:    bodyScale,
      align:    'center',
      maxWidth: textMaxW,
    });
  }

  // ── Dismiss hint (canvas text by design — not an atlas font) ─────────────
  if (_active.dismissible) {
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ESPACIO o CLICK para continuar]', canvasW / 2, canvasH - 30);
    ctx.textAlign = 'left';
  }
}
