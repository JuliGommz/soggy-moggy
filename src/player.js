// src/player.js
// Placeholder cat — colored rectangle until Phase 5 sprites
// Depends on: GameState (game-state.js), keys (input.js)

const PLAYER_SPEED  = 300;  // pixels per second — multiplied by dt, not per-frame
const GRAVITY       = 980;  // px/s² — downward acceleration (Y increases downward in Canvas)
const JUMP_VELOCITY = -700; // px/s — upward bounce velocity (negative = upward)

const player = {
  x:     224, // (480 - 32) / 2 — horizontally centered
  y:     528, // 32px above starting platform top at y=560
  w:      32,
  h:      32,
  vx:      0,
  vy:      0,
  prevY: 528, // y position before this frame's physics — used by one-way collision
};

function resetPlayer() {
  player.x     = 224;
  player.y     = 528;
  player.vx    = 0;
  player.vy    = 0;
  player.prevY = 528;
}

function updatePlayer(dt) {
  // ── Vertical physics ────────────────────────────────────────────────────
  player.prevY  = player.y;           // save position BEFORE physics (used by collision)
  player.vy    += GRAVITY * dt;       // gravity: accelerate downward each frame
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
