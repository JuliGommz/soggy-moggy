// src/player.js
// Placeholder cat — colored rectangle until Phase 5 sprites
// Depends on: GameState (game-state.js), keys (input.js)

const PLAYER_SPEED  = 300;  // pixels per second — multiplied by dt, not per-frame
const GRAVITY       = 980;  // px/s² — downward acceleration (Y increases downward in Canvas)
const JUMP_VELOCITY = -700; // px/s — upward bounce velocity (negative = upward)
const BOOST_IMPULSE = 300;   // px/s upward impulse applied by mid-air boost (Space while airborne)
const BOOST_CAP_VY  = -808;  // px/s — max upward speed after boost: ~333px height (cap prevents extreme values)

const player = {
  x:     224, // (480 - 32) / 2 — horizontally centered
  y:     528, // 32px above starting platform top at y=560
  w:      32,
  h:      32,
  vx:      0,
  vy:      0,
  prevY:        528,  // y position before this frame's physics — used by one-way collision
  airBoostUsed: false, // true once mid-air boost (Space) fires this jump; reset on landing
};

function resetPlayer() {
  player.x     = 224;
  player.y     = 528;
  player.vx    = 0;
  player.vy    = 0;
  player.prevY        = 528;
  player.airBoostUsed = false;
}

function updatePlayer(dt) {
  // ── Vertical physics ────────────────────────────────────────────────────
  player.prevY  = player.y;           // save position BEFORE physics (used by collision)
  player.vy    += GRAVITY * dt;       // gravity: accelerate downward each frame

  // Mid-air boost: Space while airborne (once per jump — airBoostUsed reset on any landing)
  if (keys.jump && !player.airBoostUsed) {
    player.vy           = Math.max(player.vy - BOOST_IMPULSE, BOOST_CAP_VY);
    player.airBoostUsed = true;
    keys.jump           = false;  // consume key — prevent re-trigger this frame
  }

  player.y     += player.vy * dt;     // apply vertical displacement

  // ── Horizontal movement ──────────────────────────────────────────────────
  player.vx = 0;
  if (keys.left)  player.vx = -PLAYER_SPEED;
  if (keys.right) player.vx =  PLAYER_SPEED;
  player.x += player.vx * dt;

  // Screen wrap: exit right → appear left; exit left → appear right
  if (player.x + player.w < 0)  player.x = 480;
  if (player.x > 480)           player.x = -player.w;
}

function renderPlayer(ctx) {
  ctx.fillStyle = '#e74c3c'; // red rectangle — stuffed cat placeholder
  ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
}
