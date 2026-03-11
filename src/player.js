// src/player.js
// Stuffed cat sprite — 3-frame jump animation (down / middle / high)
// Depends on: GameState (game-state.js), keys (input.js)

// ── Sprite loading ───────────────────────────────────────────────────────────
// Paths relative to index.html (project root)
const _sprIdle      = new Image(); _sprIdle.src      = 'PixelArt/cat/idle.png';
const _sprWalk1     = new Image(); _sprWalk1.src     = 'PixelArt/cat/walk_1.png';
const _sprWalk2     = new Image(); _sprWalk2.src     = 'PixelArt/cat/walk_2.png';
// Per-sprite Y offsets: align each sprite's lowest visible pixel to the hitbox bottom.
// Calculated from PIL alpha-scan: offset = transparent_px_at_bottom × (96/64 scale = 1.5)
const _DY_IDLE      =  6; // idle:      4 transp src px × 1.5
const _DY_WALK      = 20; // walk_1/2: 13 transp src px × 1.5
const _DY_PUSH_RISE = 20; // push_rise: 13 transp src px × 1.5
const _DY_PUSH_PEAK =  4; // push_peak:  3 transp src px × 1.5
const _sprRise      = new Image(); _sprRise.src      = 'PixelArt/cat/rise.png';
const _sprPeak      = new Image(); _sprPeak.src      = 'PixelArt/cat/peak.png';
const _sprPushRise  = new Image(); _sprPushRise.src  = 'PixelArt/cat/push_rise.png';
const _sprPushPeak  = new Image(); _sprPushPeak.src  = 'PixelArt/cat/push_peak.png';

const PLAYER_SPEED  = 300;  // pixels per second — multiplied by dt, not per-frame
const GRAVITY       = 980;  // px/s² — downward acceleration (Y increases downward in Canvas)
const JUMP_VELOCITY = -700; // px/s — upward jump velocity (negative = upward)

const player = {
  x:     224, // (480 - 32) / 2 — horizontally centered
  y:     528, // 32px above starting platform top at y=560
  w:      32,
  h:      32,
  vx:      0,
  vy:      0,
  prevY:       528,   // y position before this frame's physics — used by one-way collision
  onGround:    false, // true when standing on a platform — set by checkPlatformCollisions()
  facingLeft:  false, // last horizontal direction — flips sprite via ctx.scale(-1,1)
  bounceTimer: 0,     // seconds remaining to show jump animation frames after a jump
  pushTimer:   0,     // seconds remaining to show push sprite after Z press
};

function resetPlayer() {
  player.x     = 224;
  player.y     = 528;
  player.vx    = 0;
  player.vy    = 0;
  player.prevY      = 528;
  player.onGround   = false;
  player.facingLeft = false;
  player.bounceTimer  = 0;
  player.pushTimer    = 0;
}

function updatePlayer(dt) {
  // ── Vertical physics ────────────────────────────────────────────────────
  player.prevY  = player.y;           // save position BEFORE physics (used by collision)
  player.vy    += GRAVITY * dt;       // gravity: accelerate downward each frame

  // Manual jump: Space while standing on a platform
  if (keys.jump && player.onGround) {
    player.vy          = JUMP_VELOCITY;
    player.onGround    = false;
    player.bounceTimer = 0.24;  // start jump animation sequence
    keys.jump          = false; // consume key
  }

  player.y     += player.vy * dt;     // apply vertical displacement

  // ── Horizontal movement ──────────────────────────────────────────────────
  // Direction: read directly from keys — instant, no vx derivation lag
  // Only updates on active press; releases preserve last direction (no flip on idle)
  if (keys.left  && !keys.right) player.facingLeft = false;
  if (keys.right && !keys.left)  player.facingLeft = true;

  player.vx = 0;
  if (keys.left)  player.vx = -PLAYER_SPEED;
  if (keys.right) player.vx =  PLAYER_SPEED;
  player.x += player.vx * dt;

  // Push key (Z): latch pushTimer so animation holds for 250ms
  if (keys.push && player.pushTimer <= 0) player.pushTimer = 0.25;
  if (player.pushTimer > 0) player.pushTimer -= dt;

  // Count down bounce flash window
  if (player.bounceTimer > 0) player.bounceTimer -= dt;

  // Screen wrap: exit right → appear left; exit left → appear right
  if (player.x + player.w < 0)  player.x = 480;
  if (player.x > 480)           player.x = -player.w;
}

function renderPlayer(ctx) {
  // Blink during invincibility frames: 5Hz alternation, starts hidden on first tick (hit feedback)
  if (water.iframeTimer > 0 && Math.floor(water.iframeTimer * 5) % 2 === 1) return;

  // ── Frame selection ───────────────────────────────────────────────────────
  // Priority: push > bounce sequence > peak
  //
  // Push (Z held, 250ms window):
  //   bounceTimer > 0.10 = cat still low/mid after bounce → push_rise
  //   else               = cat is high                    → push_peak
  //
  // Bounce sequence (240ms): idle(40ms) → rise(200ms) → peak
  //   >0.20s:  idle      — contact pose (just bounced)
  //   0–0.20s: rise      — ascending stretch
  //   vy > 600 px/s: rise — pre-landing (falling fast)
  //   else:    peak      — peak / neutral airborne
  let frame;
  if (player.pushTimer > 0) {
    frame = (player.onGround || player.bounceTimer > 0.10) ? _sprPushRise : _sprPushPeak;
  } else if (player.onGround) {
    if (player.vx !== 0) {
      frame = Math.floor(performance.now() / 150) % 2 === 0 ? _sprWalk1 : _sprWalk2;
    } else {
      frame = _sprIdle;  // standing still
    }
  } else if (player.bounceTimer > 0.20) {
    frame = _sprIdle;  // just left the ground (first 40ms of jump)
  } else if (player.bounceTimer > 0.05) {
    frame = _sprRise;
  } else if (player.vy > 600) {
    frame = _sprRise; // pre-landing: falling fast
  } else {
    frame = _sprPeak;
  }

  // ── Fallback: draw red rectangle if sprites not yet loaded ───────────────
  if (!frame.complete || frame.naturalWidth === 0) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
    return;
  }

  // ── Draw sprite with direction mirroring ─────────────────────────────────
  // Sprite drawn at 3× hitbox size (96×96), bottom-aligned so feet land on platforms,
  // centered horizontally on the hitbox. Hitbox (32×32) stays unchanged for collision.
  const DW = player.w * 3; // drawn width  96px
  const DH = player.h * 3; // drawn height 96px
  const sx  = Math.floor(player.x - (DW - player.w) / 2); // center horizontally
  let frameDY = 0;
  if      (frame === _sprIdle)                          frameDY = _DY_IDLE;
  else if (frame === _sprWalk1 || frame === _sprWalk2)  frameDY = _DY_WALK;
  else if (frame === _sprPushRise)                      frameDY = _DY_PUSH_RISE;
  else if (frame === _sprPushPeak)                      frameDY = _DY_PUSH_PEAK;
  const sy  = Math.floor(player.y - (DH - player.h)) + frameDY;

  if (player.facingLeft) {
    ctx.save();
    ctx.translate(sx + DW, sy);        // origin at right edge of drawn sprite
    ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false; // re-assert: some browsers reset on save()
    ctx.drawImage(frame, 0, 0, DW, DH);
    ctx.restore();
    ctx.imageSmoothingEnabled = false; // re-assert after restore()
  } else {
    ctx.drawImage(frame, sx, sy, DW, DH);
  }
}
