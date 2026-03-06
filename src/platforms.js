// src/platforms.js
// Platform system — Phase 3: procedural generation + crumbling state machine
// Depends on: player (player.js — must load before this file), JUMP_VELOCITY (player.js)
//             GameState (game-state.js — must load before this file)

const PLATFORM_H       = 12;   // platform height in pixels — consistent across all platforms
const PLATFORM_MIN_W   = 60;   // minimum platform width in pixels
const PLATFORM_MAX_W   = 100;  // maximum platform width in pixels
const GAP_PX           = 120;  // vertical slot height — DO NOT exceed 200px (jump limit from physics)
const CRUMBLE_CHANCE   = 0.25; // 25% of non-starter platforms are crumbling
const CRUMBLE_DELAY_MS = 500;  // ms between crack and disappear
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
    });
  }
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

      // Crumble: intact → cracked on first landing. Removal is deferred to updatePlatforms().
      if (p.type === 'crumble' && p.state === 'intact') {
        p.state        = 'cracked';
        p.crumbleTimer = 0;
      }
    }
  }
}

function updatePlatforms(dt) {
  // Advance crumble timers for all cracked platforms (backward loop for safe splice)
  for (let i = platforms.length - 1; i >= 0; i--) {
    const p = platforms[i];
    if (p.type === 'crumble' && p.state === 'cracked') {
      p.crumbleTimer += dt * 1000; // dt is seconds; timer is in ms
      if (p.crumbleTimer >= CRUMBLE_DELAY_MS) {
        platforms.splice(i, 1); // remove gone platform
      }
    }
  }
}

function renderPlatforms(ctx) {
  for (const p of platforms) {
    if (p.type === 'crumble') {
      // Visual distinction: red intact crumble, orange cracked crumble
      ctx.fillStyle = p.state === 'cracked' ? '#e67e22' : '#e74c3c';
    } else {
      ctx.fillStyle = '#27ae60'; // green — normal platform
    }
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.w, p.h);
  }
}
