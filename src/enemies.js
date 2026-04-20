/*
====================================================================
* enemies.js - Wasp enemy system: patrol, sting, stomp
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-07
* Version: 1.0
*
* BEHAVIOR OVERVIEW:
*   Wasps patrol horizontally for 4–8 s, then reverse direction.
*   Rigid-body: bounces off canvas edges and visible platforms.
*   Stinger (red point at tail of sprite) → cat contact → -1 life, wasp survives and flies away.
*   Stomp (cat lands on top of wasp) → wasp dies with shrink/fade animation.
*
* DYNAMIC SPAWN COUNTS (must match level order — update if level order changes):
*   Level 1 — Stadt        (city):       5 wasps
*   Level 2 — Aufzugschacht (shaft):     7 wasps
*   Level 3 — Offener See  (lighthouse): 10 wasps
*
* AUTHORSHIP CLASSIFICATION:
* [AI-ASSISTED]
* - State machine design (patrol/dying), frame-accurate stomp check,
*   stinger hitbox flip logic, rigid-body platform bounce
*
* NOTES:
* - spawnEnemies() must be called AFTER resetPlatforms() — needs platforms array to be populated.
* - updateEnemies(dt) must run after checkPlatformCollisions() — reads player.prevY.
* - renderEnemies(ctx) runs inside world-space ctx.save/translate block in main.js.
====================================================================
*/
// Depends on: platforms, PLAYER_START_Y (platforms.js), player, JUMP_VELOCITY, getPawZone (player.js),
//             GameState (game-state.js), takeDamage, hazard (hazards.js), keys (input.js)

// ── Asset ────────────────────────────────────────────────────────────────────
const _waspSheet = new Image();
_waspSheet.src = 'PixelArt/enemy_wasp/wasp_sheet.png';

// ── Sprite constants ─────────────────────────────────────────────────────────
const _WASP_FRAME_W  = 63;      // source frame width  (252px sheet / 4 frames)
const _WASP_FRAME_H  = 44;      // source frame height
const _WASP_FRAMES   = 4;       // total animation frames in sheet
const _WASP_ANIM_FPS = 8;       // animation frames per second

// Draw size matches native sprite (no scale)
const _WASP_DRAW_W = _WASP_FRAME_W; // 63
const _WASP_DRAW_H = _WASP_FRAME_H; // 44

// Stinger hitbox — located at the tail (right side when facing right, left when flipped).
// Offset relative to the drawn sprite top-left corner (before flip transformation).
// Adjusted at runtime based on w.flipX so the stinger always tracks the abdomen tip.
const _STING_OX_RIGHT = 42; // x offset when facing right (stinger at right end)
const _STING_OX_LEFT  =  4; // x offset when facing left  (stinger at left end)
const _STING_OY       = 26; // y offset (lower half of sprite — abdomen area)
const _STING_W        = 14; // stinger hitbox width
const _STING_H        = 14; // stinger hitbox height

// Stomp detection — top N pixels of the wasp sprite count as "stompable surface"
const _STOMP_H = 12;

// Zig-zag vertical oscillation
const _ZIG_AMP  = 20;   // px — vertical swing above and below baseY
const _ZIG_FREQ = 1.5;  // cycles per second

// ── Behavior constants ────────────────────────────────────────────────────────
const _WASP_SPEED_MIN   = 55;  // px/s minimum patrol speed
const _WASP_SPEED_MAX   = 100; // px/s maximum patrol speed
const _PATROL_MIN       = 4;   // seconds before reversing direction
const _PATROL_MAX       = 8;   // seconds before reversing direction
const _WASP_IFRAME      = 1.2; // seconds of stinger-damage invincibility (player-side)
const _DEATH_DURATION   = 0.5; // seconds for the shrink/fade death animation

// ── DYNAMIC SPAWN COUNTS ─────────────────────────────────────────────────────
// Indexed by level. Change ONLY if level definitions change (see header comment).
// L1 city: 10 | L2 shaft: 15 | L3 lighthouse: 20
const _WASP_COUNT = [0, 10, 15, 20]; // index 0 unused (no level 0)

// ── State ─────────────────────────────────────────────────────────────────────
const enemies      = [];  // active enemy objects — cleared on each spawnEnemies() call
let   _waspIframe       = 0;   // shared sting cooldown (player side) — one timer for all wasps
let   _stompJumpWindow  = 0;   // seconds remaining to press jump after a stomp for a full-power bounce
let   _waspsDefeated    = 0;   // count of wasps killed this level (stomp or paw); used for clear bonus

// ── spawnEnemies() ────────────────────────────────────────────────────────────
// Call after resetPlatforms() each level start / restart. Picks random platforms
// scattered through the level so wasps spread across the full climb path.
// resetEnemies() — clears all enemy state without spawning new wasps.
// Called from resetGame(), startNextLevel(), restartLevel() in game-state.js.
function resetEnemies() {
  enemies.length      = 0;
  _waspIframe         = 0;
  _stompJumpWindow    = 0;
  _waspsDefeated      = 0;
}

function spawnEnemies() {
  resetEnemies();

  const count = _WASP_COUNT[GameState.level] || 0;

  // Viable platforms: visible (player can see and interact with them), non-finish,
  // at least 200px above the ground start and not at the very top (keep top clear).
  const viable = platforms.filter(p =>
    !p.invisible &&
    !p.isFinish  &&
    p.y < PLAYER_START_Y - 200 &&
    p.y > GameState.levelGoalY + 200
  );

  // Shuffle viable array so picks are random without replacement
  for (let i = viable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [viable[i], viable[j]] = [viable[j], viable[i]];
  }

  for (let i = 0; i < count; i++) {
    if (i >= viable.length) break; // not enough platforms — spawn what we can

    const p     = viable[i];
    const speed = _WASP_SPEED_MIN + Math.random() * (_WASP_SPEED_MAX - _WASP_SPEED_MIN);
    const dir   = Math.random() < 0.5 ? 1 : -1; // initial patrol direction

    const spawnY = p.y - _WASP_DRAW_H - 6;
    enemies.push({
      x:           p.x + p.w / 2 - _WASP_DRAW_W / 2,
      y:           spawnY,
      baseY:       spawnY,                                   // zig-zag center anchor
      homePlat:    p,                                        // skip this platform in bounce checks
      zigTimer:    Math.random() / _ZIG_FREQ,                // random phase offset
      vx:          speed * dir,
      patrolTimer: _PATROL_MIN + Math.random() * (_PATROL_MAX - _PATROL_MIN),
      animTimer:   Math.random() * (1 / _WASP_ANIM_FPS),
      frame:       Math.floor(Math.random() * _WASP_FRAMES),
      alive:       true,
      dyingTimer:  0,
      flipX:       dir < 0,
    });
  }
}

// ── updateEnemies(dt) ─────────────────────────────────────────────────────────
// Call every PLAYING frame after checkPlatformCollisions() (needs player.prevY).
function updateEnemies(dt) {
  // Stomp-jump window: pressing jump within 150ms of a stomp grants full JUMP_VELOCITY.
  // NOTE: updatePlayer() runs before updateEnemies() each frame (see main.js call order),
  // so the stomp sets player.vy=-280 and opens the window at the end of frame N.
  // The jump override takes effect in frame N+1 when updateEnemies runs again — deliberate 1-frame delay.
  if (_stompJumpWindow > 0) {
    _stompJumpWindow -= dt;
    if (keys.jump) {
      player.vy        = JUMP_VELOCITY;
      _stompJumpWindow = 0;
    }
  }

  _waspIframe = Math.max(0, _waspIframe - dt);

  let _pawUsed = false; // one paw hit per frame; stomp checks still run for all wasps

  for (let i = enemies.length - 1; i >= 0; i--) {
    const w = enemies[i];

    // ── Death animation — count down then remove ──
    if (!w.alive) {
      w.dyingTimer += dt;
      if (w.dyingTimer >= _DEATH_DURATION) {
        enemies.splice(i, 1);
      }
      continue;
    }

    // ── Animation ────────────────────────────────
    w.animTimer += dt;
    if (w.animTimer >= 1 / _WASP_ANIM_FPS) {
      w.animTimer -= 1 / _WASP_ANIM_FPS;
      w.frame = (w.frame + 1) % _WASP_FRAMES;
    }

    // ── Patrol timer — reverse direction on expiry ──
    w.patrolTimer -= dt;
    if (w.patrolTimer <= 0) {
      w.vx          = -w.vx;
      w.flipX       = w.vx < 0;
      w.patrolTimer = _PATROL_MIN + Math.random() * (_PATROL_MAX - _PATROL_MIN);
    }

    // ── Move ──────────────────────────────────────
    w.x        += w.vx * dt;
    w.zigTimer += dt;
    w.y         = w.baseY + Math.sin(w.zigTimer * _ZIG_FREQ * Math.PI * 2) * _ZIG_AMP;

    // ── Rigid body: canvas left/right walls ──────
    if (w.x < 0) {
      w.x           = 0;
      w.vx          = Math.abs(w.vx);
      w.flipX       = false;
      w.patrolTimer = _PATROL_MIN + Math.random() * (_PATROL_MAX - _PATROL_MIN);
    } else if (w.x + _WASP_DRAW_W > 480) {
      w.x           = 480 - _WASP_DRAW_W;
      w.vx          = -Math.abs(w.vx);
      w.flipX       = true;
      w.patrolTimer = _PATROL_MIN + Math.random() * (_PATROL_MAX - _PATROL_MIN);
    }

    // ── Rigid body: bounce off visible platforms ──
    // Skip the wasp's home platform — zig-zag can dip into it and cause false side-bounces.
    for (const p of platforms) {
      if (p.invisible || p === w.homePlat) continue;
      const overlapX = w.x < p.x + p.w && w.x + _WASP_DRAW_W > p.x;
      const overlapY = w.y < p.y + p.h  && w.y + _WASP_DRAW_H  > p.y;
      if (overlapX && overlapY) {
        w.vx    = -w.vx;
        w.flipX = w.vx < 0;
        // Push out of the collider so next frame doesn't re-trigger
        if (w.vx > 0) w.x = p.x + p.w;
        else          w.x = p.x - _WASP_DRAW_W;
        w.patrolTimer = _PATROL_MIN + Math.random() * (_PATROL_MAX - _PATROL_MIN);
        break;
      }
    }

    // ── Stinger contact → player -1 life ─────────
    // Natural sprite (flipX=false, facing right): head is on the left, stinger on the right
    //   → stingOX = _STING_OX_RIGHT (42px — near the right edge of the 63px sprite).
    // Mirrored sprite (flipX=true, facing left): head is on the right, stinger on the left
    //   → stingOX = _STING_OX_LEFT  (4px  — near the left  edge of the 63px sprite).
    if (_waspIframe <= 0 && hazard.iframeTimer <= 0) {
      const stingOX = w.flipX ? _STING_OX_LEFT : _STING_OX_RIGHT;
      const sx      = w.x + stingOX;
      const sy      = w.y + _STING_OY;
      const hitX    = sx < player.x + player.w && sx + _STING_W > player.x;
      const hitY    = sy < player.y + player.h && sy + _STING_H > player.y;
      if (hitX && hitY) {
        takeDamage('wasp');    // -1 life, flash, game-over check; 'wasp' → AYAYAYAY bubble
        _waspIframe = _WASP_IFRAME;
        // Wasp survives — knock it away from the player (rigid-body flee)
        w.vx          = -w.vx * 1.6;  // reverse + speed burst
        w.flipX       = w.vx < 0;
        w.patrolTimer = _PATROL_MIN + Math.random() * (_PATROL_MAX - _PATROL_MIN);
      }
    }

    // ── Paw hit → wasp dies ──────────────────────
    // Z key held while paw AABB overlaps wasp body. Uses getPawZone() (player.js).
    // _pawUsed prevents multiple kills per frame but allows stomp checks to continue.
    if (keys.push && !_pawUsed) {
      const paw     = getPawZone();
      const pawHitX = paw.x < w.x + _WASP_DRAW_W && paw.x + paw.w > w.x;
      const pawHitY = paw.y < w.y + _WASP_DRAW_H  && paw.y + paw.h  > w.y;
      if (pawHitX && pawHitY) {
        w.alive             = false;
        w.dyingTimer        = 0;
        GameState.killBonus += 50;
        _waspsDefeated      += 1;
        _pawUsed            = true;
      }
    }

    // ── Stomp → wasp dies ─────────────────────────
    // One-way check mirrors platform collision: player must have been ABOVE the wasp
    // center last frame and is now descending onto the top surface.
    const waspTopY  = w.y;
    const playerBot = player.y    + player.h;
    const prevBot   = player.prevY + player.h;
    const xOverlap  = player.x < w.x + _WASP_DRAW_W && player.x + player.w > w.x;
    const wasAbove  = prevBot <= waspTopY + _STOMP_H;
    const nowOnTop  = playerBot >= waspTopY && playerBot <= waspTopY + _STOMP_H + 8;
    const falling   = player.vy > 0;
    if (xOverlap && wasAbove && nowOnTop && falling) {
      w.alive             = false;
      w.dyingTimer        = 0;
      player.vy           = -280;        // small upward bounce; press jump within 150ms for full jump
      player.y            = waspTopY - player.h;
      GameState.killBonus += 50;
      _stompJumpWindow    = 0.15;
      _waspsDefeated      += 1;
    }
  }
}

// ── renderEnemies(ctx) ────────────────────────────────────────────────────────
// Called inside world-space ctx.save/translate block in main.js render pass.
function renderEnemies(ctx) {
  const loaded = _waspSheet.complete && _waspSheet.naturalWidth > 0;

  for (const w of enemies) {
    const dx = Math.floor(w.x);
    const dy = Math.floor(w.y);

    // ── Death animation: shrink + fade ───────────
    if (!w.alive) {
      const progress = w.dyingTimer / _DEATH_DURATION; // 0 → 1
      const scale    = 1 - progress;
      const alpha    = 1 - progress;
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(dx + _WASP_DRAW_W / 2, dy + _WASP_DRAW_H / 2);
      ctx.scale(w.flipX ? -scale : scale, scale); // preserve facing direction during death
      if (loaded) {
        ctx.drawImage(
          _waspSheet,
          w.frame * _WASP_FRAME_W, 0, _WASP_FRAME_W, _WASP_FRAME_H,
          -_WASP_DRAW_W / 2, -_WASP_DRAW_H / 2, _WASP_DRAW_W, _WASP_DRAW_H
        );
      } else {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-_WASP_DRAW_W / 2, -_WASP_DRAW_H / 2, _WASP_DRAW_W, _WASP_DRAW_H);
      }
      ctx.restore();
      continue;
    }

    // ── Alive: draw with horizontal flip if facing left ──
    ctx.save();
    if (w.flipX) {
      // Mirror: translate to right edge, scale x by -1 so origin flips to left edge
      ctx.translate(dx + _WASP_DRAW_W, dy);
      ctx.scale(-1, 1);
      if (loaded) {
        ctx.drawImage(
          _waspSheet,
          w.frame * _WASP_FRAME_W, 0, _WASP_FRAME_W, _WASP_FRAME_H,
          0, 0, _WASP_DRAW_W, _WASP_DRAW_H
        );
      } else {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(0, 0, _WASP_DRAW_W, _WASP_DRAW_H);
      }
    } else {
      if (loaded) {
        ctx.drawImage(
          _waspSheet,
          w.frame * _WASP_FRAME_W, 0, _WASP_FRAME_W, _WASP_FRAME_H,
          dx, dy, _WASP_DRAW_W, _WASP_DRAW_H
        );
      } else {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(dx, dy, _WASP_DRAW_W, _WASP_DRAW_H);
      }
    }
    ctx.restore();
  }
}
