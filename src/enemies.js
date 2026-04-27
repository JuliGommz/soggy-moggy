/**
 * File:        enemies.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-04-07
 * Updated:     2026-04-26
 *
 * Purpose:     Wasp enemy system: spawning, patrol behavior, sting (damage),
 *              stomp (kill from above), paw kill (Z key), and death animation.
 *              Also exposes getNearestWaspDist() for the audio buzz layer.
 * Depends on:  platforms (platforms.js), PLAYER_START_Y (platforms.js),
 *              player + JUMP_VELOCITY + getPawZone (player.js),
 *              GameState + DIFFICULTY (game-state.js),
 *              takeDamage + hazard (hazards.js), keys (input.js),
 *              playSound (audio.js, optional via typeof guard).
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 *
 * Behavior summary:
 *   - Wasps patrol horizontally for 4–8 s, then reverse direction.
 *   - Rigid body: bounces off canvas edges and visible platforms.
 *   - Stinger contact (red point at the abdomen)  → cat takes damage; wasp survives and flees.
 *   - Stomp (cat lands on top)                    → wasp dies with shrink + fade.
 *   - Paw hit (Z key, paw AABB overlaps wasp)     → wasp dies (one paw kill per frame).
 *
 * Per-level wasp counts (base, before difficulty multiplier DIFFICULTY[*].waspMul):
 *   Level 1 — City                  →  8 wasps
 *   Level 2 — Elevator Shaft        → 12 wasps
 *   Level 3 — Open Sea / Lighthouse → 16 wasps
 *
 * Call order (from main.js):
 *   spawnEnemies()  must run AFTER  resetPlatforms() — needs the platforms array
 *   updateEnemies() must run AFTER  checkPlatformCollisions() — reads player.prevY
 *   renderEnemies() runs INSIDE the world-space ctx.save/translate block
 */

// ---------------------------------------------------------------------------
// Tunables — gameplay
// _CANVAS_W is declared in player.js (loads first) and used here as a global.
// ---------------------------------------------------------------------------
const _WASP_SPEED_MIN_PX_S = 55;  // minimum patrol speed
const _WASP_SPEED_MAX_PX_S = 100; // maximum patrol speed
const _PATROL_MIN_SEC      = 4;   // seconds before reversing direction (lower bound)
const _PATROL_MAX_SEC      = 8;   // seconds before reversing direction (upper bound)
const _WASP_IFRAME_SEC     = 1.2; // player invincibility window after a sting hit
const _DEATH_DURATION_SEC  = 0.5; // shrink + fade death animation length

const _STOMP_BOUNCE_VY     = -280;  // upward velocity granted on a stomp kill
const _STOMP_JUMP_WINDOW_S = 0.15;  // press jump within this window after a stomp for full JUMP_VELOCITY
const _STOMP_LAND_TOL_PX   = 8;     // extra leniency when checking if the cat is on the wasp's top surface
const _WASP_FLEE_SPEED_MUL = 1.6;   // post-sting flee burst multiplier

const _SPAWN_TOP_BUFFER_PX    = 200; // keep wasps clear of the level's top edge
const _SPAWN_BOTTOM_BUFFER_PX = 200; // keep wasps clear of the spawn area
const _SPAWN_Y_OFFSET_PX      = 6;   // wasp draws this many px above the platform top

const _KILL_BONUS_POINTS = 50;       // points per defeated wasp (stomp or paw)

// ---------------------------------------------------------------------------
// Tunables — sprite + animation
// ---------------------------------------------------------------------------
const _WASP_FRAME_W  = 63;        // source frame width  (252 px sheet / 4 frames)
const _WASP_FRAME_H  = 44;        // source frame height
const _WASP_FRAMES   = 4;         // total animation frames in the sheet
const _WASP_ANIM_FPS = 8;         // animation frames per second

// Draw size matches native sprite (1:1, no scaling).
const _WASP_DRAW_W = _WASP_FRAME_W;
const _WASP_DRAW_H = _WASP_FRAME_H;

// Stinger hitbox — located at the tail of the abdomen. Tracks the abdomen tip
// regardless of facing direction (flipX swaps which X offset is used).
const _STING_OX_RIGHT = 42;       // x offset when facing right (stinger near right edge)
const _STING_OX_LEFT  =  4;       // x offset when facing left  (stinger near left  edge)
const _STING_OY       = 26;       // y offset (lower half — abdomen area)
const _STING_W        = 14;
const _STING_H        = 14;

// Stomp surface — the top N px of the wasp sprite count as stompable.
const _STOMP_H = 12;

// Vertical zig-zag oscillation around baseY.
const _ZIG_AMP_PX  = 20;          // peak vertical swing
const _ZIG_FREQ_HZ = 1.5;         // cycles per second

// ---------------------------------------------------------------------------
// Per-level wasp counts (base, before DIFFICULTY[*].waspMul).
// Index 0 is unused (levels start at 1). LOCKED — production values.
// ---------------------------------------------------------------------------
const _WASP_COUNT = [0, 8, 12, 16];

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------
const _waspSheet = new Image();
_waspSheet.src = 'Visuals/characters/wasp/wasp_sheet.png';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const enemies         = [];  // active enemy objects — cleared on each spawnEnemies()
let   _waspIframe     = 0;   // shared player-side sting cooldown (one timer for all wasps)
let   _stompJumpWindow = 0;  // seconds remaining to press jump after a stomp for full power
let   _waspsDefeated  = 0;   // count of wasps killed this level (for the clear bonus)

// ---------------------------------------------------------------------------
// resetEnemies() — clears all enemy state without spawning.
// Called from resetGame(), startNextLevel(), restartLevel() in game-state.js.
// ---------------------------------------------------------------------------
function resetEnemies() {
  enemies.length    = 0;
  _waspIframe       = 0;
  _stompJumpWindow  = 0;
  _waspsDefeated    = 0;
}

// ---------------------------------------------------------------------------
// spawnEnemies() — picks viable platforms and seats one wasp on each.
// Call AFTER resetPlatforms() so the platforms array is populated.
// ---------------------------------------------------------------------------
function spawnEnemies() {
  resetEnemies();

  const baseCount = _WASP_COUNT[GameState.level] || 0;
  const count     = Math.max(0, Math.floor(baseCount * DIFFICULTY[GameState.difficulty].waspMul));

  // Viable platforms: visible, not the finish, far enough from both top and bottom.
  const viable = platforms.filter(p =>
    !p.invisible &&
    !p.isFinish  &&
    p.y < PLAYER_START_Y - _SPAWN_BOTTOM_BUFFER_PX &&
    p.y > GameState.levelGoalY + _SPAWN_TOP_BUFFER_PX
  );

  // Fisher-Yates shuffle so picks are random without replacement.
  for (let i = viable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [viable[i], viable[j]] = [viable[j], viable[i]];
  }

  for (let i = 0; i < count; i++) {
    if (i >= viable.length) break; // not enough platforms — spawn what we can

    const p     = viable[i];
    const speed = _WASP_SPEED_MIN_PX_S + Math.random() * (_WASP_SPEED_MAX_PX_S - _WASP_SPEED_MIN_PX_S);
    const dir   = Math.random() < 0.5 ? 1 : -1; // initial patrol direction

    const spawnY = p.y - _WASP_DRAW_H - _SPAWN_Y_OFFSET_PX;
    enemies.push({
      x:           p.x + p.w / 2 - _WASP_DRAW_W / 2,
      y:           spawnY,
      baseY:       spawnY,                                    // zig-zag center anchor
      homePlat:    p,                                         // skip in bounce checks
      zigTimer:    Math.random() / _ZIG_FREQ_HZ,              // random phase offset
      vx:          speed * dir,
      patrolTimer: _PATROL_MIN_SEC + Math.random() * (_PATROL_MAX_SEC - _PATROL_MIN_SEC),
      animTimer:   Math.random() * (1 / _WASP_ANIM_FPS),
      frame:       Math.floor(Math.random() * _WASP_FRAMES),
      alive:       true,
      dyingTimer:  0,
      flipX:       dir < 0,
    });
  }
}

// ---------------------------------------------------------------------------
// updateEnemies(dt) — physics + AI step. Call every PLAYING frame AFTER
// checkPlatformCollisions() so player.prevY is current.
// ---------------------------------------------------------------------------
function updateEnemies(dt) {
  // Stomp-jump window: pressing jump within _STOMP_JUMP_WINDOW_S of a stomp grants
  // the full JUMP_VELOCITY. updatePlayer() runs before updateEnemies() each frame,
  // so the stomp opens the window at the end of frame N. The jump override takes
  // effect in frame N+1 — a deliberate one-frame delay.
  if (_stompJumpWindow > 0) {
    _stompJumpWindow -= dt;
    if (keys.jump) {
      player.vy        = JUMP_VELOCITY;
      _stompJumpWindow = 0;
    }
  }

  _waspIframe = Math.max(0, _waspIframe - dt);

  let _pawUsed = false; // one paw kill per frame; stomp checks still run for all wasps

  for (let i = enemies.length - 1; i >= 0; i--) {
    const w = enemies[i];

    // Death animation — count down then remove.
    if (!w.alive) {
      w.dyingTimer += dt;
      if (w.dyingTimer >= _DEATH_DURATION_SEC) {
        enemies.splice(i, 1);
      }
      continue;
    }

    // Animation.
    w.animTimer += dt;
    if (w.animTimer >= 1 / _WASP_ANIM_FPS) {
      w.animTimer -= 1 / _WASP_ANIM_FPS;
      w.frame = (w.frame + 1) % _WASP_FRAMES;
    }

    // Patrol timer — reverse direction on expiry.
    w.patrolTimer -= dt;
    if (w.patrolTimer <= 0) {
      w.vx          = -w.vx;
      w.flipX       = w.vx < 0;
      w.patrolTimer = _PATROL_MIN_SEC + Math.random() * (_PATROL_MAX_SEC - _PATROL_MIN_SEC);
    }

    // Move.
    w.x        += w.vx * dt;
    w.zigTimer += dt;
    w.y         = w.baseY + Math.sin(w.zigTimer * _ZIG_FREQ_HZ * Math.PI * 2) * _ZIG_AMP_PX;

    // Rigid body — canvas left/right walls.
    if (w.x < 0) {
      w.x           = 0;
      w.vx          = Math.abs(w.vx);
      w.flipX       = false;
      w.patrolTimer = _PATROL_MIN_SEC + Math.random() * (_PATROL_MAX_SEC - _PATROL_MIN_SEC);
    } else if (w.x + _WASP_DRAW_W > _CANVAS_W) {
      w.x           = _CANVAS_W - _WASP_DRAW_W;
      w.vx          = -Math.abs(w.vx);
      w.flipX       = true;
      w.patrolTimer = _PATROL_MIN_SEC + Math.random() * (_PATROL_MAX_SEC - _PATROL_MIN_SEC);
    }

    // Rigid body — bounce off visible platforms (skip home platform: zig-zag
    // can dip into it and trigger false side-bounces).
    for (const p of platforms) {
      if (p.invisible || p === w.homePlat) continue;
      const overlapX = w.x < p.x + p.w && w.x + _WASP_DRAW_W > p.x;
      const overlapY = w.y < p.y + p.h && w.y + _WASP_DRAW_H > p.y;
      if (overlapX && overlapY) {
        w.vx    = -w.vx;
        w.flipX = w.vx < 0;
        // Push out of the collider so the next frame doesn't re-trigger.
        if (w.vx > 0) w.x = p.x + p.w;
        else          w.x = p.x - _WASP_DRAW_W;
        w.patrolTimer = _PATROL_MIN_SEC + Math.random() * (_PATROL_MAX_SEC - _PATROL_MIN_SEC);
        break;
      }
    }

    // Stinger contact — player loses a life.
    // Natural sprite (flipX=false, facing right): head left, stinger right → stingOX = _STING_OX_RIGHT.
    // Mirrored  sprite (flipX=true,  facing left ): head right, stinger left → stingOX = _STING_OX_LEFT.
    if (_waspIframe <= 0 && hazard.iframeTimer <= 0) {
      const stingOX = w.flipX ? _STING_OX_LEFT : _STING_OX_RIGHT;
      const sx      = w.x + stingOX;
      const sy      = w.y + _STING_OY;
      const hitX    = sx < player.x + player.w && sx + _STING_W > player.x;
      const hitY    = sy < player.y + player.h && sy + _STING_H > player.y;
      if (hitX && hitY) {
        takeDamage('wasp');
        if (typeof playSound === 'function') playSound('wasp_sting');
        _waspIframe = _WASP_IFRAME_SEC;
        // Wasp survives — knock it away from the player as a flee burst.
        w.vx          = -w.vx * _WASP_FLEE_SPEED_MUL;
        w.flipX       = w.vx < 0;
        w.patrolTimer = _PATROL_MIN_SEC + Math.random() * (_PATROL_MAX_SEC - _PATROL_MIN_SEC);
      }
    }

    // Paw hit — Z held while paw AABB overlaps the wasp body. Uses getPawZone()
    // from player.js. _pawUsed prevents multiple kills per frame, but stomp
    // checks still run for all remaining wasps in the same frame.
    if (keys.push && !_pawUsed) {
      const paw     = getPawZone();
      const pawHitX = paw.x < w.x + _WASP_DRAW_W && paw.x + paw.w > w.x;
      const pawHitY = paw.y < w.y + _WASP_DRAW_H && paw.y + paw.h > w.y;
      if (pawHitX && pawHitY) {
        w.alive             = false;
        w.dyingTimer        = 0;
        GameState.killBonus += _KILL_BONUS_POINTS;
        _waspsDefeated      += 1;
        _pawUsed            = true;
        if (typeof playSound === 'function') playSound('wasp_death');
      }
    }

    // Stomp — one-way check that mirrors platform collision: the player must
    // have been ABOVE the wasp last frame and is now descending onto its top.
    const waspTopY  = w.y;
    const playerBot = player.y     + player.h;
    const prevBot   = player.prevY + player.h;
    const xOverlap  = player.x < w.x + _WASP_DRAW_W && player.x + player.w > w.x;
    const wasAbove  = prevBot <= waspTopY + _STOMP_H;
    const nowOnTop  = playerBot >= waspTopY && playerBot <= waspTopY + _STOMP_H + _STOMP_LAND_TOL_PX;
    const falling   = player.vy > 0;
    if (xOverlap && wasAbove && nowOnTop && falling) {
      w.alive             = false;
      w.dyingTimer        = 0;
      player.vy           = _STOMP_BOUNCE_VY;
      player.y            = waspTopY - player.h;
      GameState.killBonus += _KILL_BONUS_POINTS;
      _stompJumpWindow    = _STOMP_JUMP_WINDOW_S;
      _waspsDefeated      += 1;
      if (typeof playSound === 'function') playSound('wasp_death');
    }
  }
}

// ---------------------------------------------------------------------------
// renderEnemies(ctx) — draw all alive + dying wasps. Call inside the
// world-space ctx.save/translate block.
// ---------------------------------------------------------------------------
function renderEnemies(ctx) {
  const loaded = _waspSheet.complete && _waspSheet.naturalWidth > 0;

  for (const w of enemies) {
    const dx = Math.floor(w.x);
    const dy = Math.floor(w.y);

    // Death animation: shrink + fade.
    if (!w.alive) {
      const progress = w.dyingTimer / _DEATH_DURATION_SEC; // 0 → 1
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

    // Alive: draw with horizontal flip if facing left.
    ctx.save();
    if (w.flipX) {
      // Mirror: translate to right edge, scale x by -1 so the origin flips left.
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

// ---------------------------------------------------------------------------
// getNearestWaspDist(px, py) — returns the px distance from (px, py) to the
// center of the nearest alive wasp, or null if no alive wasp exists.
// Used by audio.js updateWaspBuzz() for proximity-driven volume.
// ---------------------------------------------------------------------------
function getNearestWaspDist(px, py) {
  if (enemies.length === 0) return null;
  let minSq = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const w = enemies[i];
    if (!w.alive) continue;
    const dx = (w.x + _WASP_DRAW_W * 0.5) - px;
    const dy = (w.y + _WASP_DRAW_H * 0.5) - py;
    const sq = dx * dx + dy * dy;
    if (sq < minSq) minSq = sq;
  }
  return minSq === Infinity ? null : Math.sqrt(minSq);
}
