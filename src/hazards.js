/*
====================================================================
* water.js - Rising hazard: physics, damage, respawn, level renderers
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-16
* Version: 1.4 - 3-layer electricity renderer (independent frequencies + pulsing alpha)
*
* HAZARD TYPES (Oberkategorie: hazard):
*   Flood       — Level 2 — rising water (sine wave)
*   Smog        — Level 1 — creeping urban smog (gradient bands + cosine edge)
*   Electricity — Level 3 — crackling electric floor (inharmonic displacement)
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Sine wave rendering (renderFlood): per-pixel lineTo loop with FLOOD_WAVE_FREQUENCY + FLOOD_WAVE_SPEED
* - respawnAboveWater() algorithm: scans platforms for the lowest intact
*   platform still above the hazard line, falls back to camera top
* - iframeTimer + flashTimer pattern: prevents unfair double-hits
*   while providing clear visual damage feedback to the player
* - Visibility clamp: hazard.y can never lag more than 10px off screen
*   bottom when camera scrolls faster than the hazard rises
* - renderSmog: layered gradient bands + cosine billowing edge (Level 1)
* - renderElectricity: 3-layer bolt system (back/mid/front) with independent
*   frequencies, anchor counts, pulsing alpha, and _buildElecEdge() helper
*
* NOTES:
* - resetHazard() is the generic entry point called from game-state.js
*   on both full reset and level start — dispatch point for level hazards
* - renderHazard() dispatches to level-specific renderer by GameState.level
* - HAZARD_LEVEL_SCALE increases base speed per level — tune during playtesting
*
* VERSION HISTORY:
* - v1.0: Basic rising water, GAMEOVER on contact
* - v1.1: Lives system, iframeTimer, respawnAboveWater(), sine wave rendering
* - v1.2: Rename water → hazard; level-specific renderers for smog + electricity
* - v1.3: Constant taxonomy: shared HAZARD_* vs. level-specific FLOOD_WAVE_*
* - v1.4: 3-layer electricity renderer (back/mid/front bolts, pulsing alpha)
====================================================================
*/
// Depends on: GameState, GamePhase, saveHighScore (game-state.js), player (player.js)

// ---------------------------------------------------------------------------
// SECTION 1 — Constants (tune-friendly, one declaration per line)
//
// HAZARD_* — shared across all hazard types (Flood, Smog, Electricity)
// FLOOD_WAVE_* — exclusive to renderFlood (Level 2 sine wave)
// ---------------------------------------------------------------------------

// Shared physics
const HAZARD_BASE_SPEED        = 60;    // px/s at level 1 — tune during playtesting
const HAZARD_ACCEL             = 1.5;   // px/s per second — linear speed increase within a level
const HAZARD_LEVEL_SCALE       = 0.4;   // each level multiplies base by (1 + (level-1) * scale)
const HAZARD_COLLISION_MARGIN  = 10;    // px above hazard.y where player contact is detected
const IFRAME_DURATION          = 1.0;   // seconds of invincibility after damage hit
const FLASH_DURATION           = 0.4;   // seconds the red overlay is visible

// Flood (Level 2) — sine wave rendering
const FLOOD_WAVE_AMPLITUDE  = 10;    // px — sine crest height
const FLOOD_WAVE_FREQUENCY  = 0.04;  // radians per pixel — controls wave width
const FLOOD_WAVE_SPEED      = 2.5;   // radians per second — controls animation pace

// ---------------------------------------------------------------------------
// SECTION 2 — hazard object
// ---------------------------------------------------------------------------
const hazard = {
  y:           700,  // world Y of hazard surface — starts 60px below canvas bottom (cameraY=0)
  speed:       HAZARD_BASE_SPEED,
  time:        0,
  iframeTimer: 0,
  flashTimer:  0,
  fadeAlpha:   1,    // 1 = fully visible; fades to 0 after finish trigger activates
};

// ---------------------------------------------------------------------------
// SECTION 3 — resetHazard(level)
// Generic entry point called by game-state.js on reset/level-start.
// ---------------------------------------------------------------------------
function resetHazard(level) {
  hazard.y           = player.y + 120; // starts 120px below player spawn — just off screen bottom
  hazard.speed       = HAZARD_BASE_SPEED * (1 + (level - 1) * HAZARD_LEVEL_SCALE);
  hazard.time        = 0;
  hazard.iframeTimer = 0;
  hazard.flashTimer  = 0;
  hazard.fadeAlpha   = 1;
}

// ---------------------------------------------------------------------------
// SECTION 4 — takeDamage(cause)
// cause ∈ { 'hazard' (default), 'wasp' } — routed to showLifeLost() for the
// correct bubble variant. The iframeTimer guard is checked by the caller
// (updateHazard / enemies.js / fall-off-bottom in main.js), not here.
// ---------------------------------------------------------------------------
function takeDamage(cause) {
  GameState.lives   -= 1;
  hazard.iframeTimer = IFRAME_DURATION;
  hazard.flashTimer  = FLASH_DURATION;
  if (GameState.lives <= 0) {
    saveHighScore(GameState.score + GameState.killBonus);
    GameState.phase = GamePhase.GAMEOVER;
    return; // skip life-lost bubble — GAMEOVER screen takes over
  }
  // Non-fatal hit: show life-lost bubble (auto-dismiss, pauses physics for 1.2s)
  if (typeof showLifeLost === 'function') showLifeLost(cause || 'hazard');
}

// ---------------------------------------------------------------------------
// SECTION 5 — respawnAboveWater()
// Teleports player onto the lowest intact platform still above the hazard line.
// Falls back to near camera top if every platform is submerged.
// ---------------------------------------------------------------------------
function respawnAboveWater() {
  const waterLine = hazard.y - HAZARD_COLLISION_MARGIN;
  let best = null;
  for (const p of platforms) {
    if (p.state === 'crumbling') continue;        // skip platforms mid-collapse
    if (p.y >= waterLine) continue;               // platform is at or below hazard surface
    if (best === null || p.y > best.y) best = p;  // keep lowest platform still above hazard
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
// SECTION 6 — updateHazard(dt)
// dt is time in seconds (already divided by 1000 in main.js game loop).
// ---------------------------------------------------------------------------
function updateHazard(dt) {
  // Tick timers — clamp to 0, never go negative
  hazard.iframeTimer = Math.max(0, hazard.iframeTimer - dt);
  hazard.flashTimer  = Math.max(0, hazard.flashTimer  - dt);

  // Rise
  hazard.y -= hazard.speed * dt;

  // Fade out once finish trigger is activated (1.2s to fully disappear)
  if (GameState.finishState === 'activating') {
    hazard.fadeAlpha = Math.max(0, hazard.fadeAlpha - dt / 1.2);
  }

  // Visibility clamp: hazard can never fall more than 10px below the screen bottom.
  // Prevents the surface from lagging off-screen when the camera scrolls up faster than the hazard rises.
  hazard.y = Math.min(hazard.y, GameState.cameraY + canvas.height + 10);

  // Top cap: applied AFTER visibility clamp so it always takes final precedence.
  // L1 smog stops near the level top (22px below levelGoalY) — matches red line in building.
  // Other levels use the wider 300px safety margin.
  if (GameState.levelGoalY !== undefined) {
    const capOffset = (GameState.level === 1 || GameState.level === 2) ? 22 : 0;
    if (hazard.y < GameState.levelGoalY + capOffset) {
      hazard.y = GameState.levelGoalY + capOffset;
    }
  }

  // Accelerate
  hazard.speed += HAZARD_ACCEL * dt;

  // Advance animation timer
  hazard.time += FLOOD_WAVE_SPEED * dt;

  // Collision — playerBottom vs. hazard surface (margin = HAZARD_COLLISION_MARGIN)
  // Skip damage during finish activation — player is celebrating, hazard is fading out
  if (GameState.finishState === 'activating' || GameState.finishState === 'done') return;
  const playerBottom = player.y + player.h;
  const collisionY   = hazard.y - HAZARD_COLLISION_MARGIN;
  if (playerBottom >= collisionY && hazard.iframeTimer <= 0) {
    takeDamage('hazard');
    if (GameState.phase === GamePhase.PLAYING) {
      respawnAboveWater(); // teleport to nearest safe platform above hazard
    }
  }
}

// ---------------------------------------------------------------------------
// SECTION 7 — renderHazard(ctx)  [dispatcher]
// Routes to the level-specific renderer. Must be called inside the world-space
// ctx.save/translate block — ctx is already translated by cameraY.
// ---------------------------------------------------------------------------
function renderHazard(ctx) {
  if (hazard.fadeAlpha <= 0) return;
  if (hazard.fadeAlpha < 1) {
    ctx.save();
    ctx.globalAlpha = hazard.fadeAlpha; // smog + flood: multiplies their rgba alphas automatically
  }
  if      (GameState.level === 1) renderSmog(ctx);
  else if (GameState.level === 2) renderElectricity(ctx); // L2 = shaft (electricity)
  else                            renderFlood(ctx);       // L3 = lighthouse (flood/sea)
  if (hazard.fadeAlpha < 1) ctx.restore();
}

// ---------------------------------------------------------------------------
// SECTION 8 — renderFlood(ctx)  [Level 3 — open sea / lighthouse, default]
// Classic sine wave. Blue water rising from below.
// ---------------------------------------------------------------------------
function renderFlood(ctx) {
  ctx.fillStyle = 'rgba(30, 144, 255, 0.75)';
  ctx.beginPath();
  ctx.moveTo(0, hazard.y + Math.sin(hazard.time) * FLOOD_WAVE_AMPLITUDE);
  for (let x = 1; x <= 480; x++) {
    ctx.lineTo(x, hazard.y + Math.sin(x * FLOOD_WAVE_FREQUENCY + hazard.time) * FLOOD_WAVE_AMPLITUDE);
  }
  ctx.lineTo(480, hazard.y + 2000); // far sentinel — fills body below wave
  ctx.lineTo(0,   hazard.y + 2000);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// SECTION 9 — renderSmog(ctx)  [Level 1 — city / building]
// Oppressive creeping smog: layered gradient bands + cosine billowing top edge.
// No clean wave line — fades upward with a soft diffuse glow pass.
// ---------------------------------------------------------------------------
function renderSmog(ctx) {
  const baseY    = hazard.y;
  const sentinel = baseY + 2000;
  const t        = hazard.time;

  // Bottom band — dense opaque, hazard.y + 60 downward to sentinel
  ctx.fillStyle = 'rgba(60, 55, 40, 0.85)';
  ctx.fillRect(0, baseY + 60, 480, sentinel - (baseY + 60));

  // Mid band — semi-transparent body, hazard.y to hazard.y + 60
  ctx.fillStyle = 'rgba(60, 55, 40, 0.55)';
  ctx.fillRect(0, baseY, 480, 60);

  // Top wisps — linear gradient fading to alpha 0
  const grad = ctx.createLinearGradient(0, baseY - 20, 0, baseY);
  grad.addColorStop(0, 'rgba(70, 65, 45, 0)');
  grad.addColorStop(1, 'rgba(70, 65, 45, 0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, baseY - 20, 480, 20);

  // Cosine bumps at top edge — billowing silhouette (3 inharmonic terms)
  ctx.fillStyle = 'rgba(60, 55, 40, 0.55)';
  ctx.beginPath();
  ctx.moveTo(0, baseY + Math.cos(0 * 0.025 + t * 0.7) * 8 + Math.cos(0 * 0.011 + t * 0.4) * 12 + Math.cos(0 * 0.047 + t * 1.1) * 5);
  for (let x = 1; x <= 480; x++) {
    const bump = Math.cos(x * 0.025 + t * 0.7) * 8
               + Math.cos(x * 0.011 + t * 0.4) * 12
               + Math.cos(x * 0.047 + t * 1.1) * 5;
    ctx.lineTo(x, baseY + bump);
  }
  ctx.lineTo(480, baseY + 60);
  ctx.lineTo(0,   baseY + 60);
  ctx.closePath();
  ctx.fill();

  // Glow pass 1 — wide soft aura
  ctx.strokeStyle = 'rgba(90, 80, 55, 0.18)';
  ctx.lineWidth   = 6;
  ctx.beginPath();
  ctx.moveTo(0, baseY + Math.cos(0 * 0.025 + t * 0.7) * 8 + Math.cos(0 * 0.011 + t * 0.4) * 12 + Math.cos(0 * 0.047 + t * 1.1) * 5);
  for (let x = 1; x <= 480; x++) {
    const bump = Math.cos(x * 0.025 + t * 0.7) * 8
               + Math.cos(x * 0.011 + t * 0.4) * 12
               + Math.cos(x * 0.047 + t * 1.1) * 5;
    ctx.lineTo(x, baseY + bump);
  }
  ctx.stroke();

  // Glow pass 2 — sharp edge line
  ctx.strokeStyle = 'rgba(100, 90, 60, 0.55)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, baseY + Math.cos(0 * 0.025 + t * 0.7) * 8 + Math.cos(0 * 0.011 + t * 0.4) * 12 + Math.cos(0 * 0.047 + t * 1.1) * 5);
  for (let x = 1; x <= 480; x++) {
    const bump = Math.cos(x * 0.025 + t * 0.7) * 8
               + Math.cos(x * 0.011 + t * 0.4) * 12
               + Math.cos(x * 0.047 + t * 1.1) * 5;
    ctx.lineTo(x, baseY + bump);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}

// ---------------------------------------------------------------------------
// SECTION 10 — renderElectricity(ctx)  [Level 3 — elevator shaft]
// Three independent bolt layers at different speeds, displacements, and alphas.
// Each layer: anchor-based edge → linear interpolation → fill/stroke.
// Layer 1 (back):  slow, wide, dark blue, low alpha — deep background crackle
// Layer 2 (mid):   medium speed, medium displacement, electric blue
// Layer 3 (front): fast, tight jagged, white-hot gradient + glow passes
// ---------------------------------------------------------------------------

// Per-layer configuration: [anchors, yOffset, sines[], fillStyle, strokeStyle, lineWidth, alphaPulse]
// sines: array of { tMul, xMul, amp } — summed for displacement at each anchor
const _ELEC_LAYERS = [
  { // Layer 1 — back: slow, wide undulation
    anchors: 4, yOffset: 25,
    sines: [
      { tMul: 3.1,  xMul: 0.019, amp: 30 },
      { tMul: 5.3,  xMul: 0.011, amp: 18 },
    ],
    fill:   'rgba(30, 40, 120, 0.45)',
    stroke: 'rgba(60, 80, 180, 0.25)',
    lineW:  5,
    alphaPulse: { tMul: 1.7, min: 0.25, max: 0.55 },
  },
  { // Layer 2 — mid: medium crackle
    anchors: 8, yOffset: 10,
    sines: [
      { tMul: 6.7,  xMul: 0.027, amp: 20 },
      { tMul: 10.3, xMul: 0.014, amp: 12 },
      { tMul: 4.9,  xMul: 0.041, amp: 8 },
    ],
    fill:   'rgba(60, 100, 255, 0.50)',
    stroke: 'rgba(120, 160, 255, 0.35)',
    lineW:  3,
    alphaPulse: { tMul: 2.9, min: 0.35, max: 0.70 },
  },
  { // Layer 3 — front: fast, tight, hot
    anchors: 6, yOffset: 0,
    sines: [
      { tMul: 9.3,  xMul: 0.031, amp: 22 },
      { tMul: 13.7, xMul: 0.017, amp: 14 },
      { tMul: 7.1,  xMul: 0.053, amp: 10 },
    ],
    fill:   null, // uses gradient instead
    stroke: null, // uses dedicated glow passes
    lineW:  0,
    alphaPulse: null, // always full
  },
];

function renderElectricity(ctx) {
  const baseY = hazard.y;
  const t     = hazard.time;
  const saved = ctx.globalAlpha;

  // --- Layer 1 + 2: back and mid bolts (flat fill + single stroke) ---
  for (let li = 0; li < 2; li++) {
    const L    = _ELEC_LAYERS[li];
    const step = 480 / L.anchors;
    const edge = _buildElecEdge(L, baseY, t, step);

    // Pulsing alpha: oscillates between min and max; scaled by fade factor
    const pulse = L.alphaPulse;
    const alpha = (pulse.min + (pulse.max - pulse.min)
                * (0.5 + 0.5 * Math.sin(t * pulse.tMul))) * hazard.fadeAlpha;
    ctx.globalAlpha = alpha;

    // Fill body below edge
    ctx.fillStyle = L.fill;
    ctx.beginPath();
    ctx.moveTo(0, edge[0]);
    for (let x = 1; x <= 480; x++) ctx.lineTo(x, edge[x]);
    ctx.lineTo(480, baseY + 2000);
    ctx.lineTo(0,   baseY + 2000);
    ctx.closePath();
    ctx.fill();

    // Stroke edge
    ctx.strokeStyle = L.stroke;
    ctx.lineWidth   = L.lineW;
    ctx.beginPath();
    ctx.moveTo(0, edge[0]);
    for (let x = 1; x <= 480; x++) ctx.lineTo(x, edge[x]);
    ctx.stroke();
  }

  ctx.globalAlpha = saved;

  // --- Layer 3: front bolt with gradient fill + two glow passes ---
  const L3   = _ELEC_LAYERS[2];
  const step3 = 480 / L3.anchors;
  const edge3 = _buildElecEdge(L3, baseY, t, step3);

  // Gradient fill: hot white-yellow → electric blue → deep dark
  const grad = ctx.createLinearGradient(0, baseY - 30, 0, baseY + 100);
  grad.addColorStop(0,    'rgba(255, 255, 180, 0.95)');
  grad.addColorStop(0.35, 'rgba(80,  120, 255, 0.85)');
  grad.addColorStop(1,    'rgba(20,  20,  80,  0.95)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, edge3[0]);
  for (let x = 1; x <= 480; x++) ctx.lineTo(x, edge3[x]);
  ctx.lineTo(480, baseY + 2000);
  ctx.lineTo(0,   baseY + 2000);
  ctx.closePath();
  ctx.fill();

  // Glow pass 1 — wide diffuse aura
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.15)';
  ctx.lineWidth   = 9;
  ctx.beginPath();
  ctx.moveTo(0, edge3[0]);
  for (let x = 1; x <= 480; x++) ctx.lineTo(x, edge3[x]);
  ctx.stroke();

  // Glow pass 2 — sharp bright bolt edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, edge3[0]);
  for (let x = 1; x <= 480; x++) ctx.lineTo(x, edge3[x]);
  ctx.stroke();
}

// Builds a per-pixel edge displacement table from a layer config.
// Returns Float32Array[481] with world-Y values for x = 0..480.
function _buildElecEdge(layer, baseY, t, step) {
  const anchors = [];
  for (let i = 0; i <= layer.anchors; i++) {
    const x = i * step;
    let disp = 0;
    for (const s of layer.sines) {
      disp += Math.sin(t * s.tMul + x * s.xMul) * s.amp;
    }
    anchors.push({ x, y: baseY + layer.yOffset + disp });
  }
  const edge = new Float32Array(481);
  for (let x = 0; x <= 480; x++) {
    const seg  = x / step;
    const lo   = Math.floor(seg);
    const hi   = Math.min(lo + 1, layer.anchors);
    const frac = seg - lo;
    edge[x]    = anchors[lo].y * (1 - frac) + anchors[hi].y * frac;
  }
  return edge;
}
