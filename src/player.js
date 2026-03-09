// src/player.js
// Stuffed cat sprite — 3-frame jump animation (down / middle / high)
// Depends on: GameState (game-state.js), keys (input.js)

// ── Sprite loading ───────────────────────────────────────────────────────────
// Paths relative to index.html (project root)
const _sprDown   = new Image(); _sprDown.src   = 'PixelArt/sprites/cat/cat_jump_down.png';
const _sprMiddle = new Image(); _sprMiddle.src = 'PixelArt/sprites/cat/cat_jump_mid.png';
const _sprHigh   = new Image(); _sprHigh.src   = 'PixelArt/sprites/cat/cat_jump_high.png';

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
  facingLeft:   false, // last horizontal direction — flips sprite via ctx.scale(-1,1)
  bounceTimer:  0,     // seconds remaining to show middle-jump frame after a bounce
};

function resetPlayer() {
  player.x     = 224;
  player.y     = 528;
  player.vx    = 0;
  player.vy    = 0;
  player.prevY        = 528;
  player.airBoostUsed = false;
  player.facingLeft   = false;
  player.bounceTimer  = 0;
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
  // Direction: read directly from keys — instant, no vx derivation lag
  // Only updates on active press; releases preserve last direction (no flip on idle)
  if (keys.left  && !keys.right) player.facingLeft = false;
  if (keys.right && !keys.left)  player.facingLeft = true;

  player.vx = 0;
  if (keys.left)  player.vx = -PLAYER_SPEED;
  if (keys.right) player.vx =  PLAYER_SPEED;
  player.x += player.vx * dt;

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
  // Bounce sequence (240ms): Down(40ms) → Middle(200ms) → High
  // Pre-landing: velocity-based — sprMiddle when falling fast (vy > 350px/s)
  //   >0.20s (40ms):  down-jump   — contact pose (first frame after bounce)
  //   0–0.20s (200ms): middle-jump — launch stretch (ascending)
  //   vy > 350 px/s:  middle-jump — pre-landing approach (airborne, falling fast)
  //   else:           high-jump   — peak/neutral airborne
  let frame;
  if      (player.bounceTimer > 0.20) frame = _sprDown;
  else if (player.bounceTimer > 0.05) frame = _sprMiddle;
  else if (player.vy > 600)           frame = _sprMiddle; // pre-landing: falling fast
  else                                frame = _sprHigh;

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
  const sx = Math.floor(player.x - (DW - player.w) / 2); // center horizontally
  const sy = Math.floor(player.y - (DH - player.h));     // bottom-align to hitbox base

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
