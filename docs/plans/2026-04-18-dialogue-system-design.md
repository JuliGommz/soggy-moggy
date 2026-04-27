# Dialogue System — Design Doc

> **Superseded (2026-04-22, final)** — this document describes the first bitmap-font dialogue attempt (full font atlas, `src/font.js`, `drawText`, `normalizeText`, per-character rendering). That pipeline was abandoned mid-way and replaced twice:
>
> 1. **2026-04-21** — switched to pre-rendered PNG bubbles with text baked in Illustrator (see `2026-04-20-dialogue-bubbles-illustrator.md`).
> 2. **2026-04-22** — pivoted to a hybrid font stack: yellow-red bitmap atlas for titles (inlined in `src/dialogue.js` SECTION 1.5), BlockCraft.otf via `@font-face` for body text. The second bitmap attempt (`alphabet_black_230px.png`, 7x4 grid) was abandoned due to row-bleed and inconsistent spacing.
>
> Current source of truth: `src/dialogue.js` SECTION 1.5 (YELLOW_FONT atlas + drawYellowText + drawBodyText) and `index.html` `@font-face` block. Kept as historical record only — do not follow the instructions below.

**Project:** Soggy Moggy
**Date:** 2026-04-18
**Last updated:** 2026-04-20 (font atlas debugging session — filenames, auto-compute, pending cleanup)
**Deadline:** 2026-04-22
**Author:** Julian Gomez (with AI assistance)

---

## Current Status (as of 20.04.2026)

**Architecture: complete.** All logic, lifecycle, and rendering code is in place.

**Pending before browser test (dialogue.js — 4 items):**
1. `_sprFontTitle.src` → change `alphabet_pixel_retro_video_game_style_576px.png` to `alphabet_pixel_retro_video_game_style.png`
2. `_sprFontBody.src` → change `alphabet_black_576px.png` to `alphabet_black_230px.png`
3. Remove `_drawDebugFontGrid()` function and its two call sites in `renderDialogue()`
4. Remove `console.log` from `_finalizeFontConfig()`

Once those 4 items are done → run the 7-step smoke test below.

---

## Scope

Six bubble moments + two transient overlays:

| Trigger | Kind | Phase | Dismiss |
|---|---|---|---|
| Level 1 start | intro | LEVEL_INTRO | Space / click |
| Level 2 start | intro | LEVEL_INTRO | Space / click |
| Level 3 start | intro | LEVEL_INTRO | Space / click |
| Level 1 end   | outro | LEVEL_OUTRO | Space / click |
| Level 2 end   | outro | LEVEL_OUTRO | Space / click |
| Level 3 end (victory) | outro | LEVEL_OUTRO | Space / click |
| Life lost — hazard | transient | (overlay on PLAYING) | auto 1.2s |
| Life lost — wasp   | transient | (overlay on PLAYING) | auto 1.2s |

Global START screen (decorative title) is kept unchanged and chains into the Level 1 intro.

## Files

- `src/font.js` — bitmap font registry + renderer. Pure, no game-state coupling.
- `src/dialogue.js` — font + bubble image preloads, content table, lifecycle, rendering.
- `src/game-state.js` — added `LEVEL_INTRO` and `LEVEL_OUTRO` to `GamePhase`.
- `src/main.js` — added phase cases, render hook, input routing, early-return on blocking overlay.
- `src/hazards.js` — `takeDamage()` now takes `cause` parameter and calls `showLifeLost()`.
- `src/enemies.js` — wasp sting calls `takeDamage('wasp')`.
- `index.html` — loads `font.js` + `dialogue.js` before `main.js`.

## State flow

```
START ──(Enter)──► LEVEL_INTRO[1] ──(Space)──► PLAYING
PLAYING (finish trigger) ──► LEVEL_OUTRO ──(Space)──► LEVEL_COMPLETE menu
LEVEL_COMPLETE [Siguiente] ──► LEVEL_INTRO[N+1] ──(Space)──► PLAYING
LEVEL_COMPLETE [Reiniciar] ──► LEVEL_INTRO[curr] ──(Space)──► PLAYING
PAUSED [Reiniciar] ──► LEVEL_INTRO[curr] ──(Space)──► PLAYING

PLAYING (takeDamage) ──► life-lost overlay (1.2s, physics frozen) ──► PLAYING resumes
```

Fall-off-bottom and hazard contact pass `cause='hazard'`; wasp sting passes `cause='wasp'`. Fatal hit (lives → 0) skips the life-lost bubble and goes straight to GAMEOVER.

## Content table (Julian's text)

Edit `_DIALOGUE` at top of `src/dialogue.js`:

```js
levelStart: [
  null,
  { title: 'ALERTA CIUDADANA!', body: 'NIVELES ALTOS DE CONTAMINACION EN LA CIUDAD', bubble: 'wide2' },
  { title: 'ATENCION!',         body: 'ASCENSOR FUERA DE SERVICIO MANTENGA LA CALMA', bubble: 'wide2' },
  { title: 'ATENCION!',         body: 'MAREA ALTA TOME DISTANCIA DEL MAR',            bubble: 'wide2' },
],
levelEnd: [
  null,
  { title: 'QUE NUEVE VIDAS?!', body: 'COUGH COUGH',            bubble: 'small2' },
  { title: 'UFF!',              body: 'SALVADO POR LA CAMPANA', bubble: 'wide1'  },
  { title: 'MIAU MIAU!',        body: 'MAMI',                   bubble: 'burst'  },
],
lifeLost: {
  hazard: { title: 'JUAPUCHIS!', body: '', bubble: 'burst' },
  wasp:   { title: 'AYAYAYAY!',  body: '', bubble: 'burst' },
},
```

Normalization (`normalizeText` in font.js):
- Lowercase → UPPERCASE
- á/é/í/ó/ú → A/E/I/O/U (diacritics stripped via NFD)
- Ñ → N
- Unsupported chars (`, . : ; ¿ ¡`) → space
- Surviving set: `A-Z 0-9 ! ? -` + space

Title font supports `A-Z 0-9 ? !`. Body font supports `A-Z` only. Digits in body-slot text will be dropped to space.

## Font atlas config

Both grids live at the top of `src/dialogue.js`. Cell dimensions are **auto-computed** by `_finalizeFontConfig()` at image load — no manual measurement needed.

```js
function _finalizeFontConfig(img, cfg, decoRows) {
  cfg.cellW      = img.naturalWidth  / cfg.cols;   // fractional — no Math.floor (avoids column drift)
  cfg.cellH      = img.naturalHeight / cfg.rows;
  if (decoRows) cfg.startY = decoRows * cfg.cellH;
  cfg.advance    = cfg.cellW * 0.88;
  cfg.lineHeight = cfg.cellH * 1.05;
  cfg.spaceWidth = cfg.cellW * 0.5;
}
```

Text is rendered at a target pixel height regardless of atlas resolution:
```js
const titleScale = titleTargetPx / _TITLE_CONFIG.cellH;   // e.g. 20 / cellH
const bodyScale  = bodyTargetPx  / _BODY_CONFIG.cellH;    // e.g. 14 / cellH
```

**Title font** — `Visuals/fonts/alphabet_pixel_retro_video_game_style.png`
- Exported from Illustrator: transparent bg, Kantenglättung: Keine, uniform 10-col × 4-row grid
- Row 0: A B C D E F G H I _ (9 glyphs + 1 empty at col 9)
- Row 1: J K L M N O P Q R _ (9 glyphs + 1 empty at col 9)
- Row 2: S T U V W X Y Z ? !
- Row 3: 1 2 3 4 5 6 7 8 9 0
- Order string: `'ABCDEFGHI JKLMNOPQR STUVWXYZ?!1234567890'`
- If glyphs misalign: check cols (10) and rows (4) match the actual export

**Body font** — `Visuals/fonts/alphabet_black_230px.png`
- Exported from Illustrator: transparent bg, black glyphs, top-left quadrant only
- 7 cols × 4 rows; last cell of rows 2 and 3 is empty
- Row 0: A B C D E F G
- Row 1: H I J K L M N
- Row 2: O P Q R S T _ (col 6 empty)
- Row 3: U V W X Y Z _ (col 6 empty)
- Order string: `'ABCDEFGHIJKLMNOPQRST UVWXYZ '`
- Original multi-variant source archived to `Visuals/fonts/Archive/`

If glyphs clip or misalign: check that the export has exactly 7 × 4 cells with uniform spacing. The auto-compute will be correct if the grid is correct.

## Bubble atlas

`_BUBBLES` at top of `src/dialogue.js`. Five named entries:

| Key | sx | sy | w | h |
|---|---|---|---|---|
| small1 | 8 | 4 | 200 | 110 |
| wide1  | 240 | 4 | 240 | 110 |
| small2 | 8 | 130 | 200 | 110 |
| wide2  | 240 | 130 | 240 | 110 |
| burst  | 8 | 270 | full width | remaining height |

Source: `Visuals/thought_bubbles/thought-bubbles.png`

Burst bubble uses `naturalWidth` and `naturalHeight - sy` as source rect to capture the full spiky shape.

If bubbles clip or show wrong shape: adjust sx/sy/w/h. Use Pixelorama to measure coordinates.

## Best-practice checklist

- [x] `ctx.imageSmoothingEnabled = false` — already set once in `main.js` line 134; not overridden anywhere.
- [x] Integer-align destination x/y with `Math.round` — done in `drawText` and `renderDialogue`.
- [x] Integer scale factors only — font uses sub-integer scale for this project because source PNGs are native-huge; `imageSmoothingEnabled=false` keeps it crisp.
- [x] Wrap cache keyed by `(key|scale|maxWidth|text)` — LRU-capped at 64 entries in `font.js`.
- [x] No kerning — fixed advance width.
- [x] Image-load guard — `fontIsReady()` checks `img.complete && naturalWidth > 0`.
- [x] No per-glyph `globalCompositeOperation` — tinting NOT implemented; colour chosen by picking the right atlas variant.
- [x] cellW/cellH fractional (no Math.floor) — prevents column drift across the glyph row.

## Hidden risks (flagged by expert; mitigations applied)

1. **Two `takeDamage()` call sites must agree on whether to run.** Mitigation: PLAYING update() early-returns when `isDialogueBlocking()` is true. All physics functions stay intact; only the scheduler is gated.
2. **`hazard.iframeTimer` doesn't tick during pause.** Mitigation: when dialogue clears, iframeTimer still has its full 1.0s → effective invincibility is `1.2s (bubble) + remaining iframe`. No instant re-hit.
3. **`respawnAboveWater()` called inside `updateHazard()` before bubble.** Decision: teleport first, then show bubble — bubble appears at the new (safe) position. Simpler; keeps existing flow.
4. **Web Audio context suspended on first input.** N/A for this phase — no SFX added yet. When Phase 6 audio lands, guard with `audioCtx.state === 'running'`.

## QA fixes applied before hand-off (18.04.2026)

5. **Input held-through from previous screen.** Space (from START Enter) or Z (from finish trigger) could still be pressed when the bubble opens, instantly dismissing it. Mitigation: `readyTimer = 0.15s` on intro/outro entries. `advanceDialogue()` rejects input while `readyTimer > 0`. `updateDialogue(dt)` decrements it each frame. Life-lost overlays don't need this — they're not dismissible.
6. **ESC bleedover into subsequent phase.** A held ESC during LEVEL_INTRO would hop into PLAYING on the next frame and trigger PAUSED. Same for LEVEL_OUTRO skipping past LEVEL_COMPLETE. Mitigation: both overlay cases in `main.js` swallow `keys.escape` unconditionally (`if (keys.escape) keys.escape = false;`).

## Testing plan

Manual smoke test (no automated tests in this project).

**Prerequisite:** Complete the 4 pending code items listed at the top of this document first.

1. Open `index.html` in browser.
2. START screen → press Enter → **Level 1 intro bubble** appears. Verify bubble shape + text. Press Space → game begins.
3. Play L1, reach finish trigger, press Z → finish animation → **Level 1 outro bubble**. Press Space → stats menu.
4. Select "Siguiente nivel" → **Level 2 intro bubble** → play L2 → outro → L3 intro → L3 outro (victory, burst bubble).
5. During gameplay: let hazard hit you → **hazard life-lost bubble** for 1.2s → resume.
6. During gameplay (L1/L2/L3): touch a wasp → **wasp life-lost bubble** for 1.2s → resume.
7. Lose all 3 lives → GAMEOVER screen (no life-lost bubble on the fatal hit).

Tuning pass if needed:
- Text clipped: reduce `titleTargetPx` / `bodyTargetPx` in `renderDialogue` (currently 20/14 normal, 26/18 life-lost).
- Bubble clips or wrong shape: adjust `_BUBBLES[name].sx/sy/w/h`.
- Glyph misaligns: verify Illustrator export has uniform grid (correct cols/rows count); auto-compute handles the rest.

## Attribution

Both fonts are Vecteezy Free License. Required attribution:
- Add "Fonts: Vecteezy.com" to credits screen (when credits screen exists)
- Add to README.md
- Add to Medienkatalog

## Out of scope (backlog)

- Dynamic level titles ("NIVEL 1" banner during gameplay)
- NPC dialogue system (FB-01 pending)
- Tutorial hints
- Audio cues on dialogue open/dismiss (Phase 6)
- 9-slice bubble scaling (decided against — optical weight is authorial, not mechanical)
