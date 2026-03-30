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
const _bgL1TrashBin = new Image(); _bgL1TrashBin.src = 'PixelArt/backgrounds/level1_city/trash_bin.png';
const _bgL1Door     = new Image(); _bgL1Door.src     = 'PixelArt/backgrounds/level1_city/building_door.png';
const _bgL1Cornice  = new Image(); _bgL1Cornice.src  = 'PixelArt/backgrounds/level1_city/cornice.png';
const _bgL1Roof     = new Image(); _bgL1Roof.src     = 'PixelArt/backgrounds/level1_city/building_roof.png';
const _bgL2Sun      = new Image(); _bgL2Sun.src      = 'PixelArt/backgrounds/level2_see/sun.png';
const _bgL2Landing  = new Image(); _bgL2Landing.src  = 'PixelArt/backgrounds/level2_see/sea_launchpad.png';
const _bgL2Bottom   = new Image(); _bgL2Bottom.src   = 'PixelArt/backgrounds/level2_see/rocket_bottom.png';
const _bgL2MidTop   = new Image(); _bgL2MidTop.src   = 'PixelArt/backgrounds/level2_see/rocket_mid_top.png';
const _bgL2ScaffBot = new Image(); _bgL2ScaffBot.src = 'PixelArt/backgrounds/level2_see/rocket_scaffolding_bottom.png';
const _bgL2ScaffMid = new Image(); _bgL2ScaffMid.src = 'PixelArt/backgrounds/level2_see/rocket_scaffolding_mid.png';

// ── Level 3 assets (bg-back: shaft wall; bg-mid: pipes) ───────────────────────
const _bgL3Elevator    = new Image(); _bgL3Elevator.src    = 'PixelArt/backgrounds/level3_shaft/elevator.png';
const _bgL3ShaftBot    = new Image(); _bgL3ShaftBot.src    = 'PixelArt/backgrounds/level3_shaft/shaft_bg_bottom.png';
const _bgL3ShaftMid1   = new Image(); _bgL3ShaftMid1.src   = 'PixelArt/backgrounds/level3_shaft/shaft_bg_mid1.png';
const _bgL3ShaftMid2   = new Image(); _bgL3ShaftMid2.src   = 'PixelArt/backgrounds/level3_shaft/shaft_bg_mid2.png';
const _bgL3ShaftTop    = new Image(); _bgL3ShaftTop.src    = 'PixelArt/backgrounds/level3_shaft/shaft_bg_top.png';
const _bgL3PipesBot    = new Image(); _bgL3PipesBot.src    = 'PixelArt/backgrounds/level3_shaft/pipes_bottom.png';
const _bgL3PipesMid    = new Image(); _bgL3PipesMid.src    = 'PixelArt/backgrounds/level3_shaft/pipes_mid.png';
const _bgL3PipesTop    = new Image(); _bgL3PipesTop.src    = 'PixelArt/backgrounds/level3_shaft/pipes_top.png';

// rocket_mid_top.png sprite regions (PIL alpha-scan verified):
//   3 sprites, all sw=74px, sh=270px content (sy=24: 24px transparent top padding in source).
//   rocket_bottom.png content cx = (184+299)/2 = 241.5 → drawX = 241 − 37 = 204
const _RKT_SPRITES = [
  { sx:  24, sy: 24, sw: 74, sh: 270 }, // 0: mid tile A (left   sprite in sheet)
  { sx: 126, sy: 24, sw: 74, sh: 270 }, // 1: mid tile B (center sprite in sheet)
  { sx: 247, sy: 24, sw: 74, sh: 270 }, // 2: rocket top (right  sprite in sheet)
];
const _RKT_DRAW_X = 204; // screen x: centers 74px shaft over rocket bottom content (cx=241)
const _RKT_MID_H  = 270; // content height per tile — vertical tiling step

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
  // Level 3: enclosed shaft — always full-night so stars show from ground up
  if (GameState.level === 3) {
    t = 1;
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

  // Level 2: rocket tower + sea landing area — in front of clouds, same layer as L1 wall
  if (GameState.level === 2) {
    _drawL2Elements(ctx, camShift);
  }

  // Level 3: shaft wall background (bg-back, 1.0x) then pipes (bg-mid, 0.90x) on top
  if (GameState.level === 3) {
    _drawL3Back(ctx, camShift);
    _drawL3Mid(ctx, camShift);
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

// Draws Level 2 scaffolding behind the rocket tower (world-speed 1.0x).
// ScaffBot drawn once at world origin; ScaffMid tiles upward with 529px content step.
// Must be called BEFORE _drawL2Elements so scaffolding appears behind the rocket.
//
// ScaffMid content: rows 93–622 (529px). First tile wy=−622 places content-bottom
// at screen cs (= ScaffBot's image top), connecting the two layers seamlessly.
const _SCAF_STEP  = 529; // ScaffMid content height (rows 93–622)
const _SCAF_START = -622; // wy of first ScaffMid tile — content-bottom lands at screen cs

function _drawL2Scaffolding(ctx, camShift) {
  if (!_bgL2ScaffBot.complete || _bgL2ScaffBot.naturalWidth === 0) return;
  if (!_bgL2ScaffMid.complete || _bgL2ScaffMid.naturalWidth === 0) return;

  const cs    = Math.round(camShift);
  const goalY = (GameState.levelGoalY !== undefined) ? GameState.levelGoalY : -5000;

  // Scaffold bottom — once at world origin
  ctx.drawImage(_bgL2ScaffBot, 0, cs);

  // Scaffold mid — tile upward until level goal
  for (let wy = _SCAF_START; wy > goalY; wy -= _SCAF_STEP) {
    const sy = wy + cs;
    if (sy > BG_H)       continue; // below viewport
    if (sy + BG_H < 0)   break;    // above viewport — all further tiles too
    ctx.drawImage(_bgL2ScaffMid, 0, sy);
  }
}

// Draws Level 2 rocket launch tower and sea landing area.
// All parts are drawn at parallax factor 1.0 (world-speed, same as L1 building wall).
//
// Layer stacking (bottom to top of draw order):
//   1. sea_launchpad.png  — full-width sea/dock image at world origin
//   2. rocket_bottom.png  — full-width base, overlaid on landing area
//   3. Mid shaft tiles    — _RKT_SPRITES[0/1] alternating, tile upward to level goal
//   4. Rocket top         — _RKT_SPRITES[2], content bottom at levelGoalY
//
// Mid tile start: wy = -_RKT_MID_H so tile's content BOTTOM aligns with
//   the TOP of rocket_bottom.png (image y=0 at screen y=cs).
function _drawL2Elements(ctx, camShift) {
  if (!_bgL2Landing.complete || _bgL2Landing.naturalWidth === 0) return;
  if (!_bgL2Bottom.complete  || _bgL2Bottom.naturalWidth  === 0) return;
  if (!_bgL2MidTop.complete  || _bgL2MidTop.naturalWidth  === 0) return;

  const cs    = Math.round(camShift);
  const goalY = (GameState.levelGoalY !== undefined) ? GameState.levelGoalY : -5000;

  // Scaffolding — drawn first so it sits behind the rocket tower
  _drawL2Scaffolding(ctx, camShift);

  // Sea / launch pad — full-width image drawn once at world-space origin
  ctx.drawImage(_bgL2Landing, 0, cs);

  // Rocket bottom — full-width, overlaid on sea (content at x=184–299, y=0–534)
  ctx.drawImage(_bgL2Bottom, 0, cs);

  // Mid shaft — tile A/B alternating upward from above rocket bottom to level goal
  let tileIdx = 0;
  for (let wy = -_RKT_MID_H; wy > goalY - _RKT_MID_H; wy -= _RKT_MID_H) {
    const sy = wy + cs;
    if (sy > BG_H)            continue; // entirely below viewport
    if (sy + _RKT_MID_H < 0) break;    // entirely above viewport — all further tiles too
    const spr = _RKT_SPRITES[tileIdx % 2];
    ctx.drawImage(_bgL2MidTop, spr.sx, spr.sy, spr.sw, spr.sh,
                               _RKT_DRAW_X, sy, spr.sw, spr.sh);
    tileIdx++;
  }

  // Rocket top — caps the shaft; snap bottom to the last mid tile's top edge to
  // eliminate overlap. lastTileWy = nearest multiple of _RKT_MID_H at or below goalY.
  const topSpr     = _RKT_SPRITES[2];
  const lastTileWy = -(Math.ceil(-goalY / _RKT_MID_H)) * _RKT_MID_H;
  const topScrY    = Math.round(lastTileWy + cs) - topSpr.sh;
  if (topScrY < BG_H && topScrY + topSpr.sh > -BG_H) {
    ctx.drawImage(_bgL2MidTop, topSpr.sx, topSpr.sy, topSpr.sw, topSpr.sh,
                               _RKT_DRAW_X, topScrY, topSpr.sw, topSpr.sh);
  }
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

  const cs    = Math.round(camShift);
  const goalY = (GameState.levelGoalY !== undefined) ? GameState.levelGoalY : -5000;

  // Elevator car at world origin
  ctx.drawImage(_bgL3Elevator, 0, cs);

  // Shaft bottom — shifted up by 268px so its bottom aligns with the elevator
  // ceiling (Elevator.png row 268 = world y 268), eliminating the dark gap.
  // cs + 268 - BG_H = cs - 372
  ctx.drawImage(_bgL3ShaftBot, 0, cs + 268 - BG_H);

  // Mid tiles — start at wy=−1012 (= −(BG_H*2 − 268)) so the first tile's
  // bottom (world y −372) connects to ShaftBot's top — no gap after B1 shift.
  let tileIdx = 0;
  for (let wy = -(BG_H * 2 - 268); wy > goalY - BG_H; wy -= BG_H) {
    const sy = wy + cs;
    if (sy > BG_H)         continue; // below viewport
    if (sy + BG_H < 0)     break;    // above viewport — all further tiles too
    ctx.drawImage(tileIdx % 2 === 0 ? _bgL3ShaftMid1 : _bgL3ShaftMid2, 0, sy);
    tileIdx++;
  }

  // Shaft top — 175 transparent rows at top; align content-top (row 175) to levelGoalY.
  // Row 175 = roof surface, row 180 = golden bar, row 255 = hatch opening.
  ctx.drawImage(_bgL3ShaftTop, 0, Math.round(goalY + cs) - 175);
}

// Draws Level 3 pipe/cable layer (bg-mid layer, 0.90x parallax).
// Slightly slower scroll than shaft walls — gives visual depth.
// Uses same section structure: bottom → tiled middle → top cap.
function _drawL3Mid(ctx, camShift) {
  if (!_bgL3PipesBot.complete || _bgL3PipesBot.naturalWidth === 0) return;
  if (!_bgL3PipesMid.complete || _bgL3PipesMid.naturalWidth === 0) return;
  if (!_bgL3PipesTop.complete || _bgL3PipesTop.naturalWidth === 0) return;

  const FACTOR = 0.90;
  const cs     = Math.round(camShift * FACTOR);
  const goalY  = (GameState.levelGoalY !== undefined) ? GameState.levelGoalY : -5000;

  // Pipes bottom at parallax-adjusted ground position
  ctx.drawImage(_bgL3PipesBot, 0, cs);

  // Pipes middle — tile upward from above bottom section
  for (let wy = -BG_H; wy > goalY * FACTOR - BG_H; wy -= BG_H) {
    const sy = wy + cs;
    if (sy > BG_H)     continue;
    if (sy + BG_H < 0) break;
    ctx.drawImage(_bgL3PipesMid, 0, sy);
  }

  // Pipes top — same 175-row transparent header; align content-top to parallax-adjusted levelGoalY
  ctx.drawImage(_bgL3PipesTop, 0, Math.round((goalY + camShift) * FACTOR) - 175);
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
