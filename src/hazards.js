/*
====================================================================
* water.js - Rising hazard: physics, damage, respawn, level renderers
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-16
* Version: 1.7 - flood foam system across all three sine layers [LOCKED]
*
* HAZARD TYPES (Oberkategorie: hazard) — LEVEL MAPPING (current, post-swap):
*   Smog        — Level 1 (city)      — creeping urban smog (gradient bands + cosine edge)
*   Electricity — Level 2 (shaft)     — crackling electric floor (3 bolt layers)
*   Flood       — Level 3 (lighthouse) — dynamic sea (2 translucent swell layers + stormy surface with foam caps)
*
* Historical note: levels 2 and 3 were swapped during production.
* Earlier versions had Flood on L2 and Electricity on L3; the dispatcher in
* renderHazard() was updated at swap time, the level-specific renderers stayed
* intact — only the L3 flood renderer remained a legacy single-sine wave until
* v1.6 rebuilt it as a proper multi-layer smooth-sine sea (see version history).
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - respawnAboveWater() algorithm: scans platforms for the lowest intact
*   platform still above the hazard line, falls back to camera top
* - iframeTimer + flashTimer pattern: prevents unfair double-hits
*   while providing clear visual damage feedback to the player
* - Visibility clamp: hazard.y can never lag more than 10px off screen
*   bottom when camera scrolls faster than the hazard rises
* - renderSmog: layered gradient bands + cosine billowing edge (Level 1)
* - renderElectricity: 3-layer bolt system (back/mid/front) with independent
*   frequencies, anchor counts, pulsing alpha (Level 2)
* - renderFlood: 2 translucent smooth-sine swell layers + stormy top surface
*   (compound sine, depth gradient, foam caps at crests) — Level 3
* - _buildLayeredEdge() helper: per-pixel interpolated edge table used by
*   renderElectricity (flood uses direct per-pixel sines instead)
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
* - v1.5: Header sync with current level mapping (Smog=L1, Electricity=L2,
*         Flood=L3). Renamed _buildElecEdge → _buildLayeredEdge.
*         Initial flood rebuild copied the electricity anchor/glow pattern —
*         looked like blue lightning, not water. Reverted in v1.6.
* - v1.6: renderFlood rewritten as smooth-sine sea: 2 translucent swell
*         layers + compound-sine stormy surface with depth gradient and
*         foam caps. No anchor interpolation, no pulsing alpha, no glow.
*         Tuning source: docs/previews/water_variants_preview.html Variant E.
* - v1.7: Foam system across all three sine layers (Layer 1 navy swell,
*         Layer 2 whitish band, Surface compound). Three independent phase
*         speeds (0.8 / 1.3 / compound) keep 1–2 foam elements on screen
*         at all times — never fully intermittent. Draw-order places each
*         foam pass before its covering layer for depth-read.
*         [LOCKED 2026-04-24 — do not re-tune without Julian's explicit
*         approval. Final balance approved after presence iteration.]
====================================================================
*/
// Depends on: GameState, GamePhase, saveHighScore (game-state.js), player (player.js)

// ---------------------------------------------------------------------------
// SECTION 1 — Constants (tune-friendly, one declaration per line)
//
// HAZARD_* — shared across all hazard types (Smog, Electricity, Flood)
// FLOOD_WAVE_SPEED — global animation pace; drives hazard.time for all renderers
// ---------------------------------------------------------------------------

// Shared physics
const HAZARD_BASE_SPEED        = 60;    // px/s at level 1 — tune during playtesting
const HAZARD_ACCEL             = 1.5;   // px/s per second — linear speed increase within a level
const HAZARD_LEVEL_SCALE       = 0.4;   // each level multiplies base by (1 + (level-1) * scale)
const HAZARD_COLLISION_MARGIN  = 10;    // px above hazard.y where player contact is detected
const IFRAME_DURATION          = 1.0;   // seconds of invincibility after damage hit
const FLASH_DURATION           = 0.4;   // seconds the red overlay is visible

// Animation master clock — advances hazard.time in updateHazard.
// All level renderers (smog / electricity / flood) derive their oscillation phase from hazard.time.
const FLOOD_WAVE_SPEED = 2.5;  // radians per second — name kept for backward compatibility

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
  // Start far enough below the camera that the upward-spiking electricity bolts /
  // smog plume / wave crests are NOT visible at level start. Electricity layer 3
  // gradient starts at baseY-30 and sine displacement reaches baseY-46 — so we
  // need at least ~60 px of hidden slack below the screen bottom.
  // player.y spawn = 528, canvas = 640, cameraY = 0 → screen bottom at world-y 640.
  // player.y + 200 = 728 → 88 px below screen → top of electricity ≈ y 678, safely hidden.
  hazard.y           = player.y + 200;
  hazard.speed       = HAZARD_BASE_SPEED * (1 + (level - 1) * HAZARD_LEVEL_SCALE);
  hazard.speed      *= DIFFICULTY[GameState.difficulty].hazardMul;
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
  // Dev cheats: GOD MODE absorbs the hit entirely; INFINITE LIVES skips the
  // life decrement but still triggers iframe/flash so the visual feedback
  // remains useful for debugging.
  const _god = (typeof devFlags !== 'undefined' && devFlags.godMode);
  const _inf = (typeof devFlags !== 'undefined' && devFlags.infiniteLives);
  if (_god) return;
  if (!_inf) GameState.lives -= 1;
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

  // Visibility clamp: hazard can never fall more than 100px below the screen bottom.
  // Prevents the surface from lagging off-screen when the camera scrolls up faster
  // than the hazard rises. The +100 slack (was +10) lets the level-start offset of
  // 200px below player spawn survive the first tick without being yanked up into
  // view — the electricity bolts must stay fully hidden until the hazard rises in.
  hazard.y = Math.min(hazard.y, GameState.cameraY + canvas.height + 100);

  // Top cap: applied AFTER visibility clamp so it always takes final precedence.
  // L1 smog stops near the level top (22px below levelGoalY) — matches red line in building.
  // Other levels use the wider 300px safety margin.
  if (GameState.levelGoalY !== undefined) {
    const capOffset = GameState.level === 1 ? 22
                    : GameState.level === 2 ? 140
                    : 4623;  // L3: clamp at world-y 615 (~49 px below LH-G), flood stops at lighthouse base
    if (hazard.y < GameState.levelGoalY + capOffset) {
      hazard.y = GameState.levelGoalY + capOffset;
    }
  }

  // Accelerate
  hazard.speed += HAZARD_ACCEL * dt;

  // Advance animation timer
  hazard.time += FLOOD_WAVE_SPEED * dt;

  // Collision — playerBottom vs. hazard surface (margin = HAZARD_COLLISION_MARGIN)
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
// SECTION 8 — renderFlood(ctx)  [Level 3 — open sea / lighthouse]
// ===========================================================================
// LOCKED 2026-04-24 — DO NOT CHANGE without Julian's explicit approval.
// ===========================================================================
// Two translucent swell layers (smooth per-pixel sines) + stormy top surface
// with compound sine, depth gradient and foam caps on crests. Foam on all
// three layers with independent phase speeds keeps 1–2 elements visible
// at all times (never fully intermittent).
//
// Water is fundamentally different from electricity: smooth curves (no
// anchor-based linear interpolation), no pulsing alpha, no hot gradients,
// no glow passes. Depth comes from alpha-stacking translucent layers.
//
// Layer 1 (deep swell):  slow wide sine (speed 0.8), navy, 0.65 alpha
//                        → medium foam dashes (10±2 px, width 2)
// Layer 2 (mid swell):   medium sine (speed 1.3), whitish, 0.55 alpha
//                        → short foam dashes (7±2 px, width 2)
// Surface (stormy top):  compound sine + depth gradient (0.40/0.28 alpha)
//                        → long foam caps (18±4 px, width 3) on crests
//
// Reference/tuning source: docs/previews/water_variants_preview.html → Variant E
// ---------------------------------------------------------------------------

function renderFlood(ctx) {
  const baseY = hazard.y;
  const W     = 480;
  // Preview uses real seconds for t. hazard.time advances at FLOOD_WAVE_SPEED
  // radians/sec, so divide back out to keep the preview's speed values 1:1.
  const t = hazard.time / FLOOD_WAVE_SPEED;
  const farSentinelY = baseY + 2000;

  // --- Layer 1 — deep swell: darkest blue (navy), slow wide undertow ---
  const w1 = { amp: 18, freq: 0.008, speed: 0.8, off: 34, color: 'rgba(10, 40, 90, 0.65)' };
  ctx.fillStyle = w1.color;
  ctx.beginPath();
  ctx.moveTo(0, baseY + w1.off + Math.sin(t * w1.speed) * w1.amp);
  for (let x = 1; x <= W; x++) {
    ctx.lineTo(x, baseY + w1.off + Math.sin(x * w1.freq + t * w1.speed) * w1.amp);
  }
  ctx.lineTo(W, farSentinelY);
  ctx.lineTo(0, farSentinelY);
  ctx.closePath();
  ctx.fill();

  // Layer 1 foam — short medium dashes on the slow navy swell crests.
  // Drawn before Layer 2 so whitish band partially covers it → depth read.
  // Slow speed (0.8) + wide period means these crests shift independently
  // from Layer 2 and the surface, keeping at least one foam element visible.
  ctx.strokeStyle = 'rgba(240, 250, 255, 0.85)';
  ctx.lineWidth   = 2;
  const l1Y = (x) => baseY + w1.off + Math.sin(x * w1.freq + t * w1.speed) * w1.amp;
  for (let x = 14; x < W; x += 22) {
    const yc = l1Y(x);
    const yL = l1Y(x - 10);
    const yR = l1Y(x + 10);
    if (yc < yL && yc < yR) {
      const foamLen = 10 + Math.sin(t * 2.1 + x * 0.11) * 2;
      ctx.beginPath();
      ctx.moveTo(x - foamLen / 2, yc);
      ctx.lineTo(x + foamLen / 2, yc);
      ctx.stroke();
    }
  }

  // --- Layer 2 — mid swell: whitish reflection band ---
  // Not a colored blue layer — reads as a light band catching surface sheen.
  // Alpha boosted (0.32 → 0.55) so the white isn't drowned by the surface
  // gradient painted on top.
  const w2 = { amp: 12, freq: 0.018, speed: 1.3, off: 14, color: 'rgba(225, 235, 248, 0.55)' };
  ctx.fillStyle = w2.color;
  ctx.beginPath();
  ctx.moveTo(0, baseY + w2.off + Math.sin(t * w2.speed) * w2.amp);
  for (let x = 1; x <= W; x++) {
    ctx.lineTo(x, baseY + w2.off + Math.sin(x * w2.freq + t * w2.speed) * w2.amp);
  }
  ctx.lineTo(W, farSentinelY);
  ctx.lineTo(0, farSentinelY);
  ctx.closePath();
  ctx.fill();

  // Layer 2 foam — shortest dashes on the whitish band crests.
  // Phase offset from L1 (speed 1.3 vs 0.8) keeps some crests foaming when
  // Layer 1 is in trough — continuous coverage across frames.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.80)';
  ctx.lineWidth   = 2;
  const l2Y = (x) => baseY + w2.off + Math.sin(x * w2.freq + t * w2.speed) * w2.amp;
  for (let x = 10; x < W; x += 16) {
    const yc = l2Y(x);
    const yL = l2Y(x - 8);
    const yR = l2Y(x + 8);
    if (yc < yL && yc < yR) {
      const foamLen = 7 + Math.sin(t * 2.7 + x * 0.17) * 2;
      ctx.beginPath();
      ctx.moveTo(x - foamLen / 2, yc);
      ctx.lineTo(x + foamLen / 2, yc);
      ctx.stroke();
    }
  }

  // --- Surface — compound sine, depth gradient, foam caps ---
  const surf = (x) => baseY
    + Math.sin(x * 0.012 + t * 1.1) * 14
    + Math.sin(x * 0.028 + t * 1.8) *  6;

  // Depth gradient: bright sky-blue range, alpha kept low so Layer 2 (whitish
  // band) and Layer 1 (dark navy) remain visible through it. Earlier alpha
  // values (0.78 / 0.55) made the surface the dominant visual and hid the
  // other layers + washed out the foam caps.
  const grad = ctx.createLinearGradient(0, baseY - 20, 0, baseY + 320);
  grad.addColorStop(0, 'rgba(115, 190, 230, 0.40)');  // bright sky blue top
  grad.addColorStop(1, 'rgba(55,  130, 195, 0.28)');  // mid sky blue — Layer 1 reads through
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, surf(0));
  for (let x = 1; x <= W; x++) ctx.lineTo(x, surf(x));
  ctx.lineTo(W, farSentinelY);
  ctx.lineTo(0, farSentinelY);
  ctx.closePath();
  ctx.fill();

  // Surface line — subtle edge definition
  ctx.strokeStyle = 'rgba(200, 230, 245, 0.45)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, surf(0));
  for (let x = 1; x <= W; x++) ctx.lineTo(x, surf(x));
  ctx.stroke();

  // Foam caps at wave crests (local minima in surf(x)).
  // Presence boosted: thicker (2 → 3), longer (12 → 18), tighter spacing
  // (14 → 10), lower threshold (baseY-6 → baseY-3) so more crests qualify.
  ctx.strokeStyle = 'rgba(245, 252, 255, 0.95)';
  ctx.lineWidth   = 3;
  for (let x = 16; x < W; x += 10) {
    const y  = surf(x);
    const yL = surf(x - 6);
    const yR = surf(x + 6);
    if (y < yL && y < yR && y < baseY - 3) {
      const foamLen = 18 + Math.sin(t * 3 + x * 0.1) * 4;
      ctx.beginPath();
      ctx.moveTo(x - foamLen / 2, y);
      ctx.lineTo(x + foamLen / 2, y);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
}
// ===========================================================================
// END LOCKED renderFlood — v1.7 2026-04-24
// ===========================================================================

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
    const edge = _buildLayeredEdge(L, baseY, t, step);

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
  const edge3 = _buildLayeredEdge(L3, baseY, t, step3);

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
// Shared between renderElectricity (L2) and renderFlood (L3).
function _buildLayeredEdge(layer, baseY, t, step) {
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
