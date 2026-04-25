/*
====================================================================
* background.js - Parallax background: sky, clouds, stars
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-08
* Version: 1.5 - wall tiles brick-only above ground; stops at roof; cornice raised 95px
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - 5-layer parallax architecture with independent parallax factors
*   (day sky 0.30x → night 0.30x → stars 0.10x → clouds 0.60x)
* - Altitude factor t (0=ground, 1=level top) used for all crossfades
* - tileH seam-fix: content_height formula + Math.round() to eliminate
*   sub-pixel gap artifacts between tiling rows
* - Day/night + cloud bright/dark crossfade via globalAlpha = t
* - Level 2 t-offset: adds 0.35 so sky starts at dusk using existing assets
*
* NOTES:
* - renderBackground() must run in screen space (before ctx.save/translate)
* - updateBackground() runs every frame regardless of game phase —
*   animates the start screen background too
* - Known issue: faint seam lines still visible at some altitudes
*
* VERSION HISTORY:
* - v1.0: Day sky + static clouds, basic parallax scroll
* - v1.1: Night sky crossfade, stars fade-in, horizontal cloud drift
* - v1.2: tileH seam fix (Math.round + content_height), level 2 dusk offset
====================================================================
*/
// Depends on: GameState (game-state.js)
// Render order: sky (day/night crossfade) → stars → clouds (bright/dark crossfade)
// updateBackground(dt) must be called each frame from main.js update()

// ── Asset loading ─────────────────────────────────────────────────────────────
const _bgL1Day    = new Image(); _bgL1Day.src    = 'PixelArt/backgrounds/shared/sky_day.png';
const _bgL1Night  = new Image(); _bgL1Night.src  = 'PixelArt/backgrounds/shared/sky_night.png';
const _bgL2Bright = new Image(); _bgL2Bright.src = 'PixelArt/backgrounds/shared/clouds_bright.png';
const _bgL2Dark   = new Image(); _bgL2Dark.src   = 'PixelArt/backgrounds/shared/clouds_dark.png';
const _bgStars    = new Image(); _bgStars.src    = 'PixelArt/backgrounds/shared/stars.png';

// ── Level-specific assets ──────────────────────────────────────────────────────
const _bgL1Wall     = new Image(); _bgL1Wall.src     = 'PixelArt/backgrounds/level_1_city/building_wall.png';
const _bgL1TrashBin = new Image(); _bgL1TrashBin.src = 'PixelArt/backgrounds/level_1_city/trash_bin.png';
const _bgL1Door     = new Image(); _bgL1Door.src     = 'PixelArt/backgrounds/level_1_city/building_door.png';
const _bgL1Cornice  = new Image(); _bgL1Cornice.src  = 'PixelArt/backgrounds/level_1_city/cornice.png';
const _bgL1Roof     = new Image(); _bgL1Roof.src     = 'PixelArt/backgrounds/level_1_city/building_roof.png';
const _bgL2Sun      = new Image(); _bgL2Sun.src      = 'PixelArt/backgrounds/level_3_sea/sun.png';
// Lighthouse (Phase 04.2) — replaces the earlier rocket-tower prototype
// lighthouse_sheet2.png: [0] base extended to full 480px width (stone edge-to-edge fix).
// [1] mid1 position unchanged (sx=634). [2]–[8] unaffected.
const _bgL2LhSheet = new Image(); _bgL2LhSheet.src = 'PixelArt/backgrounds/level_3_sea/lighthouse_sheet2.png';
// L3 lighthouse cap — replaces the cap [8] sprite from lighthouse_sheet2.png with a
// standalone updated PNG (lh_08.06). The lever (drawn in main.js _renderFinishTrigger)
// sits in front of this cap as the player-side interactive object.
const _bgL2LhBack = new Image();
// Hardcoded bbox — measured once via scripts/measure_lh08_layers.py (PIL).
// Runtime bbox detection via getImageData() fails on file:// protocol due to CORS-
// tainted-canvas SecurityError, so we use a static value. Re-run the script after any
// asset change and update this constant.
// Bbox-anchor: centerX → canvas 240, bottom → topScrY + _LH_TOP_CONTENT_BOT.
const _LH08_BACK_BBOX = { sx: 3240, sy: 47, sw: 332, sh: 559 };  // lh_08.06.png — 3600x640
_bgL2LhBack.src = 'PixelArt/backgrounds/level_3_sea/EInzel-Sprites/lh_08.06.png';
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ EMERGENCY FIX — LOCKED — DO NOT CHANGE (school submission 2026-04-24)    ║
// ║                                                                          ║
// ║ Stone-band overlay that covers the ~20px transparent margin on each      ║
// ║ side of the lighthouse base cell. Root cause sits in the asset pipeline  ║
// ║ (Pixelorama 480px → Illustrator assembly trims each cell to content      ║
// ║ bounds → exported sheet base = 439px wide). A proper fix would require   ║
// ║ re-exporting the spritesheet from Illustrator without per-cell trim;     ║
// ║ deadline pressure makes an overlay the pragmatic choice.                 ║
// ║                                                                          ║
// ║ This overlay ships with the school submission. See GDD §3.4.             ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const _bgL2LhStoneFix = new Image(); _bgL2LhStoneFix.src = 'PixelArt/backgrounds/level_3_sea/lh_00_quick-fix.png';
// Anchor Y for the overlay, relative to the base tile's draw origin.
// Iteration history: 611 (too high) → 623 (12px deeper) → 633 (10 more) = LOCKED.
const _LH_STONE_FIX_ANCHOR_Y = 633;

// ── Level 3 assets (bg-back: shaft wall; bg-mid: pipes) ───────────────────────
const _bgL3Elevator    = new Image(); _bgL3Elevator.src    = 'PixelArt/backgrounds/level_2_shaft/elevator.png';
const _bgL3ShaftBot    = new Image(); _bgL3ShaftBot.src    = 'PixelArt/backgrounds/level_2_shaft/shaft_bg_bottom.png';
const _bgL3ShaftMid1   = new Image(); _bgL3ShaftMid1.src   = 'PixelArt/backgrounds/level_2_shaft/shaft_bg_mid1.png';
const _bgL3ShaftMid2   = new Image(); _bgL3ShaftMid2.src   = 'PixelArt/backgrounds/level_2_shaft/shaft_bg_mid2.png';
const _bgL3ShaftTop    = new Image(); _bgL3ShaftTop.src    = 'PixelArt/backgrounds/level_2_shaft/shaft_bg_top.png';
const _bgL3PipesBot    = new Image(); _bgL3PipesBot.src    = 'PixelArt/backgrounds/level_2_shaft/pipes_bottom.png';
const _bgL3PipesMid    = new Image(); _bgL3PipesMid.src    = 'PixelArt/backgrounds/level_2_shaft/pipes_mid.png';
const _bgL3PipesTop    = new Image(); _bgL3PipesTop.src    = 'PixelArt/backgrounds/level_2_shaft/pipes_top.png';

const _LH_MID_H   = 577; // lighthouse mid tile content height (rows 30–607 = 578px, step=577)
// dyo = draw-Y offset in px: shifts each tile down to close art-side seam gaps.
// Computed from PIL content bounds so every seam is pixel-perfect (error=0).
const _LH_SPRITES = [
  // [0] base — sheet2 PIL measurement: content sx=2, sw=439. Centered on canvas x=240 → drawX=21.
  //   NOTE: stone art is 439px wide, so there is ~20px transparent margin on each side of the
  //   canvas. To remove the margin, extend the stone in Pixelorama to 480px width.
  { sx:    2, sw: 439, drawX:  21, dyo:  0 }, // [0] base
  { sx:  632, sw: 288, drawX:  96, dyo:  2 }, // [1] mid 1 — widest (sheet2: sx=632, sw=288)
  { sx: 1100, sw: 263, drawX: 108, dyo:  5 }, // [2] mid 2
  { sx: 1541, sw: 235, drawX: 122, dyo:  5 }, // [3] mid 3
  { sx: 1956, sw: 212, drawX: 134, dyo:  6 }, // [4] mid 4
  { sx: 2357, sw: 180, drawX: 150, dyo: 10 }, // [5] mid 5
  { sx: 2703, sw: 161, drawX: 159, dyo: 13 }, // [6] mid 6
  { sx: 3044, sw: 146, drawX: 167, dyo: 14 }, // [7] mid 7 — narrowest
  { sx: 3369, sw: 217, drawX: 132, dyo:  0 }, // [8] top cap
];
// 7 mid sprites used once each in taper order (widest→narrowest).
// Must have exactly Math.ceil(-levelGoalY_L2 / _LH_MID_H) entries — see platforms.js L2 height.
const _LH_MID_SEQ         = [1, 2, 3, 4, 5, 6, 7]; // 7 tiles bottom→top, each sprite once
const _LH_TOP_CONTENT_BOT = 568; // row of cap's last-solid pixel — aligns cap bottom with mid7 top
// Ground offset: base sprite has 31px transparent below content (rows 609–639).
// Shift all lighthouse draws down by this amount so rocky ground reaches canvas bottom.
// Must stay in sync with L2 levelHeight in platforms.js (uses same value).
const _LH_GROUND_OFFSET   = 31;

const BG_H = 640; // tile height — matches canvas height
const BG_W = 480; // tile width  — matches canvas width

const CLOUD_DRIFT_PX_S = 15; // horizontal cloud drift speed (px/sec)

// ── State ─────────────────────────────────────────────────────────────────────
// Separate drift per cloud layer — different start offsets give visual variety
let _bgDriftBright = Math.random() * BG_W;       // bright clouds: random start X
let _bgDriftDark   = Math.random() * BG_W * 0.7; // dark clouds:   different random start
let _sunTimer      = 0;                          // accumulated time for sun animation (seconds)

// tileH for cloud layers — higher value = more gap between rows → approx. 2 visible rows
// bright: content 186px, tileH 380 → ~194px gap between bands
// dark:   content 210px, tileH 420 → ~210px gap between bands
const _CLOUD_BRIGHT_TILEH = 380;
const _CLOUD_DARK_TILEH   = 420;

// ── Update ────────────────────────────────────────────────────────────────────
// Call every frame regardless of game phase — animates start screen too.
function updateBackground(dt) {
  _bgDriftBright = (_bgDriftBright + CLOUD_DRIFT_PX_S * dt)        % BG_W;
  _bgDriftDark   = (_bgDriftDark   + CLOUD_DRIFT_PX_S * 0.7 * dt)  % BG_W; // slightly slower
  _sunTimer     += dt;
}

// ── Render ───────────────────────────────────────────────────────────────────
// Must be called in screen space (before ctx.save/translate in main.js).
//
// Altitude factor t (0 = ground/day, 1 = level top/night):
//   t = camShift / levelHeight
//   derived from GameState.levelGoalY (set by generateLevelPlatforms in platforms.js)
//
// Layer draw order:
//   1. Day sky     — always alpha 1    (full opacity base)
//   2. Night sky   — alpha = t         (overlays day; crossfade)
//   3. Stars       — fade in at t>0.3
//   4. Bright clouds — alpha = 1-t     (fade out as night approaches)
//   5. Dark clouds   — alpha = t       (fade in as night approaches)
function renderBackground(ctx) {
  const camShift = -GameState.cameraY; // 0 at game start; grows as player climbs

  // Raw altitude: 0 at ground, 1 at level goal (before any level-specific offset)
  const maxShift = (GameState.levelGoalY < 0) ? -GameState.levelGoalY : 2000;
  const rawAlt   = Math.min(1, Math.max(0, camShift / maxShift));

  // Level 2+: sky starts at dusk (t offset 0.35) — gives sea/evening feel with existing assets
  let t = rawAlt;
  if (GameState.level >= 2) {
    t = Math.min(1, t + 0.35);
  }
  // Level 2: enclosed shaft — always full-night so stars show from ground up
  if (GameState.level === 2) {
    t = 1;
  }

  // Sky — day always at full opacity so fillRect never bleeds through
  _drawLayerAlpha(ctx, _bgL1Day,   camShift, 0.30, 0, 1);
  _drawLayerAlpha(ctx, _bgL1Night, camShift, 0.30, 0, t);

  // Level 3: sun between sky and clouds (before clouds so clouds can pass in front)
  if (GameState.level === 3) {
    _drawL2Sun(ctx, camShift, rawAlt);
  }

  // Stars — fade in from t=0.3, fully visible at t=0.7; drift at 30% of cloud speed
  const starAlpha = Math.min(1, Math.max(0, (t - 0.3) / 0.4));
  _drawLayerAlpha(ctx, _bgStars, camShift, 0.10, _bgDriftBright * 0.3, starAlpha, 363);

  // Clouds — separate drift per layer
  _drawLayerAlpha(ctx, _bgL2Bright, camShift, 0.60, _bgDriftBright, 1 - t, _CLOUD_BRIGHT_TILEH);
  _drawLayerAlpha(ctx, _bgL2Dark,   camShift, 0.60, _bgDriftDark,   t,     _CLOUD_DARK_TILEH);

  // Level 1: building wall IN FRONT of clouds (clouds visible through transparent wall areas)
  if (GameState.level === 1) {
    _drawBuildingWall(ctx, camShift);
  }

  // Level 1: individual building elements drawn once at level bottom — scroll with world
  if (GameState.level === 1) {
    _drawL1Elements(ctx, camShift);
  }

  // Level 3: lighthouse tower + sea landing area — in front of clouds, same layer as L1 wall
  if (GameState.level === 3) {
    _drawL2Lighthouse(ctx, camShift);
  }

  // Level 2: shaft walls → pipes → roof cap (roof drawn LAST so it covers pipe
  // caps at the ceiling — pipes must appear to run UNDER the yellow roof band).
  if (GameState.level === 2) {
    _drawL3Back(ctx, camShift);
    _drawL3Mid(ctx, camShift);
    _drawL3Ceiling(ctx, camShift);
  }
}

// Level 1 element world-Y positions (must match colliders in platforms.js).
// Wall sidewalk top = y562 in building_wall.png; cornice band = y389 in wall texture.
// Cornice placed ~5× its visible height (19px) above wall cornice line: 389 - 95 = 294.
// Elements sit on sidewalk: bottom aligned to y562.
const _L1_CORNICE_Y = 294;  // decorative cornice band (moved up 95px from wall's y389)
const _L1_BIN_Y     = 465;  // 562 (sidewalk) - 97 (bin content height)
const _L1_DOOR_Y    = 423;  // 562 (sidewalk) - 139 (door content height)

// Sprite padding offsets (from PIL alpha-scan of each PNG):
//   trash_bin.png:    content starts at (6, 5)
//   building_door.png: content starts at (2, 2)
//   cornice.png:      content starts at (28, 60)
//   building_roof.png: content starts at (25, 21)

// Draws Level 1 building elements once at world bottom — scroll with world.
// camShift = -cameraY; screenY = worldY + camShift.
function _drawL1Elements(ctx, camShift) {
  const cs = Math.round(camShift);

  // Cornice — decorative band at wall's cornice height
  if (_bgL1Cornice.complete && _bgL1Cornice.naturalWidth > 0) {
    ctx.drawImage(_bgL1Cornice, 0, _L1_CORNICE_Y - 60 + cs);
  }

  // Trash bins — left side, sitting on sidewalk
  if (_bgL1TrashBin.complete && _bgL1TrashBin.naturalWidth > 0) {
    ctx.drawImage(_bgL1TrashBin, 85 - 6, _L1_BIN_Y - 5 + cs);
  }

  // Building door — right side, sitting on sidewalk
  if (_bgL1Door.complete && _bgL1Door.naturalWidth > 0) {
    ctx.drawImage(_bgL1Door, 280 - 2, _L1_DOOR_Y - 2 + cs);
  }

  // Building roof — placed at level goal (top of level)
  if (_bgL1Roof.complete && _bgL1Roof.naturalWidth > 0 && GameState.levelGoalY !== undefined) {
    ctx.drawImage(_bgL1Roof, 0, GameState.levelGoalY - 56 + cs);
  }
}

// Draws the Level 2 sun with animation: pulse, arc movement, and day→night fade.
// rawAlt: raw altitude 0–1 (before Level 2 t-offset) — used for sun lifecycle.
function _drawL2Sun(ctx, camShift, rawAlt) {
  if (!_bgL2Sun.complete || _bgL2Sun.naturalWidth === 0) return;

  // Fade: fully visible at dawn (rawAlt=0), gone by dusk (rawAlt≥0.6)
  const sunAlpha = Math.max(0, 1 - rawAlt / 0.6);
  if (sunAlpha <= 0) return;

  // Pulse: size oscillates ±10% over 8 seconds
  const pulse = 1 + 0.10 * Math.sin(_sunTimer * Math.PI * 2 / 8);

  // Arc: sun starts low (y=120), peaks at midday (y=50), sinks back as dusk approaches
  const arcOffset = Math.sin(rawAlt * Math.PI) * 70;
  const screenX   = 300 + Math.sin(_sunTimer * 0.2) * 30; // gentle side drift
  const screenY   = 120 - arcOffset + camShift * 0.04;    // arc + very slow vertical drift

  // 3× original size (64→192 base) with pulse
  const baseSize = 192;
  const drawSize = Math.round(baseSize * pulse);
  const drawX    = Math.round(screenX - drawSize / 2);
  const drawY    = Math.round(screenY - drawSize / 2);

  const savedAlpha = ctx.globalAlpha;
  ctx.globalAlpha  = sunAlpha;
  ctx.drawImage(_bgL2Sun, drawX, drawY, drawSize, drawSize);
  ctx.globalAlpha  = savedAlpha;
}

// Draws Level 2 lighthouse — replaces rocket tower (Phase 04.2).
// Uses lighthouse_sheet.png: 9 elements — base, 7 mid tiles (tapering), top cap.
// Base drawn once at world y=0; mid tiles by world position for consistent taper;
// top cap snapped so its content-bottom aligns with the last mid tile top edge.
function _drawL2Lighthouse(ctx, camShift) {
  if (!_bgL2LhSheet.complete || _bgL2LhSheet.naturalWidth === 0) return;

  const cs    = Math.round(camShift);
  const goalY = (GameState.levelGoalY !== undefined) ? GameState.levelGoalY : -5000;
  const sh    = BG_H; // all sprites: full canvas height (640px)

  const GO = _LH_GROUND_OFFSET; // 31px shift — anchors rocky ground to canvas bottom

  // Base tile — drawn once at world y=0; shifted down by GO so content-bottom hits canvas edge
  const base = _LH_SPRITES[0];
  ctx.drawImage(_bgL2LhSheet, base.sx, 0, base.sw, sh, base.drawX, cs + GO, base.sw, sh);

  // ── EMERGENCY FIX — LOCKED — DO NOT CHANGE (see loader block above) ─────────
  // Stone-band overlay masks the asset-pipeline trim on the base cell.
  // Native pixel size (no stretch). Centered on canvas x=240.
  // Bottom edge anchored at screen-y = cs + GO + _LH_STONE_FIX_ANCHOR_Y.
  // Ships with the school submission. See GDD §3.4.
  if (_bgL2LhStoneFix.complete && _bgL2LhStoneFix.naturalWidth > 0) {
    const ow = _bgL2LhStoneFix.naturalWidth;
    const oh = _bgL2LhStoneFix.naturalHeight;
    const ox = Math.round(240 - ow / 2);
    const oy = Math.round(cs + GO + _LH_STONE_FIX_ANCHOR_Y - oh);
    ctx.drawImage(_bgL2LhStoneFix, ox, oy);
  }

  // Mid tiles — sprite chosen by world position so taper is consistent regardless of culling
  for (let wy = -_LH_MID_H; wy > goalY - _LH_MID_H; wy -= _LH_MID_H) {
    const tileIdx = Math.floor((-wy / _LH_MID_H) - 1);
    const sprIdx  = _LH_MID_SEQ[Math.min(tileIdx, _LH_MID_SEQ.length - 1)];
    const spr     = _LH_SPRITES[sprIdx];
    const sy = wy + cs + GO + spr.dyo; // dyo closes art-side seam gaps per tile
    if (sy > BG_H)           continue; // below viewport
    if (sy + sh < 0) break;            // above viewport — done
    ctx.drawImage(_bgL2LhSheet, spr.sx, 0, spr.sw, sh, spr.drawX, sy, spr.sw, sh);
  }

  // Top cap — lh_08.06.png. Snapped to last mid tile, accounting for its dyo so the
  // join stays seamless. The lever (drawn later in main.js _renderFinishTrigger) sits
  // in front of this cap.
  const cap        = _LH_SPRITES[8];
  const lastMidSpr = _LH_SPRITES[_LH_MID_SEQ[_LH_MID_SEQ.length - 1]];
  const lastTileWy = -(Math.ceil(-goalY / _LH_MID_H)) * _LH_MID_H;
  const topScrY    = Math.round(lastTileWy + cs + GO + lastMidSpr.dyo) - _LH_TOP_CONTENT_BOT;
  if (topScrY < BG_H && topScrY + sh > -BG_H) {
    if (_bgL2LhBack.complete && _bgL2LhBack.naturalWidth > 0) {
      // lh_08.06 — bbox-anchored: content centerX → canvas 240, content_bottom → topScrY + 568.
      // +30 px Y-offset closes the seam with sprite 7 (lh_07) at the cap/mid-tile join.
      const b = _LH08_BACK_BBOX;
      const DEST_X = Math.round(240 - b.sw / 2) + 1;
      const DEST_Y = topScrY + _LH_TOP_CONTENT_BOT - b.sh + 38;
      ctx.drawImage(_bgL2LhBack, b.sx, b.sy, b.sw, b.sh, DEST_X, DEST_Y, b.sw, b.sh);
    } else {
      // Fallback to original sheet cap if lh_08.06 hasn't loaded yet.
      ctx.drawImage(_bgL2LhSheet, cap.sx, 0, cap.sw, sh, cap.drawX, topScrY, cap.sw, sh);
    }
  }

  // ── Lantern light-glow — soft horizontal beams emanating from the lit window ─
  _drawL3LanternGlow(ctx, cs);
}

// Soft pulsing horizontal glow at the lantern window — two warm beams left + right.
// World anchor: cap row 175 (between roof row 80 and saucer row 272), x=240.
// Additive blend (composite 'lighter') over the lighthouse cap; cat/lever drawn later in
// the render order, so they stay in front of the glow.
function _drawL3LanternGlow(ctx, cs) {
  const t  = performance.now() / 1000;
  const cy = Math.round((175 - 4562) + cs);  // lantern center on screen
  if (cy < -120 || cy > BG_H + 120) return;  // off-screen guard

  // Slow base pulse (1.2 Hz) + low-rate flicker (mix of two sines, small amplitude).
  // Values bounded to [0.20, 0.62] so the effect is always present but never harsh.
  const slow    = 0.45 + 0.30 * Math.sin(t * 1.2);
  const flicker = 0.06 * Math.sin(t * 11.7) + 0.04 * Math.sin(t * 4.3);
  const a       = Math.max(0.20, Math.min(0.62, slow + flicker));

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const dir of [-1, 1]) {
    // Three nested ellipses per side: outer dim → mid warm → inner hot. Stacking
    // additive layers gives a smooth radial falloff with native canvas2d only.
    const cx0 = 240 + dir * 30;  // start offset from lighthouse axis
    ctx.fillStyle = `rgba(255, 220, 110, ${(a * 0.18).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(cx0 + dir * 110, cy, 130, 55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255, 235, 160, ${(a * 0.28).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(cx0 + dir *  65, cy,  85, 38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255, 248, 215, ${(a * 0.42).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(cx0 + dir *  35, cy,  45, 24, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Draws Level 3 shaft wall background (bg-back layer, world-speed 1.0x).
// Images are full 480×640 — no sub-region needed.
// Draw order:
//   1. Elevator.png         — elevator car at world y=0 (ground)
//   2. ShaftBottom.png      — first shaft section directly above (world y=−640)
//   3. ShaftMid1/2.png      — alternating tiles from world y=−1280 up to level goal
//   4. ShaftTop.png         — cap: bottom edge aligned to levelGoalY
function _drawL3Back(ctx, camShift) {
  if (!_bgL3Elevator.complete  || _bgL3Elevator.naturalWidth  === 0) return;
  if (!_bgL3ShaftBot.complete  || _bgL3ShaftBot.naturalWidth  === 0) return;
  if (!_bgL3ShaftMid1.complete || _bgL3ShaftMid1.naturalWidth === 0) return;
  if (!_bgL3ShaftMid2.complete || _bgL3ShaftMid2.naturalWidth === 0) return;
  if (!_bgL3ShaftTop.complete  || _bgL3ShaftTop.naturalWidth  === 0) return;
  if (GameState.levelGoalY === undefined) return; // first-frame guard — avoid wrong clip geometry

  const cs    = Math.round(camShift);
  const goalY = GameState.levelGoalY;

  // World-space clip: ceiling at goalY is invariant to cameraY and canvas scaling.
  // Unclamped rect — top may be negative; early-return only if ceiling is below viewport.
  const clipTopScreen = Math.round(goalY + camShift);
  if (clipTopScreen >= BG_H) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, clipTopScreen, BG_W, BG_H - clipTopScreen);
  ctx.clip();

  // Mid tiles FIRST — top tile anchored to goalY; tile downward. Any overlap past
  // the ShaftBot top (world-y −544) is covered by ShaftBot below. Parity from world-Y
  // so mid1/mid2 alternation is deterministic across re-runs.
  const shaftBotTopWy = 96 - BG_H; // −544
  for (let wy = goalY; wy < shaftBotTopWy; wy += BG_H) {
    const sy = wy + cs;
    if (sy + BG_H < 0) continue; // above viewport — keep walking down
    if (sy > BG_H)     break;    // below viewport — done
    const tileIdx = Math.round((wy - goalY) / BG_H);
    ctx.drawImage(tileIdx % 2 === 0 ? _bgL3ShaftMid1 : _bgL3ShaftMid2, 0, sy);
  }

  // Elevator car at world origin — drawn after mid so mid doesn't overpaint it.
  ctx.drawImage(_bgL3Elevator, 0, cs);

  // Shaft bottom — covers mid-tile overlap below world-y −544, and the
  // elevator's top 96 rows so the ceiling seam is flush.
  ctx.drawImage(_bgL3ShaftBot, 0, cs + 96 - BG_H);

  // NOTE: shaft_bg_top is NOT drawn here. Only the roof band strip is drawn in
  // _drawL3Ceiling using a 9-arg drawImage source-rect crop. Rows 255+ of the
  // image (shaft interior with different stone pattern) are intentionally never
  // rendered — shaft_bg_mid tiles + pipes supply the shaft interior below the
  // roof band.
  ctx.restore();
}

// Top-most L2 layer — draws ONLY the roof band (image rows 175..175+H) on top
// of pipes. Rows below 175+H of the source image are never drawn, so the shaft
// interior pattern of shaft_bg_top cannot conflict with shaft_bg_mid tiles.
// Tune L2_ROOF_BAND_H only if the hatch trapezoid gets cut off (raise) or if
// shaft stones begin appearing over pipe tops near the ceiling (lower).
const L2_ROOF_BAND_H = 80; // rows 175-254 of shaft_bg_top: golden band + hatch only (stone interior starts at row 255)
function _drawL3Ceiling(ctx, camShift) {
  if (!_bgL3ShaftTop.complete || _bgL3ShaftTop.naturalWidth === 0) return;
  if (GameState.levelGoalY === undefined) return;

  const goalY = GameState.levelGoalY;
  const clipTopScreen = Math.round(goalY + camShift);
  if (clipTopScreen >= BG_H) return;

  // Redundant world-space clip (safety against bleed above ceiling — cannot
  // affect pipes because no pixels are drawn above clipTopScreen anyway).
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, clipTopScreen, BG_W, BG_H - clipTopScreen);
  ctx.clip();

  // 9-arg drawImage: render ONLY source rows [175, 175+H) at screen rows
  // [clipTopScreen, clipTopScreen+H). No overlap with shaft interior.
  ctx.drawImage(
    _bgL3ShaftTop,
    0, 175, BG_W, L2_ROOF_BAND_H,      // source rect (image rows 175..335)
    0, clipTopScreen, BG_W, L2_ROOF_BAND_H // dest rect (screen rows at ceiling)
  );

  ctx.restore();
}

// Draws Level 3 pipe/cable layer (bg-mid layer, 1.0x parallax — locked to world).
//
// Stacking from ground up (all 1.0x parallax, locked to world):
//   1. pipes_bottom — bottom edge anchored to world-y 96 (elevator ceiling).
//      Visible content is the pipe end-caps/flanges emerging from the ceiling;
//      upper portion of the tile is transparent tube content.
//   2. pipes_mid    — tiled upward from pipes_bottom's top edge until goalY.
//   3. pipes_top    — caps the run below the roof (175-row transparent header).
//
// Pipes are drawn only ABOVE the elevator ceiling (world-y < 96) so they never
// paint over the elevator interior (world-y 0..640), which has its own walls
// rendered in elevator.png via _drawL3Back.
//
// PARALLAX NOTE: previously this layer used FACTOR=0.90 for a subtle depth
// effect, but that made the pipes drift upward relative to the elevator
// ceiling (1.0 parallax) as the camera rose — ~10 % of camShift per frame,
// producing a visible 15–40 px gap between pipe-bottom and ceiling.
// Using FACTOR=1.0 locks pipes to world space so the seam stays sealed.
function _drawL3Mid(ctx, camShift) {
  if (!_bgL3PipesBot.complete || _bgL3PipesBot.naturalWidth === 0) return;
  if (!_bgL3PipesMid.complete || _bgL3PipesMid.naturalWidth === 0) return;
  if (!_bgL3PipesTop.complete || _bgL3PipesTop.naturalWidth === 0) return;
  if (GameState.levelGoalY === undefined) return; // first-frame guard

  const cs    = Math.round(camShift);
  const goalY = GameState.levelGoalY;

  // World-space clip — identical pattern to _drawL3Back. Single source of truth
  // for the ceiling boundary: no screen-space clamping, no Math.max(0, …).
  const clipTopScreen = Math.round(goalY + camShift);
  if (clipTopScreen >= BG_H) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, clipTopScreen, BG_W, BG_H - clipTopScreen);
  ctx.clip();

  // Mid tiles FIRST — top tile anchored to goalY. Any overlap below world-y −544
  // is covered by PipesBot. Cap (PipesTop) covers the top tile's band region.
  const pipesBotTopWy = 96 - BG_H; // −544
  for (let wy = goalY; wy < pipesBotTopWy; wy += BG_H) {
    const sy = wy + cs;
    if (sy + BG_H < 0) continue;
    if (sy > BG_H)     break;
    ctx.drawImage(_bgL3PipesMid, 0, sy);
  }

  // Pipes bottom — bottom anchored to elevator ceiling (world-y 96). Covers any
  // mid-tile overhang between world-y −544 and 96.
  {
    const sy = (96 - BG_H) + cs;
    if (sy <= BG_H && sy + BG_H >= 0) {
      ctx.drawImage(_bgL3PipesBot, 0, sy);
    }
  }

  // Pipes top cap — 280-row transparent header; content-top aligned to goalY.
  ctx.drawImage(_bgL3PipesTop, 0, clipTopScreen - 280);

  ctx.restore();
}

// Draws building_wall.png in world space (factor 1.0 — no parallax drift).
// Full 640px image drawn ONCE at ground level (sidewalk/steps at bottom).
// Above that, only the brick portion (top 562px) tiles upward.
// Tiling stops at levelGoalY (roof) so wall doesn't extend above the building.
function _drawBuildingWall(ctx, camShift) {
  if (!_bgL1Wall.complete || _bgL1Wall.naturalWidth === 0) return;
  const BRICK_H = 562;   // y=0..561 in image: pure brick (tileable)
  const FULL_H  = 640;   // full image includes sidewalk at y=562..639
  const cs      = Math.round(camShift);
  const goalY   = (GameState.levelGoalY !== undefined) ? GameState.levelGoalY : -5000;

  // Ground tile: full image at world y=0 (sidewalk visible at bottom of building)
  if (cs > -FULL_H && cs < BG_H) {
    ctx.drawImage(_bgL1Wall, 0, cs);
  }

  // Brick-only tiles above: world y steps upward by BRICK_H
  for (let wy = -BRICK_H; wy >= goalY - BRICK_H; wy -= BRICK_H) {
    const sy = wy + cs;
    if (sy > BG_H) continue;       // below viewport — skip
    if (sy + BRICK_H < 0) break;   // above viewport — done
    ctx.drawImage(_bgL1Wall, 0, 0, 480, BRICK_H, 0, sy, 480, BRICK_H);
  }
}

// Draws one image with vertical parallax scroll, horizontal drift, and opacity.
// tileH: vertical repeat interval in px (default BG_H=640).
//   Set to (content_end_y - gap_top) so that adjacent tiles' content regions
//   meet exactly, eliminating the visible horizontal seam from transparent padding.
//   Stars:         tileH=363  (content y=5-367,   363 rows,  gap_top=5)
//   Clouds_bright: tileH=186  (content y=16-201,  gap_top=16, image 480x220)
//   Clouds_dark:   tileH=210  (content y=0-209,   gap_top=0)
// Tiles both axes so the canvas is always fully covered at any scroll position.
function _drawLayerAlpha(ctx, img, camShift, yFactor, driftX, alpha, tileH = BG_H) {
  if (!img.complete || img.naturalWidth === 0 || alpha <= 0) return;

  const offsetY = Math.round((camShift * yFactor) % tileH); // round: prevents sub-pixel vertical seam gaps
  // Normalize driftX to [0, BG_W) — round to integer to prevent sub-pixel horizontal stripe
  const ox = Math.round(((driftX % BG_W) + BG_W) % BG_W);

  const savedAlpha = ctx.globalAlpha;
  ctx.globalAlpha  = alpha;

  // Vertical tiles: one extra above and below guarantees full canvas coverage
  for (let ty = offsetY - tileH; ty < BG_H + tileH; ty += tileH) {
    ctx.drawImage(img, -ox, ty);                    // primary tile (shifted left by ox)
    if (ox > 0) ctx.drawImage(img, BG_W - ox, ty); // fill horizontal gap on the right
  }

  ctx.globalAlpha = savedAlpha;
}
