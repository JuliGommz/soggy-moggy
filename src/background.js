// src/background.js
// Parallax background — day→night transition, horizontal cloud drift, stars
// Depends on: GameState (game-state.js)
// Render order: sky (day/night crossfade) → stars → clouds (bright/dark crossfade)
// updateBackground(dt) must be called each frame from main.js update()

// ── Asset loading ─────────────────────────────────────────────────────────────
const _bgL1Day    = new Image(); _bgL1Day.src    = 'PixelArt/backgrounds/shared/sky_day.png';
const _bgL1Night  = new Image(); _bgL1Night.src  = 'PixelArt/backgrounds/shared/sky_night.png';
const _bgL2Bright = new Image(); _bgL2Bright.src = 'PixelArt/backgrounds/shared/clouds_bright.png';
const _bgL2Dark   = new Image(); _bgL2Dark.src   = 'PixelArt/backgrounds/shared/clouds_dark.png';
const _bgStars    = new Image(); _bgStars.src    = 'PixelArt/backgrounds/shared/stars.png';

const BG_H = 640; // tile height — matches canvas height
const BG_W = 480; // tile width  — matches canvas width

const CLOUD_DRIFT_PX_S = 15; // horizontal cloud drift speed (px/sec)

// ── State ─────────────────────────────────────────────────────────────────────
let _bgDriftX = 0; // accumulated horizontal cloud offset (px, wraps at BG_W)

// ── Update ────────────────────────────────────────────────────────────────────
// Call every frame regardless of game phase — animates start screen too.
function updateBackground(dt) {
  _bgDriftX = (_bgDriftX + CLOUD_DRIFT_PX_S * dt) % BG_W;
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

  // Altitude factor: 0 at ground, 1 at level goal
  // levelGoalY is negative (world Y above spawn). Fallback 2000 before first level starts.
  const maxShift = (GameState.levelGoalY < 0) ? -GameState.levelGoalY : 2000;
  const t = Math.min(1, Math.max(0, camShift / maxShift));

  // Sky — day always at full opacity so fillRect never bleeds through
  _drawLayerAlpha(ctx, _bgL1Day,   camShift, 0.30, 0,        1);
  _drawLayerAlpha(ctx, _bgL1Night, camShift, 0.30, 0,        t);

  // Stars — fade in from t=0.3, fully visible at t=0.7; drift at 30% of cloud speed
  // tileH=363: stars content is y=5-367 (363px content rows); gap_top=5 transparent.
  // tileH = content_height ensures tile2's first content pixel follows tile1's last exactly.
  const starAlpha = Math.min(1, Math.max(0, (t - 0.3) / 0.4));
  _drawLayerAlpha(ctx, _bgStars,   camShift, 0.10, _bgDriftX * 0.3, starAlpha, 363);

  // Clouds — horizontal drift + brightness crossfade
  // Clouds_bright: 480x220, content y=16-201 (186px) → tileH=186
  // Clouds_dark:   480x640, content y=0-209  (210px) → tileH=210
  _drawLayerAlpha(ctx, _bgL2Bright, camShift, 0.60, _bgDriftX, 1 - t, 186);
  _drawLayerAlpha(ctx, _bgL2Dark,   camShift, 0.60, _bgDriftX, t,     210);
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
