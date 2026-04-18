# Dialogue System — Design Doc

**Project:** Soggy Moggy / Gato Sin Botas
**Date:** 2026-04-18
**Deadline:** 2026-04-22
**Author:** Julian Gomez (with AI assistance)

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

Both grids live at the top of `src/dialogue.js`. Tunable without touching font.js.

**Title font** — `Letter_alphabet_pixel_retro_video_game_style.png`
- 9 cols × 6 rows; skip top 2 decorative rows (GAME / ALPHABET banners)
- Order: `ABCDEFGHIJKLMNOPQRSTUVWXYZ?!1234567890`
- Initial cellW/cellH = 120px (MUST BE MEASURED — native PNG is too big for Claude to read). If glyphs clip or misalign, open the PNG in Aseprite and update the four constants.

**Body font** — `alphabet.png`
- 7 cols × 4 rows; default uses top-left white variant
- Order: `ABCDEFGHIJKLMNOPQRSTUVWXYZ` + 2 empty cells
- Initial cellW/cellH = 64px (confirmed by reading the preview — may need fine tuning)
- Switch to teal/black/outline by changing `startX/startY` to the other quadrant

## Bubble atlas

`_BUBBLES` at top of `src/dialogue.js`. Five names: `small1`, `small2`, `wide1`, `wide2`, `burst`.

Coords are estimates; tune with Aseprite if bubbles clip. Only 5 entries × 4 fields = 20 numbers to adjust max.

## Best-practice checklist (from expert agent)

- [x] `ctx.imageSmoothingEnabled = false` — already set once in `main.js` line 134; not overridden anywhere.
- [x] Integer-align destination x/y with `Math.round` — done in `drawText` and `renderDialogue`.
- [x] Integer scale factors only — font uses sub-integer scale (0.4, 0.5) for this project because source PNGs are native-huge; `imageSmoothingEnabled=false` keeps it crisp.
- [x] Wrap cache keyed by `(key|scale|maxWidth|text)` — LRU-capped at 64 entries in `font.js`.
- [x] No kerning — fixed advance width.
- [x] Image-load guard — `fontIsReady()` checks `img.complete && naturalWidth > 0`.
- [x] No per-glyph `globalCompositeOperation` — tinting NOT implemented; colour chosen by picking the right atlas variant.

## Hidden risks (flagged by expert; mitigations applied)

1. **Two `takeDamage()` call sites must agree on whether to run.** Mitigation: PLAYING update() early-returns when `isDialogueBlocking()` is true. All physics functions stay intact; only the scheduler is gated.
2. **`hazard.iframeTimer` doesn't tick during pause.** Mitigation: when dialogue clears, iframeTimer still has its full 1.0s → effective invincibility is `1.2s (bubble) + remaining iframe`. No instant re-hit.
3. **`respawnAboveWater()` called inside `updateHazard()` before bubble.** Decision: teleport first, then show bubble — bubble appears at the new (safe) position. Simpler; keeps existing flow.
4. **Web Audio context suspended on first input.** N/A for this phase — no SFX added yet. When Phase 6 audio lands, guard with `audioCtx.state === 'running'`.

## QA fixes applied before hand-off (18.04.2026)

Two edge cases surfaced by QA review; both patched in this build:

5. **Input held-through from previous screen.** Space (from START Enter) or Z (from finish trigger) could still be pressed when the bubble opens, instantly dismissing it. Mitigation: `readyTimer = 0.15s` on intro/outro entries. `advanceDialogue()` rejects input while `readyTimer > 0`. `updateDialogue(dt)` decrements it each frame. Life-lost overlays don't need this — they're not dismissible.
6. **ESC bleedover into subsequent phase.** A held ESC during LEVEL_INTRO would hop into PLAYING on the next frame and trigger PAUSED. Same for LEVEL_OUTRO skipping past LEVEL_COMPLETE. Mitigation: both overlay cases in `main.js` swallow `keys.escape` unconditionally (`if (keys.escape) keys.escape = false;`).

## Testing plan

Manual smoke test (no automated tests in this project):

1. Open `index.html` in browser.
2. START screen → press Enter → **Level 1 intro bubble** appears. Verify bubble shape + text. Press Space → game begins.
3. Play L1, reach finish trigger, press Z → finish animation → **Level 1 outro bubble**. Press Space → stats menu.
4. Select "Siguiente nivel" → **Level 2 intro bubble** → play L2 → outro → L3 intro → L3 outro (victory, burst bubble).
5. During gameplay: let hazard hit you → **hazard life-lost bubble** for 1.2s → resume.
6. During gameplay (L1/L2/L3): touch a wasp → **wasp life-lost bubble** for 1.2s → resume.
7. Lose all 3 lives → GAMEOVER screen (no life-lost bubble on the fatal hit).

Tuning pass (day 2-3):
- If text is clipped: reduce `titleScale` / `bodyScale` in `renderDialogue` (currently 0.4-0.6).
- If bubble clips: adjust `_BUBBLES[name].sx/sy/w/h`.
- If glyphs misalign: adjust `_TITLE_CONFIG.cellW/cellH/startY` or `_BODY_CONFIG` same fields.

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
