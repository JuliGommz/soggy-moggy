/*
====================================================================
* background.js - Parallax background: sky, clouds, stars
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
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
const _bgL1Wall     = new Image(); _bgL1Wall.src     = 'PixelArt/backgrounds/level1_city/building_wall.png';
const _bgL1TrashBin = new Image(); _bgL1TrashBin.src = 'PixelArt/backgrounds/level1_city/trash-bin.png';
const _bgL1Door     = new Image(); _bgL1Door.src     = 'PixelArt/backgrounds/level1_city/building-door.png';
const _bgL1Cornice  = new Image(); _bgL1Cornice.src  = 'PixelArt/backgrounds/level1_city/Cornice.png';
const _bgL1Roof     = new Image(); _bgL1Roof.src     = 'PixelArt/backgrounds/level1_city/Building_Roof.png';
const _bgL2Sun      = new Image(); _bgL2Sun.src      = 'PixelArt/backgrounds/level2_see/sun.png';

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

  // Sky — day always at full opacity so fillRect never bleeds through
  _drawLayerAlpha(ctx, _bgL1Day,   camShift, 0.30, 0, 1);
  _drawLayerAlpha(ctx, _bgL1Night, camShift, 0.30, 0, t);

  // Level 2: sun between sky and clouds (before clouds so clouds can pass in front)
  if (GameState.level === 2) {
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
}

// Level 1 element world-Y positions (must match colliders in platforms.js).
// Wall sidewalk top = y562 in building_wall.png; cornice band = y389 in wall texture.
// Cornice placed ~5× its visible height (19px) above wall cornice line: 389 - 95 = 294.
// Elements sit on sidewalk: bottom aligned to y562.
const _L1_CORNICE_Y = 294;  // decorative cornice band (moved up 95px from wall's y389)
const _L1_BIN_Y     = 465;  // 562 (sidewalk) - 97 (bin content height)
const _L1_DOOR_Y    = 423;  // 562 (sidewalk) - 139 (door content height)

// Sprite padding offsets (from PIL alpha-scan of each PNG):
//   trash-bin.png:    content starts at (6, 5)
//   building-door.png: content starts at (2, 2)
//   Cornice.png:      content starts at (28, 60)
//   Building_Roof.png: content starts at (25, 21)

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
