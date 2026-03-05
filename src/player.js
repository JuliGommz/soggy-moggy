// src/player.js
// Placeholder cat — colored rectangle until Phase 5 sprites
// Depends on: GameState (game-state.js), keys (input.js)

const PLAYER_SPEED = 300; // pixels per second — multiplied by dt, not per-frame

const player = {
  x:  224, // (480 - 32) / 2 — horizontally centered
  y:  580, // near bottom of 640px canvas
  w:   32,
  h:   32,
  vx:   0,
  vy:   0,
};

function resetPlayer() {
  player.x  = 224;
  player.y  = 580;
  player.vx = 0;
  player.vy = 0;
}

function updatePlayer(dt) {
  // Only runs when phase is PLAYING — main.js guards the call
  player.vx = 0;
  if (keys.left)  player.vx = -PLAYER_SPEED;
  if (keys.right) player.vx =  PLAYER_SPEED;

  player.x += player.vx * dt;

  // Screen wrap: exit right → appear left, exit left → appear right
  if (player.x + player.w < 0)    player.x = 480;
  if (player.x > 480)             player.x = -player.w;
}

function renderPlayer(ctx) {
  ctx.fillStyle = '#e74c3c'; // red rectangle — stuffed cat placeholder
  ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
}
