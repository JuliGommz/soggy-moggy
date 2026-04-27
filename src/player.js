/**
 * File:        player.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-03-05
 * Updated:     2026-04-26
 *
 * Purpose:     Stuffed-cat player: physics (gravity, variable jump), 7-frame
 *              animation with horizontal flip, and sprite rendering. Hitbox
 *              (32×32) stays separate from drawn sprite (96×128) so collision
 *              math is independent of visual scale.
 * Depends on:  game-state.js (GameState.level / .levelGoalY),
 *              input.js (keys),
 *              dev-flags.js (devFlags.dropHeightPct, devFlags.gravityMul),
 *              hazards.js (hazard.iframeTimer for blink during i-frames),
 *              audio.js (playSound, optional via typeof guard).
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 *
 * Design notes:
 *   - Frame priority: push > bounce sequence > on-ground (idle/walk) > airborne.
 *   - bounceTimer drives the jump-frame sequence (idle → rise → peak).
 *   - pushTimer latches the Z-key animation for 0.25 s even after release.
 *   - jumpLocked prevents auto-rejump while the jump key stays held.
 *   - On L2, the cat is confined to physical walls (elevator interior + shaft
 *     cavity); see the L2 confinement block inside updatePlayer().
 */

// ---------------------------------------------------------------------------
// Tunables — physics
// ---------------------------------------------------------------------------
const PLAYER_SPEED        = 300;   // px/s — multiplied by dt
const GRAVITY             = 980;   // px/s² — downward acceleration
const JUMP_MIN_VELOCITY   = -523;  // px/s — tap height (~138 px, 55% of full jump)
const JUMP_BOOST_ACCEL    = 905;   // px/s² — hold bonus accel; full hold adds ~181 px/s
const JUMP_BOOST_DURATION = 0.20;  // s — boost window length
const JUMP_VELOCITY       = -700;  // px/s — full-power forced bounce (water respawn etc.)

// Frame-timing thresholds for the jump-bounce sprite sequence (seconds).
const _BOUNCE_TIMER_INIT     = 0.24; // bounceTimer set on jump; counts down
const _BOUNCE_THRESH_IDLE    = 0.20; // > → idle frame (just left ground)
const _BOUNCE_THRESH_RISE    = 0.05; // > → rise  frame
const _BOUNCE_PUSH_HIGH      = 0.10; // pushTimer split between rise vs peak
const _PUSH_LATCH_DURATION   = 0.25; // pushTimer set on Z; latches sprite

const _FALL_FAST_VY = 600;           // px/s — switch to rise frame when falling this fast
const _WALK_FRAME_MS = 150;          // ms per walk frame swap (walk_1 ↔ walk_2)
const _IFRAME_BLINK_HZ = 5;          // blink frequency during invincibility

// Spawn positions (screen coordinates).
const _SPAWN_X        = 224;         // (CANVAS_W − player.w) / 2 = (480 − 32) / 2
const _SPAWN_Y_GROUND = 596;         // L1 / L3: 32 px above invisible ground at y=628
const _SPAWN_Y_L2     = 528;         // L2: 32 px above jalousie starter at y=560

// Canvas + L2 confinement.
const _CANVAS_W      = 480;
const _L2_CEILING_Y  = 96;           // feet < this → cat is in the shaft (above elevator)
const _L2_SHAFT_MIN_X = 62;          // opaque-pixel edges of orange tubes in pipes_mid.png
const _L2_SHAFT_MAX_X = 417;

// Paw-zone offsets (Z-key action AABB).
const _PAW_OX = -4;
const _PAW_OY = -28;
const _PAW_OW =  8;
const _PAW_H  = 40;

// ---------------------------------------------------------------------------
// Sprite sheet
// Source: animation_sheet.png — 7 frames left→right at 64 px source height.
// dy values are derived from a PIL alpha-scan: dy = transparent_rows_at_bottom × 2
// (the DH/sh draw scale is 2.0). They align visual feet to the hitbox bottom.
//   idle / rise / walk / pushRise: content y=19–52 → 11 transparent rows → dy = 22
//   pushPeak / peak             : content y=8–55  →  8 transparent rows → dy = 16
// ---------------------------------------------------------------------------
const _catSheet = new Image();
_catSheet.src = 'Visuals/characters/cat/animation_sheet.png';

const _CAT_SPRITES = [
  { sx:   4, sw: 46, dy: 22 }, // 0: idle
  { sx:  69, sw: 50, dy: 22 }, // 1: rise
  { sx: 137, sw: 50, dy: 22 }, // 2: walk_1
  { sx: 206, sw: 50, dy: 22 }, // 3: walk_2
  { sx: 274, sw: 52, dy: 22 }, // 4: push_rise
  { sx: 345, sw: 48, dy: 16 }, // 5: push_peak
  { sx: 411, sw: 48, dy: 16 }, // 6: peak
];
const _CAT_IDX = { idle: 0, rise: 1, walk1: 2, walk2: 3, pushRise: 4, pushPeak: 5, peak: 6 };

const _CAT_SHEET_FRAME_H = 64;       // source frame height in animation_sheet.png
const _CAT_DRAW_W_MUL    = 3;        // drawn width  = player.w × 3 (96 px)
const _CAT_DRAW_H        = 128;      // drawn height = source 64 × 2 — preserves aspect

// ---------------------------------------------------------------------------
// Paw zone — the AABB used by the Z-key action (balloon catch, wasp paw kill).
// Shared so enemies.js and main.js always read the same rectangle.
// ---------------------------------------------------------------------------
function getPawZone() {
  return {
    x: player.x + _PAW_OX,
    y: player.y + _PAW_OY,
    w: player.w + _PAW_OW,
    h: _PAW_H,
  };
}

// ---------------------------------------------------------------------------
// player — single mutable object holding live cat state.
// ---------------------------------------------------------------------------
const player = {
  x:               _SPAWN_X,
  y:               _SPAWN_Y_L2,   // overwritten by resetPlayer() per level
  w:               32,
  h:               32,
  vx:              0,
  vy:              0,
  prevY:           _SPAWN_Y_L2,   // y before this frame's physics — used by one-way collision
  prevOnGround:    false,         // onGround from previous frame — used for land-sound detection
  onGround:        false,         // set by checkPlatformCollisions()
  onPlatform:      null,          // platform object under feet (null if airborne) — used for finish-trigger identity
  flipped:         false,         // true → sprite mirrored to face right
  bounceTimer:     0,             // counts down jump-frame sequence
  pushTimer:       0,             // counts down Z-action sprite latch
  jumpLocked:      false,         // true while jump key held after a jump — prevents auto-rejump
  jumpBoostTimer:  0,             // counts down during held-jump boost window
};

function resetPlayer() {
  const baseSpawnY = (GameState.level === 1 || GameState.level === 3) ? _SPAWN_Y_GROUND : _SPAWN_Y_L2;

  // Dev: DROP HEIGHT % offsets the spawn upward by a fraction of the level height.
  // 0% = ground spawn (default), 100% = near the level goal. Guarded on
  // levelGoalY because resetPlayer can run before resetPlatforms sets it.
  let spawnY = baseSpawnY;
  if (typeof devFlags !== 'undefined' && devFlags.dropHeightPct > 0 && typeof GameState.levelGoalY === 'number') {
    const totalH = baseSpawnY - GameState.levelGoalY;
    spawnY = Math.round(baseSpawnY - totalH * (devFlags.dropHeightPct / 100));
  }
  player.x              = _SPAWN_X;
  player.y              = spawnY;
  player.vx             = 0;
  player.vy             = 0;
  player.prevY          = spawnY;
  player.prevOnGround   = false;
  player.onGround       = false;
  player.onPlatform     = null;
  player.flipped        = false;
  player.bounceTimer    = 0;
  player.pushTimer      = 0;
  player.jumpLocked     = false;
  player.jumpBoostTimer = 0;
}

function updatePlayer(dt) {
  // Vertical physics. devFlags.gravityMul lets the dev panel scale gravity at
  // runtime; defaults to 1.0. dev-flags.js loads first so it's always defined.
  const gMul = (typeof devFlags !== 'undefined' ? devFlags.gravityMul : 1.0);
  player.prevOnGround = player.onGround;          // save for land-sound detection in main.js
  player.prevY        = player.y;                 // save position BEFORE physics (used by collision)
  player.vy          += GRAVITY * gMul * dt;

  // Variable jump: tap = small hop, hold = full jump.
  // jumpLocked prevents auto-rejump while the jump key stays held.
  if (!keys.jump) player.jumpLocked = false;
  if (keys.jump && player.onGround && !player.jumpLocked) {
    player.vy             = JUMP_MIN_VELOCITY;
    player.onGround       = false;
    player.bounceTimer    = _BOUNCE_TIMER_INIT;
    player.jumpBoostTimer = JUMP_BOOST_DURATION;
    player.jumpLocked     = true;
    if (typeof playSound === 'function') playSound('jump');
  }
  // Boost phase: extra upward accel while jump is held and the cat is still rising.
  if (player.jumpBoostTimer > 0) {
    player.jumpBoostTimer -= dt;
    if (keys.jump && player.vy < 0) {
      player.vy -= JUMP_BOOST_ACCEL * dt;
    }
  }

  player.y += player.vy * dt;

  // Horizontal movement. Sprites face left by default; flipped=true mirrors.
  if (keys.left  && !keys.right) player.flipped = false;
  if (keys.right && !keys.left)  player.flipped = true;

  player.vx = 0;
  if (keys.left)  player.vx = -PLAYER_SPEED;
  if (keys.right) player.vx =  PLAYER_SPEED;

  player.x += player.vx * dt;

  // L2 confinement — keep the cat inside the elevator interior or the shaft
  // cavity, depending on vertical position. Must run BEFORE the screen-wrap
  // below, so wrap is unreachable on L2.
  //   feet < _L2_CEILING_Y → entire cat above elevator ceiling → shaft rules
  //                          (clamp x to inner cavity [_L2_SHAFT_MIN_X, _L2_SHAFT_MAX_X − player.w])
  //   feet ≥ _L2_CEILING_Y → cat is in the elevator interior → elevator rules
  //                          (clamp x to canvas edges [0, _CANVAS_W − player.w])
  if (GameState.level === 2) {
    const inShaft = (player.y + player.h) < _L2_CEILING_Y;
    const minX    = inShaft ? _L2_SHAFT_MIN_X : 0;
    const maxX    = inShaft ? _L2_SHAFT_MAX_X : _CANVAS_W;
    if (player.x < minX)            { player.x = minX;            if (player.vx < 0) player.vx = 0; }
    if (player.x + player.w > maxX) { player.x = maxX - player.w; if (player.vx > 0) player.vx = 0; }
  }

  // Push key (Z): latch pushTimer so the sprite holds for _PUSH_LATCH_DURATION.
  if (keys.push && player.pushTimer <= 0) player.pushTimer = _PUSH_LATCH_DURATION;
  if (player.pushTimer > 0)               player.pushTimer -= dt;

  // Count down the bounce-flash window.
  if (player.bounceTimer > 0) player.bounceTimer -= dt;

  // Screen wrap: exit right → appear left, exit left → appear right (L1 / L3 only).
  if (player.x + player.w < 0) player.x = _CANVAS_W;
  if (player.x > _CANVAS_W)    player.x = -player.w;
}

function renderPlayer(ctx) {
  // Blink during invincibility frames at _IFRAME_BLINK_HZ; starts hidden on the
  // first tick to give clear hit feedback.
  if (hazard.iframeTimer > 0 && Math.floor(hazard.iframeTimer * _IFRAME_BLINK_HZ) % 2 === 1) return;

  // Frame selection — priority: push > bounce sequence > on-ground > airborne.
  let frameIdx;
  if (player.pushTimer > 0) {
    // Z-action: low/mid → push_rise, high → push_peak.
    frameIdx = (player.onGround || player.bounceTimer > _BOUNCE_PUSH_HIGH) ? _CAT_IDX.pushRise : _CAT_IDX.pushPeak;
  } else if (player.onGround) {
    if (player.vx !== 0) {
      // Walk: alternate walk_1 / walk_2 every _WALK_FRAME_MS.
      frameIdx = Math.floor(performance.now() / _WALK_FRAME_MS) % 2 === 0 ? _CAT_IDX.walk1 : _CAT_IDX.walk2;
    } else {
      frameIdx = _CAT_IDX.idle;
    }
  } else if (player.bounceTimer > _BOUNCE_THRESH_IDLE) {
    frameIdx = _CAT_IDX.idle;          // just left the ground (early jump)
  } else if (player.bounceTimer > _BOUNCE_THRESH_RISE) {
    frameIdx = _CAT_IDX.rise;
  } else if (player.vy > _FALL_FAST_VY) {
    frameIdx = _CAT_IDX.rise;          // pre-landing — falling fast
  } else {
    frameIdx = _CAT_IDX.peak;
  }

  // Fallback: red rectangle if the spritesheet hasn't loaded yet.
  if (!_catSheet.complete || _catSheet.naturalWidth === 0) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
    return;
  }

  // Draw with horizontal flip when facing right. Hitbox stays unchanged.
  const DW  = player.w * _CAT_DRAW_W_MUL;
  const DH  = _CAT_DRAW_H;
  const sx  = Math.floor(player.x - (DW - player.w) / 2);
  const spr = _CAT_SPRITES[frameIdx];
  const sy  = Math.floor(player.y - (DH - player.h)) + spr.dy;

  if (player.flipped) {
    ctx.save();
    ctx.translate(sx + DW, sy);
    ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false; // some browsers reset this on save()
    ctx.drawImage(_catSheet, spr.sx, 0, spr.sw, _CAT_SHEET_FRAME_H, 0, 0, DW, DH);
    ctx.restore();
    ctx.imageSmoothingEnabled = false; // re-assert after restore()
  } else {
    ctx.drawImage(_catSheet, spr.sx, 0, spr.sw, _CAT_SHEET_FRAME_H, sx, sy, DW, DH);
  }
}
