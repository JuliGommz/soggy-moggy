// src/platforms.js
// Platform system — Phase 3: procedural generation + crumbling state machine
// Depends on: player (player.js — must load before this file), JUMP_VELOCITY (player.js)
//             GameState (game-state.js — must load before this file)

// ── Platform sprite sheet ─────────────────────────────────────────────────────
// jalousie_sheet.png: 3 cols (A=left cap, B=middle, C=right cap) × 7 rows
// Coordinates measured via PIL alpha-scan on the PNG (480×640, RGBA):
//   Col A left cap:  sx=57,  w=29px  (x=57 to x=85,  non-transparent run)
//   Col B middle:    sx=93,  w=41px  (x=93 to x=133, tiled to fill gap)
//   Col C right cap: sx=144, w=28px  (x=144 to x=171, non-transparent run)
//   Row height: 17px (Row 7 is 15px but rendered at 17px — no visible issue)
//
// Row Y positions (all 7 jalousie styles):
//   Row 1 (y= 71): dark / shuttered
//   Row 2 (y= 97): hearts pattern
//   Row 3 (y=122): blue stripes
//   Row 4 (y=146): yellow + red text — crumble CRACKED  (warning)
//   Row 5 (y=176): brown slats
//   Row 6 (y=202): green  — used as normal fallback color
//   Row 7 (y=230): red    — crumble CRUMBLING (urgent)
// Normal + crumble-intact platforms pick a random row at generation time.
const _platSheet = new Image();
_platSheet.src = 'PixelArt/platforms/level1_city/jalousie_sheet.png';

// Source region constants (px within the sprite sheet)
const _PS = {
  h:    17,                    // source row height
  capL: { x:  57, w: 29 },    // left  cap
  mid:  { x:  93, w: 41 },    // middle tile (tiled)
  capR: { x: 144, w: 28 },    // right cap
  rows:         [71, 97, 122, 176, 202], // rows for intact platforms (rows 1,2,3,5,6)
                                         // Row 4 (146) + Row 7 (230) reserved for crumble states
  rowCracked:   146,           // Row 4: yellow (crumble cracked  — overrides p.row)
  rowCrumbling: 230,           // Row 7: red    (crumble crumbling — overrides p.row)
  // Fallback solid colors (used while sprite loads)
  colorNormal:    '#5a7a3a',
  colorCracked:   '#c0662a',
  colorCrumbling: '#e8a830',
};

const PLATFORM_H       = 12;   // platform height in pixels — collision hitbox height
const PLATFORM_MIN_W   = 80;   // minimum platform width — must be > capL.w + capR.w (57px)
const PLATFORM_MAX_W   = 130;  // maximum platform width in pixels
const GAP_PX           = 120;  // vertical slot height — DO NOT exceed 200px (jump limit from physics)
const CRUMBLE_CHANCE   = 0.25; // 25% of non-starter platforms are crumbling
const CRUMBLE_DELAY_MS = 500;  // ms between crack and disappear
const CRUMBLE_HOLD_MS  = 300;  // ms player has to react on second landing before platform disappears
const LEVEL_BASE_HEIGHT = 2000; // px for level 1; scales per level
const PLAYER_START_Y   = 528;  // must match resetPlayer() in player.js

// Phase 3: starts empty — generateLevelPlatforms() fills this on each reset
const platforms = [];

function resetPlatforms() {
  generateLevelPlatforms(GameState.level);
}

function generateLevelPlatforms(level) {
  platforms.length = 0;

  const levelHeight = LEVEL_BASE_HEIGHT + (level - 1) * 500;

  // Always start with a fixed starter platform directly under spawn point
  platforms.push({
    x:            190,
    y:            560,
    w:            100,
    h:            PLATFORM_H,
    type:         'normal',
    state:        'intact',
    crumbleTimer: 0,
    row:          _PS.rows[Math.floor(Math.random() * _PS.rows.length)],
  });

  // Store the level goal world Y in GameState so main.js can check and draw it
  GameState.levelGoalY = PLAYER_START_Y - levelHeight;

  // Generate platforms in upward slots from the player start position
  const slotCount = Math.floor(levelHeight / GAP_PX);
  for (let i = 1; i <= slotCount; i++) {
    const worldY = PLAYER_START_Y - i * GAP_PX;
    const w      = PLATFORM_MIN_W + Math.random() * (PLATFORM_MAX_W - PLATFORM_MIN_W);
    const x      = 20 + Math.random() * (480 - w - 40); // 20px margin each side
    const type   = Math.random() < CRUMBLE_CHANCE ? 'crumble' : 'normal';

    platforms.push({
      x:            Math.floor(x),
      y:            Math.floor(worldY),
      w:            Math.floor(w),
      h:            PLATFORM_H,
      type,
      state:        'intact',
      crumbleTimer: 0,
      row:          _PS.rows[Math.floor(Math.random() * _PS.rows.length)],
    });
  }
}

// One-way collision: player lands on platform top only.
// Passing through from below and side contact are intentionally ignored.
function checkPlatformCollisions() {
  player.onGround = false; // reset each frame — set true below if on a platform

  const prevBottom = player.prevY + player.h;
  const currBottom = player.y    + player.h;

  for (const p of platforms) {
    const overlapX   = player.x < p.x + p.w && player.x + player.w > p.x;
    const wasAbove   = prevBottom <= p.y;
    const nowBelow   = currBottom >= p.y;
    const movingDown = player.vy > 0;

    if (overlapX && wasAbove && nowBelow && movingDown) {
      player.y        = p.y - player.h;  // snap to surface
      player.vy       = 0;               // stop falling — wait for manual jump
      player.onGround = true;

      // Crumble state machine: each landing advances the state one step
      if (p.type === 'crumble') {
        if      (p.state === 'intact')  { p.state = 'cracked';   p.crumbleTimer = 0; }
        else if (p.state === 'cracked') { p.state = 'crumbling'; p.crumbleTimer = 0; }
      }
    }
  }
}

function updatePlatforms(dt) {
  for (let i = platforms.length - 1; i >= 0; i--) {
    const p = platforms[i];
    if (p.type === 'crumble') {
      if (p.state === 'cracked') {
        p.crumbleTimer += dt * 1000;
        if (p.crumbleTimer >= CRUMBLE_DELAY_MS) {
          platforms.splice(i, 1);  // auto-disappear if player never lands again
        }
      } else if (p.state === 'crumbling') {
        p.crumbleTimer += dt * 1000;
        if (p.crumbleTimer >= CRUMBLE_HOLD_MS) {
          platforms.splice(i, 1);  // disappears after hold window expires
        }
      }
    }
  }
}

function renderPlatforms(ctx) {
  for (const p of platforms) {
    _renderPlatformSprite(ctx, p);
  }
}

// Builds each platform from 3 sprite parts: left cap + tiled middle + right cap.
// Sprite is drawn at native height (17px), top-aligned to platform.y (collision surface).
// Transparent slat gaps show the canvas/background through — no base fill added.
function _renderPlatformSprite(ctx, p) {
  // Pick base color for this platform state
  let baseColor;
  if (p.type === 'crumble') {
    if      (p.state === 'cracked')   baseColor = _PS.colorCracked;
    else if (p.state === 'crumbling') baseColor = _PS.colorCrumbling;
    else                              baseColor = _PS.colorNormal;
  } else {
    baseColor = _PS.colorNormal;
  }

  const dx = Math.floor(p.x);
  const dy = Math.floor(p.y);

  // Select sprite row based on platform state.
  // Intact (normal or crumble) → p.row (assigned randomly at generation).
  // Cracked / crumbling override to fixed warning/urgent rows.
  let rowY;
  if (p.type === 'crumble' && p.state === 'cracked')   rowY = _PS.rowCracked;
  else if (p.type === 'crumble' && p.state === 'crumbling') rowY = _PS.rowCrumbling;
  else rowY = p.row;

  // Fallback: solid color if sprite not yet loaded
  if (!_platSheet.complete || _platSheet.naturalWidth === 0) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(dx, dy, p.w, _PS.h);
    return;
  }

  // Left cap
  ctx.drawImage(_platSheet, _PS.capL.x, rowY, _PS.capL.w, _PS.h,
                             dx, dy, _PS.capL.w, _PS.h);

  // Right cap
  const capRx = dx + p.w - _PS.capR.w;
  ctx.drawImage(_platSheet, _PS.capR.x, rowY, _PS.capR.w, _PS.h,
                             capRx, dy, _PS.capR.w, _PS.h);

  // Middle tiles — tiled (last tile clipped to remaining space)
  const midStart = dx + _PS.capL.w;
  const midEnd   = dx + p.w - _PS.capR.w;
  let x = midStart;
  while (x < midEnd) {
    const drawW = Math.min(_PS.mid.w, midEnd - x);  // clip last tile
    ctx.drawImage(_platSheet, _PS.mid.x, rowY, drawW, _PS.h,
                               x, dy, drawW, _PS.h);
    x += drawW;
  }
}
