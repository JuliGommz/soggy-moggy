// src/water.js — rising flood water: object, physics, collision, rendering
// Depends on: GameState, GamePhase, saveHighScore (game-state.js), player (player.js)

// ---------------------------------------------------------------------------
// SECTION 1 — Constants (tune-friendly, one declaration per line)
// ---------------------------------------------------------------------------
const FLOOD_BASE_SPEED  = 60;    // px/s at level 1 — tune during playtesting
const FLOOD_ACCEL       = 1.5;   // px/s per second — linear speed increase within a level
const FLOOD_LEVEL_SCALE = 0.4;   // each level multiplies base by (1 + (level-1) * scale)
const WAVE_AMPLITUDE    = 10;    // px — sine crest height
const WAVE_FREQUENCY    = 0.04;  // radians per pixel — controls wave width
const WAVE_SPEED        = 2.5;   // radians per second — controls animation pace
const IFRAME_DURATION   = 1.0;   // seconds of invincibility after damage hit
const FLASH_DURATION    = 0.4;   // seconds the red overlay is visible

// ---------------------------------------------------------------------------
// SECTION 2 — water object
// ---------------------------------------------------------------------------
const water = {
  waterY:      700,  // world Y of wave surface — starts 60px below canvas bottom (cameraY=0)
  floodSpeed:  FLOOD_BASE_SPEED,
  waveTime:    0,
  iframeTimer: 0,
  flashTimer:  0,
};

// ---------------------------------------------------------------------------
// SECTION 3 — resetWater(level)
// ---------------------------------------------------------------------------
function resetWater(level) {
  water.waterY      = player.y + 120; // starts 120px below player spawn — just off screen bottom
  water.floodSpeed  = FLOOD_BASE_SPEED * (1 + (level - 1) * FLOOD_LEVEL_SCALE);
  water.waveTime    = 0;
  water.iframeTimer = 0;
  water.flashTimer  = 0;
}

// ---------------------------------------------------------------------------
// SECTION 4 — takeDamage()
// The iframeTimer guard is checked by the caller (updateWater), not here.
// ---------------------------------------------------------------------------
function takeDamage() {
  GameState.lives  -= 1;
  water.iframeTimer = IFRAME_DURATION;
  water.flashTimer  = FLASH_DURATION;
  if (GameState.lives <= 0) {
    saveHighScore(GameState.score);
    GameState.phase = GamePhase.GAMEOVER;
  }
}

// ---------------------------------------------------------------------------
// SECTION 5 — respawnAboveWater()
// Teleports player onto the lowest intact platform still above the wave line.
// Falls back to near camera top if every platform is submerged.
// ---------------------------------------------------------------------------
function respawnAboveWater() {
  const waterLine = water.waterY - WAVE_AMPLITUDE;
  let best = null;
  for (const p of platforms) {
    if (p.state === 'crumbling') continue;        // skip platforms mid-collapse
    if (p.y >= waterLine) continue;               // platform is at or below water surface
    if (best === null || p.y > best.y) best = p;  // keep lowest platform still above water
  }
  if (best) {
    player.x = best.x + Math.floor(best.w / 2) - Math.floor(player.w / 2);
    player.y = best.y - player.h;
  } else {
    player.x = Math.floor(canvas.width / 2) - Math.floor(player.w / 2);
    player.y = GameState.cameraY + 80;
  }
  player.vy = JUMP_VELOCITY;
  player.vx = 0;
}

// ---------------------------------------------------------------------------
// SECTION 6 — updateWater(dt)
// dt is time in seconds (already divided by 1000 in main.js game loop).
// ---------------------------------------------------------------------------
function updateWater(dt) {
  // Tick timers — clamp to 0, never go negative
  water.iframeTimer = Math.max(0, water.iframeTimer - dt);
  water.flashTimer  = Math.max(0, water.flashTimer  - dt);

  // Rise
  water.waterY -= water.floodSpeed * dt;

  // Visibility clamp: water can never fall more than 10px below the screen bottom.
  // Prevents the wave from lagging off-screen when the camera scrolls up faster than the flood rises.
  water.waterY = Math.min(water.waterY, GameState.cameraY + canvas.height + 10);

  // Accelerate
  water.floodSpeed += FLOOD_ACCEL * dt;

  // Animate wave
  water.waveTime += WAVE_SPEED * dt;

  // Collision — playerBottom vs. wave surface (crest = waterY - WAVE_AMPLITUDE)
  const playerBottom = player.y + player.h;
  const collisionY   = water.waterY - WAVE_AMPLITUDE;
  if (playerBottom >= collisionY && water.iframeTimer <= 0) {
    takeDamage();
    if (GameState.phase === GamePhase.PLAYING) {
      respawnAboveWater(); // teleport to nearest safe platform above wave
    }
  }
}

// ---------------------------------------------------------------------------
// SECTION 7 — renderWater(ctx)
// Must be called inside the world-space ctx.save/translate block — ctx is
// already translated by cameraY when this function runs.
// ---------------------------------------------------------------------------
function renderWater(ctx) {
  ctx.fillStyle = 'rgba(30, 144, 255, 0.75)';
  ctx.beginPath();
  ctx.moveTo(0, water.waterY + Math.sin(water.waveTime) * WAVE_AMPLITUDE);
  for (let x = 1; x <= 480; x++) {
    ctx.lineTo(x, water.waterY + Math.sin(x * WAVE_FREQUENCY + water.waveTime) * WAVE_AMPLITUDE);
  }
  ctx.lineTo(480, water.waterY + 2000); // far sentinel — fills water body below wave
  ctx.lineTo(0,   water.waterY + 2000);
  ctx.closePath();
  ctx.fill();
}
