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
  const prevBottom = player.prevY + player.h;
  const currBottom = player.y    + player.h;

  for (const p of platforms) {
    const overlapX   = player.x < p.x + p.w && player.x + player.w > p.x;
    const wasAbove   = prevBottom <= p.y;
    const nowBelow   = currBottom >= p.y;
    const movingDown = player.vy > 0;

    if (overlapX && wasAbove && nowBelow && movingDown) {
      player.y            = p.y - player.h;  // snap to surface
      player.vy           = JUMP_VELOCITY;   // always auto-bounce — consistent feel
      player.airBoostUsed = false;           // reset mid-air boost for the next jump
      player.bounceTimer  = 0.24;            // 240ms total: 40ms down + 200ms middle-out (pre-landing via vy threshold)

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
    if (p.type === 'crumble') {
      if (p.state === 'intact')         ctx.fillStyle = '#5a7a3a'; // PLAT-1 normal green — intact crumble reads same as normal until cracked
      else if (p.state === 'cracked')   ctx.fillStyle = '#c0662a'; // PLAT-3 earthy warning orange
      else if (p.state === 'crumbling') ctx.fillStyle = '#e8a830'; // PLAT-4 amber — urgent
    } else {
      ctx.fillStyle = '#5a7a3a'; // PLAT-1 normal platform body
    }
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.w, p.h);
  }
}
