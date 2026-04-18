/*
====================================================================
* font.js - Bitmap-font renderer (uniform grid, pixel-crisp drawImage)
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-18
* Version: 1.0 - Initial bitmap font module
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Uniform-grid atlas pattern (cellW × cellH × cols × rows + order string)
*   matches existing sprite-sheet loading style (see _LH_SPRITES in background.js)
* - normalizeText() strips diacritics + uppercases via NFD decomposition;
*   ñ→N, ¿¡ stripped, unsupported chars replaced by space (advance only)
* - wrap cache keyed by (fontKey|scale|maxWidth|text), LRU-capped at 64 entries
*
* NOTES:
* - Must load BEFORE dialogue.js (dialogue.js calls loadFont/drawText)
* - No ES class, module-local _prefixed state — matches house style
* - Caller is responsible for ctx.imageSmoothingEnabled=false (set once in main.js)
* - All destination coordinates Math.round()-ed to avoid subpixel bleed
* - FONT ATLAS GRIDS are tuned at top of dialogue.js, not here
*
* VERSION HISTORY:
* - v1.0: loadFont, drawText, measureText, wrapText, normalizeText
====================================================================
*/
// No import/export — classic script tag; all symbols are global.

// ── Module-local font registry ──────────────────────────────────────────────
// Keyed by caller-chosen name (e.g. 'title', 'body'). Each entry:
//   { img, cellW, cellH, advance, lineHeight, spaceWidth, charMap }
// charMap: { 'A': {sx,sy,w,h}, 'B': {...}, ... }
const _fonts = {};

// LRU-ish wrap cache — prevents re-wrapping the same string every frame
const _wrapCache = new Map();
const _WRAP_CACHE_MAX = 64;

// ────────────────────────────────────────────────────────────────────────────
// loadFont(key, img, config)
// Registers a bitmap font in the module registry.
//
// config = {
//   cellW, cellH,      // source grid cell size in px
//   cols, rows,        // grid dimensions (rows is informational; not enforced)
//   startX, startY,    // top-left offset inside the image (skip decorative header rows)
//   order,             // string: char at left-to-right, top-to-bottom cell index
//                      //   use ' ' to mark an empty cell (no glyph)
//   advance,           // horizontal step per glyph at scale=1 (usually ≤ cellW)
//   lineHeight,        // vertical step per line at scale=1 (usually ≥ cellH)
//   spaceWidth,        // advance for ' ' character (no glyph drawn)
// }
// ────────────────────────────────────────────────────────────────────────────
function loadFont(key, img, config) {
  const charMap = {};
  const { order, cols, cellW, cellH, startX, startY } = config;
  for (let i = 0; i < order.length; i++) {
    const ch = order[i];
    if (ch === ' ') continue; // empty-cell marker
    const col = i % cols;
    const row = Math.floor(i / cols);
    charMap[ch] = {
      sx: startX + col * cellW,
      sy: startY + row * cellH,
      w:  cellW,
      h:  cellH,
    };
  }
  _fonts[key] = {
    img,
    cellW,
    cellH,
    advance:     config.advance     || cellW,
    lineHeight:  config.lineHeight  || cellH,
    spaceWidth:  config.spaceWidth  || Math.floor((config.advance || cellW) / 2),
    charMap,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// normalizeText(str)
// Strips Spanish diacritics, converts to UPPERCASE, removes unsupported punctuation.
// Output: only [A-Z 0-9 ! ? -] survive; spaces preserved; everything else → ' '.
// Call sites pass the result to drawText — keeps font.js pure of locale logic.
// ────────────────────────────────────────────────────────────────────────────
function normalizeText(str) {
  if (!str) return '';
  return str
    .normalize('NFD')                  // decompose diacritics (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')   // strip combining marks
    .toUpperCase()
    .replace(/Ñ/g, 'N')                // Ñ has no decomposition — manual
    .replace(/[^A-Z0-9 !?\-]/g, ' ')   // drop everything else to space
    .replace(/ +/g, ' ')               // collapse multiple spaces
    .trim();
}

// ────────────────────────────────────────────────────────────────────────────
// measureLine(font, line, scale)  [internal]
// Returns the drawn width of a single line (no newlines).
// ────────────────────────────────────────────────────────────────────────────
function _measureLine(font, line, scale) {
  let w = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === ' ') { w += font.spaceWidth; continue; }
    if (font.charMap[ch]) w += font.advance;
    else                  w += font.spaceWidth; // missing glyph → advance only
  }
  return Math.round(w * scale);
}

// ────────────────────────────────────────────────────────────────────────────
// wrapText(key, text, maxWidth, opts)
// Greedy word-wrap. Returns array of line strings.
// Caches results in _wrapCache keyed by (key|scale|maxWidth|text).
// ────────────────────────────────────────────────────────────────────────────
function wrapText(key, text, maxWidth, opts = {}) {
  const font = _fonts[key];
  if (!font) return [text || ''];
  const scale = opts.scale || 1;
  const cacheKey = key + '|' + scale + '|' + maxWidth + '|' + text;
  if (_wrapCache.has(cacheKey)) return _wrapCache.get(cacheKey);

  const words = (text || '').split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current.length === 0 ? word : current + ' ' + word;
    if (_measureLine(font, candidate, scale) <= maxWidth || current.length === 0) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  // Cheap LRU: evict oldest when over cap
  if (_wrapCache.size >= _WRAP_CACHE_MAX) {
    const firstKey = _wrapCache.keys().next().value;
    _wrapCache.delete(firstKey);
  }
  _wrapCache.set(cacheKey, lines);
  return lines;
}

// ────────────────────────────────────────────────────────────────────────────
// measureText(key, text, opts)
// Layout-only. Returns { w, h, lines: [...] } — useful for sizing a bubble
// around the text before drawing.
// ────────────────────────────────────────────────────────────────────────────
function measureText(key, text, opts = {}) {
  const font = _fonts[key];
  if (!font) return { w: 0, h: 0, lines: [''] };
  const scale    = opts.scale    || 1;
  const maxWidth = opts.maxWidth || Infinity;
  const lines    = wrapText(key, text, maxWidth, opts);
  let maxW = 0;
  for (const line of lines) {
    const w = _measureLine(font, line, scale);
    if (w > maxW) maxW = w;
  }
  return {
    w: maxW,
    h: Math.round(lines.length * font.lineHeight * scale),
    lines,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// drawText(ctx, key, text, x, y, opts)
// Renders text at (x, y). opts:
//   scale      — integer scale factor (1, 2, 3). Default 1.
//   maxWidth   — if given, wraps to multiple lines.
//   align      — 'left' | 'center' | 'right'. Default 'left'.
// Returns { w, h } — same as measureText.
// ────────────────────────────────────────────────────────────────────────────
function drawText(ctx, key, text, x, y, opts = {}) {
  const font = _fonts[key];
  if (!font) return { w: 0, h: 0, lines: [''] };
  if (!font.img.complete || font.img.naturalWidth === 0) return { w: 0, h: 0, lines: [''] };

  const scale    = opts.scale    || 1;
  const maxWidth = opts.maxWidth || Infinity;
  const align    = opts.align    || 'left';

  const lines      = wrapText(key, text, maxWidth, opts);
  const lineHeight = font.lineHeight * scale;
  const glyphW     = font.cellW * scale;
  const glyphH     = font.cellH * scale;
  const advance    = font.advance * scale;
  const spaceW     = font.spaceWidth * scale;

  let maxDrawnW = 0;
  for (let li = 0; li < lines.length; li++) {
    const line   = lines[li];
    const lineW  = _measureLine(font, line, scale);
    if (lineW > maxDrawnW) maxDrawnW = lineW;

    let lx;
    if      (align === 'center') lx = Math.round(x - lineW / 2);
    else if (align === 'right')  lx = Math.round(x - lineW);
    else                         lx = Math.round(x);
    const ly = Math.round(y + li * lineHeight);

    // Blit each glyph
    let cursor = lx;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === ' ') { cursor += spaceW; continue; }
      const g = font.charMap[ch];
      if (!g) { cursor += spaceW; continue; }
      ctx.drawImage(
        font.img,
        g.sx, g.sy, g.w, g.h,
        cursor, ly, glyphW, glyphH,
      );
      cursor += advance;
    }
  }

  return { w: maxDrawnW, h: Math.round(lines.length * lineHeight), lines };
}

// ────────────────────────────────────────────────────────────────────────────
// fontIsReady(key)
// True if the font's source image has finished loading and is safe to draw.
// ────────────────────────────────────────────────────────────────────────────
function fontIsReady(key) {
  const font = _fonts[key];
  if (!font) return false;
  return font.img.complete && font.img.naturalWidth > 0;
}
