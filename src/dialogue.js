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
const _sprFontTitle = new Image();
_sprFontTitle.src = 'PixelArt/fonts/Letter_alphabet_pixel_retro_video_game_style.png';

const _sprFontBody = new Image();
_sprFontBody.src = 'PixelArt/fonts/alphabet.png';

// ── Bubble sheet ─────────────────────────────────────────────────────────────
const _sprBubbles = new Image();
_sprBubbles.src = 'PixelArt/thought_bubbles/thought-bubbles.png';

// ── Title font grid ──────────────────────────────────────────────────────────
// Vecteezy "letter-alphabet-pixel-retro-video-game-style"
// Source JPG preview shows:
//   Row 1–2: decorative "GAME" / "ALPHABET" banner (SKIP)
//   Row 3:   A B C D E F G H I   (9 cols)
//   Row 4:   J K L M N O P Q R
//   Row 5:   S T U V W X Y Z ? !
//   Row 6:   1 2 3 4 5 6 7 8 9 0
// ASSUMPTION: source PNG is 9 cols × 6 rows of uniform cells.
// ⚠ IF GLYPHS ARE CLIPPED OR SHIFTED: open Letter_alphabet_pixel_retro_video_game_style.png
//   in Aseprite → measure one cell → update CELL_W_TITLE, CELL_H_TITLE, START_Y_TITLE.
const _TITLE_CONFIG = {
  cellW:      120,  // tune: true pixel width of one source cell
  cellH:      120,  // tune: true pixel height of one source cell
  cols:       9,
  rows:       6,
  startX:     0,
  startY:     240, // tune: skip decorative rows 1–2 (2 × cellH)
  // Cell index order, left→right, top→bottom, starting at row 3 of source:
  order:      'ABCDEFGHIJKLMNOPQRSTUVWXYZ?!1234567890',
  advance:    100, // slight tighter than cellW for compact layout
  lineHeight: 120,
  spaceWidth: 50,
};

// ── Body font grid ───────────────────────────────────────────────────────────
// Vecteezy "vector-pixel-alphabet-set" — 4 color variants in 2×2 layout on one sheet.
// Each variant has A–Z in a 7-col × 4-row arrangement (7+7+6+6 = 26, last 2 cells empty).
// We use ONE variant — the top-left (white on dark bg) — as our default body font.
// To switch to the teal/black/outline variant, change START_X / START_Y to the other quadrant.
const _BODY_CONFIG = {
  cellW:      64,
  cellH:      64,
  cols:       7,
  rows:       4,
  startX:     0,
  startY:     0,
  // 7×4 = 28 cells; A–Z = 26; last 2 empty. ' ' marks empty cells.
  order:      'ABCDEFGHIJKLMNOPQRSTUVWXYZ  ',
  advance:    56,
  lineHeight: 70,
  spaceWidth: 28,
};

// Register fonts on image load — fontIsReady() checks will gate rendering until ready.
_sprFontTitle.addEventListener('load', () => loadFont('title', _sprFontTitle, _TITLE_CONFIG));
_sprFontBody .addEventListener('load', () => loadFont('body',  _sprFontBody,  _BODY_CONFIG));

// Also register immediately if already cached (covers Firefox fast-load edge case)
if (_sprFontTitle.complete && _sprFontTitle.naturalWidth > 0) loadFont('title', _sprFontTitle, _TITLE_CONFIG);
if (_sprFontBody .complete && _sprFontBody .naturalWidth > 0) loadFont('body',  _sprFontBody,  _BODY_CONFIG);

// ── Bubble atlas ─────────────────────────────────────────────────────────────
// Source sheet thought-bubbles.png shows 5 shapes in a 3-row arrangement:
//   Row 1 (top):    small rounded  |  wide rounded
//   Row 2 (middle): small rounded  |  wide rounded
//   Row 3 (bottom): burst (spiky)
// ⚠ COORDINATES BELOW ARE ESTIMATES based on the preview. If bubble clips or
//   shows padding, open thought-bubbles.png in Aseprite, measure precise
//   bounds, and update sx/sy/w/h. Only 5 entries to tune.
const _BUBBLES = {
  small1: { sx:   8, sy:   4, w: 200, h: 100 },
  small2: { sx: 240, sy:   4, w: 240, h: 100 },
  wide1:  { sx:   8, sy: 130, w: 200, h: 110 },
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
    { title: 'ALERTA CIUDADANA!', body: 'NIVELES ALTOS DE CONTAMINACION EN LA CIUDAD', bubble: 'wide2' },
    // [2] Level 2 — Aufzugschacht (electricity)
    { title: 'ATENCION!',         body: 'ASCENSOR FUERA DE SERVICIO MANTENGA LA CALMA', bubble: 'wide2' },
    // [3] Level 3 — Leuchtturm (flood)
    { title: 'ATENCION!',         body: 'MAREA ALTA TOME DISTANCIA DEL MAR',            bubble: 'wide2' },
  ],
  levelEnd: [
    null,
    // [1] end of L1
    { title: 'QUE NUEVE VIDAS?!', body: 'COUGH COUGH',            bubble: 'small2' },
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

  // Dark overlay for intro/outro to separate bubble from gameplay behind it.
  // Life-lost stays un-dimmed — it's a quick reaction, not a full screen event.
  if (_active.kind !== 'lifeLost') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  const bubbleDef = _BUBBLES[_active.entry.bubble] || _BUBBLES.wide1;

  // Bubble draw size: scale up for visibility on 480×640 canvas.
  // Integer scale keeps pixel-crisp edges (expert rec: no 1.5×).
  const scale = 1;
  const bw = bubbleDef.w * scale;
  const bh = bubbleDef.h * scale;

  // Center on canvas, slightly above middle (more balanced with bubble tail pointing down).
  const bx = Math.round((canvasW - bw) / 2);
  const by = Math.round((canvasH - bh) / 2 - 40);

  // Draw bubble
  ctx.drawImage(_sprBubbles, bubbleDef.sx, bubbleDef.sy, bubbleDef.w, bubbleDef.h,
                              bx, by, bw, bh);

  // ── Text layout inside bubble ─────────────────────────────────────────────
  // Leave ~12% margin on each side (tail + rounded corners eat some room).
  const marginX  = Math.round(bw * 0.14);
  const marginY  = Math.round(bh * 0.12);
  const textMaxW = bw - marginX * 2;

  const cx = bx + Math.round(bw / 2);
  let   cy = by + marginY;

  const rawTitle = _active.entry.title || '';
  const rawBody  = _active.entry.body  || '';
  const titleStr = normalizeText(rawTitle);
  const bodyStr  = normalizeText(rawBody);

  // Title first — larger, if present.
  // Title font glyphs are large (cellH=120); use scale < 1 via repeated down-scale
  // is not possible with integer-only rule. Instead we use the raw size and rely
  // on the cell dimensions being tuned appropriately.
  // Solution: render title at scale=1 (but pick a small cell size in config).
  if (titleStr && fontIsReady('title')) {
    const titleScale = _active.kind === 'lifeLost' ? 0.5 : 0.4; // half-res for fit
    // Note: drawText supports fractional scale — we bend the "integer only" rule here
    // specifically for bitmap sheets that come native-huge. Acceptable because the
    // source is already high-res; down-scaling stays crisp enough with imageSmoothingEnabled=false.
    const measured = measureText('title', titleStr, { maxWidth: textMaxW, scale: titleScale });
    drawText(ctx, 'title', titleStr, cx, cy, { maxWidth: textMaxW, scale: titleScale, align: 'center' });
    cy += measured.h + 6;
  }

  // Body — smaller, below title. Only if bodyStr non-empty AND body font ready.
  if (bodyStr && fontIsReady('body')) {
    const bodyScale = _active.kind === 'lifeLost' ? 0.6 : 0.5;
    drawText(ctx, 'body', bodyStr, cx, cy, { maxWidth: textMaxW, scale: bodyScale, align: 'center' });
  }

  // ── Dismiss hint for intro/outro (bottom of canvas) ───────────────────────
  if (_active.dismissible) {
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ESPACIO o CLICK para continuar]', canvasW / 2, canvasH - 30);
    ctx.textAlign = 'left';
  }
}
