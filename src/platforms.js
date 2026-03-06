// src/platforms.js
// Platform system — Phase 2: one hardcoded starter platform
// Phase 3 will replace this with procedural generation
// Depends on: player (player.js — must load before this file), JUMP_VELOCITY (player.js)

const PLATFORM_H = 12; // platform height in pixels — consistent across all platforms

// Phase 2: single starter platform. Player spawns 32px above its top (y=560).
const platforms = [
  { x: 190, y: 560, w: 100, h: PLATFORM_H },
];

function resetPlatforms() {
  platforms.length = 0;
  platforms.push({ x: 190, y: 560, w: 100, h: PLATFORM_H });
}

function updatePlatforms(dt) {
  // Phase 2: nothing to update — static platform
  // Phase 3: procedural generation, crumbling platform logic added here
}

// One-way collision: player lands on platform top only.
// Passing through from below and side contact are intentionally ignored.
function checkPlatformCollisions() {
  const prevBottom = player.prevY + player.h; // player feet LAST frame
  const currBottom = player.y    + player.h; // player feet THIS frame

  for (const p of platforms) {
    // Condition 1: horizontal overlap (AABB x-axis)
    const overlapX   = player.x < p.x + p.w && player.x + player.w > p.x;
    // Condition 2: player feet were at or above platform top last frame
    const wasAbove   = prevBottom <= p.y;
    // Condition 3: player feet are at or below platform top this frame
    const nowBelow   = currBottom >= p.y;
    // Condition 4: player is moving downward (vy positive = downward in Canvas)
    const movingDown = player.vy > 0;

    if (overlapX && wasAbove && nowBelow && movingDown) {
      player.y  = p.y - player.h; // snap: land feet exactly on platform top
      player.vy = JUMP_VELOCITY;  // auto-bounce: no jump key needed (satisfies LOOP-01)
    }
  }
}

function renderPlatforms(ctx) {
  ctx.fillStyle = '#27ae60'; // green — platform placeholder (sprite in Phase 5)
  for (const p of platforms) {
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.w, p.h);
  }
}
