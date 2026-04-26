/*
====================================================================
* main.js - Entry point: canvas, game loop, update, render
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-04
* Version: 1.4 - Banner moved to top of screen (y=0–140)
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Semi-fixed timestep with 50ms cap: prevents physics explosion
*   on tab-switch or frame skips (dt = Math.min(raw, 0.05))
* - Update call order: physics → platforms → collision → camera is load-bearing;
*   swapping order breaks one-way collision (prevY must be set before check)
* - World-space / screen-space render separation:
*   ctx.save → ctx.translate(0, -cameraY) → world objects → ctx.restore → HUD
* - HUD drawn after ctx.restore() — ensures it stays in screen coordinates
*
* NOTES:
* - canvas width/height set via JS attributes — NEVER via CSS (avoids blur)
* - imageSmoothingEnabled = false set once here at init
* - Game loop starts on window load event to ensure all assets are registered
*
* VERSION HISTORY:
* - v1.0: Canvas init, basic game loop, update/render skeleton
* - v1.1: Camera, score tracking, level goal check
* - v1.2: Full multi-screen HUD (START, LEVEL_COMPLETE, GAMEOVER), fall-off-bottom
* - v1.3: Click-to-start (left mouse fires keys.enter), danger countdown banner (3s pre-hazard)
* - v1.4: Banner anchor moved to screen top (y=0–140) — was incorrectly centered at 65% down
====================================================================
*/
// Depends on: GamePhase, GameState, resetGame (game-state.js)
//             keys (input.js)
//             player, updatePlayer, renderPlayer, resetPlayer (player.js)

// ── HUD lives icon ──────────────────────────────────────────────────────────
const _hudLifeIcon = new Image(); _hudLifeIcon.src = 'PixelArt/ui/hud/life_icon.png';

// ── Balloon extra-life collectible ──────────────────────────────────────────
const _sprExtraLife = new Image(); _sprExtraLife.src = 'PixelArt/collectibles/balloon.png';
const _BAL_W = 70, _BAL_H = 106; // drawn size — 2.2× base (32×48) for visibility
// Balloon rises upward continuously (anchorY decreases each frame) with a sinusoidal horizontal weave.
// Pure world-space = no camera interaction bugs.
const _balloon = { active: false, x: 0, y: 0, anchorX: 0, anchorY: 0, time: 0, spawnAtY: 0 };
const _BAL_RISE_SPEED = 120;  // px/s — doubled (was 60); rises noticeably faster
const _BAL_H_AMP      = 50;   // px — 1/3 of original 150; narrower side-sweep
const _BAL_H_PERIOD   = 1.8;  // seconds per horizontal weave cycle — snappy pendulum tempo


function resetBalloon() {
  // Dormant until player climbs to a random threshold in the first 5%–40% of the level.
  // Earlier window ensures the balloon appears well before the level's final stretch.
  const levelHeight = PLAYER_START_Y - GameState.levelGoalY;
  const frac        = 0.05 + Math.random() * 0.35;
  _balloon.spawnAtY = PLAYER_START_Y - levelHeight * frac;
  _balloon.active   = false;
}

// Plush cat zone offsets within the drawn balloon sprite (70×106):
// Sprite layout: heart balloon top ~58%, string ~17%, plush cat bottom ~40%
// Values measured from the 150×220 source, scaled to 70×106 draw size.
const _BAL_PLUSH = { ox: 14, oy: 62, w: 42, h: 44 }; // offset + size within sprite

function updateBalloon(dt) {
  if (!_balloon.active) {
    // Dormant: activate when player reaches the pre-baked altitude threshold
    if (player.y <= _balloon.spawnAtY) {
      // Spawn 90px above player head (world space) — paw/plush zones overlap immediately.
      // Balloon then rises upward at _BAL_RISE_SPEED, giving a ~3s catch window.
      _balloon.anchorX = 40 + Math.random() * (480 - 80 - _BAL_W);
      _balloon.anchorY = player.y - 90;
      _balloon.x       = _balloon.anchorX;
      _balloon.y       = _balloon.anchorY;
      _balloon.time    = 0;
      _balloon.active  = true;
    }
    return;
  }

  _balloon.time += dt;

  // Rise: balloon drifts upward continuously (anchorY decreases each frame)
  _balloon.anchorY -= _BAL_RISE_SPEED * dt;
  _balloon.y = _balloon.anchorY;

  // Horizontal: sinusoidal weave
  _balloon.x = _balloon.anchorX
    + Math.sin(_balloon.time * (2 * Math.PI / _BAL_H_PERIOD)) * _BAL_H_AMP;
  if (_balloon.x < 0) _balloon.x = 0;
  if (_balloon.x + _BAL_W > 480) _balloon.x = 480 - _BAL_W;

  // Deactivate if balloon has floated well above the visible screen (uncatchable)
  if (_balloon.y + _BAL_H < GameState.cameraY - 150) {
    _balloon.active = false;
    return;
  }

  // Catch requires Z / right-click (paw action) — passive overlap does nothing
  if (!keys.push) return;

  // Plush cat world zone
  const plushX = _balloon.x + _BAL_PLUSH.ox;
  const plushY = _balloon.y + _BAL_PLUSH.oy;

  // Paw zone: shared AABB from getPawZone() (player.js)
  const paw = getPawZone();

  const overlapX = paw.x < plushX + _BAL_PLUSH.w && paw.x + paw.w > plushX;
  const overlapY = paw.y < plushY + _BAL_PLUSH.h && paw.y + paw.h > plushY;
  if (overlapX && overlapY) {
    if (GameState.lives < 9) GameState.lives += 1;
    _balloon.active = false;
  }
}

function renderBalloon(ctx) {
  if (!_balloon.active) return;
  const bx = Math.floor(_balloon.x), by = Math.floor(_balloon.y);
  if (_sprExtraLife.complete && _sprExtraLife.naturalWidth > 0) {
    ctx.drawImage(_sprExtraLife, bx, by, _BAL_W, _BAL_H);
  } else {
    ctx.fillStyle = '#ff69b4'; // placeholder if sprite not yet loaded
    ctx.fillRect(bx, by, _BAL_W, _BAL_H);
  }
}

// ── Outro trigger (level finish) ────────────────────────────────────────────
// Paw (Z / right-click) must touch the central element with 4 px tolerance.
// L1 windrad sprite missing — getOutroConfig returns null, no trigger active.
// L2 = bell + rope (stand is decoration, NOT in hitbox).
// L3 = lever stick (8 px wide, NOT the 67 px base).
const _bellStand  = new Image(); _bellStand.src  = 'PixelArt/backgrounds/level_2_shaft/outro_trigger/bell_stand.png';
const _bellSheet  = new Image(); _bellSheet.src  = 'PixelArt/backgrounds/level_2_shaft/outro_trigger/bell_spritesheet.png';
const _leverMid   = new Image(); _leverMid.src   = 'PixelArt/backgrounds/level_3_sea/end_triggers/lever_mid.png';

const _OUTRO_REACH_PAD   = 35;            // px around hitbox; paw must overlap (hb + pad)
const _OUTRO_GLOW_COLOR  = '#ff00ff';     // magenta — same shadowColor technique as HUD lives
const _OUTRO_GLOW_PERIOD = 1.2;           // s per pulse cycle
let   _outroTime         = 0;             // accumulator for sin pulsing

// Per-level placement + hitbox. World coordinates.
// Tunables: standX/standY for bell, drawX/drawY for lever, hitbox rect for both.
function getOutroConfig(level) {
  if (level === 1) {
    // L1 placeholder pinwheel — drawn in JS (no PNG asset). Roof-mounted on right side.
    // Roof walkable surface y = levelGoalY − 35.
    const roofY  = Math.floor(GameState.levelGoalY) - 35;
    const cx     = 410;                        // mid of right-side roof area
    const radius = 16;                         // blade reach
    const mastH  = 26;                         // mast pixel height
    const cy     = roofY - mastH;              // wheel center sits above mast
    // Hitbox covers the spinning blade disc only (square around radius), not the mast.
    const hb = {
      x: cx - radius,
      y: cy - radius,
      w: radius * 2,
      h: radius * 2,
    };
    return { kind: 'pinwheel', cx, cy, radius, mastH, roofY, hb };
  }
  if (level === 2) {
    const standW = _bellStand.naturalWidth  || 100;
    const standH = _bellStand.naturalHeight || 130;
    // Stand sits on the right side, bottom flush with finish-platform top (levelGoalY).
    const standX = 480 - standW - 12;
    const standY = Math.floor(GameState.levelGoalY) - standH + PLATFORM_H;
    // Bell + rope hang from the stand's left arm. Hitbox is a tall narrow rectangle
    // covering the rope strip + bell body. Tune these 4 numbers if visual mismatch.
    const hb = {
      x: standX + 6,
      y: standY + 2,
      w: 40,
      h: 50,
    };
    return { kind: 'bell', standX, standY, standW, standH, hb };
  }
  if (level === 3) {
    const natW   = _leverMid.naturalWidth  || 40;
    const natH   = _leverMid.naturalHeight || 60;
    const SCALE  = 0.68;                      // 0.80 × 0.85 — 32 % smaller overall
    const drawW  = Math.round(natW * SCALE);
    const drawH  = Math.round(natH * SCALE);
    // LH-Saucer top is at world y = (272 - 4562) = -4290. Lever sits centered at cx=133.
    const cx     = 133;
    const drawX  = cx - Math.floor(drawW / 2);
    const drawY  = (272 - 4562) - drawH + 4 - 48;  // 48 px higher than original anchor (60 − 12)
    // Stick hitbox: 8 px wide vertical strip, upper portion of sprite (above the wide base).
    const stickW = 8;
    const stickH = Math.floor(drawH * 0.60);  // upper ~60 % of scaled sprite
    const hb = {
      x: cx - stickW / 2,
      y: drawY,
      w: stickW,
      h: stickH,
    };
    return { kind: 'lever', drawX, drawY, drawW, drawH, hb };
  }
  return null;
}

function isOutroInReach(level) {
  const cfg = getOutroConfig(level);
  if (!cfg) return false;
  const paw = getPawZone();
  const hb  = cfg.hb;
  const p   = _OUTRO_REACH_PAD;
  return paw.x         < hb.x + hb.w + p
      && paw.x + paw.w > hb.x       - p
      && paw.y         < hb.y + hb.h + p
      && paw.y + paw.h > hb.y       - p;
}

function updateOutroTrigger(dt) {
  _outroTime += dt;
  if (!keys.push) return;
  if (!isOutroInReach(GameState.level)) return;
  keys.push = false;
  GameState.phase = GamePhase.LEVEL_OUTRO;
  showLevelEnd(GameState.level);
}

function _drawOutroSprite(ctx, drawFn, glow) {
  if (!glow) { drawFn(); return; }
  const phase = (_outroTime / _OUTRO_GLOW_PERIOD) * Math.PI * 2;
  const blur  = 11 + 7 * Math.sin(phase);  // 4..18
  ctx.save();
  ctx.shadowColor = _OUTRO_GLOW_COLOR;
  ctx.shadowBlur  = blur;
  drawFn();
  ctx.restore();
}

function _drawPinwheel(ctx, cx, cy, radius, mastH, time) {
  // Mast — drawn first so blades cover its top
  ctx.fillStyle = '#5a3e2b';
  ctx.fillRect(cx - 2, cy, 4, mastH);
  // Spinning blades
  const colors = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 1.4);                 // ~1.4 rad/s slow spin
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 2);
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, -radius * 0.35);
    ctx.lineTo(radius * 0.35, radius * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();           // ← war fehlend; ohne das stapeln sich Transforms jedes Frame
  }
  ctx.restore();
  // Center cap
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function renderOutroTrigger(ctx) {
  const cfg = getOutroConfig(GameState.level);
  if (!cfg) return;
  const inReach = isOutroInReach(GameState.level);

  if (cfg.kind === 'pinwheel') {
    _drawOutroSprite(ctx, () => {
      _drawPinwheel(ctx, cfg.cx, cfg.cy, cfg.radius, cfg.mastH, _outroTime);
    }, inReach);
  } else if (cfg.kind === 'bell') {
    if (_bellStand.complete && _bellStand.naturalWidth > 0) {
      ctx.drawImage(_bellStand, cfg.standX, cfg.standY);
    }
    if (_bellSheet.complete && _bellSheet.naturalWidth > 0) {
      const sheetW = _bellSheet.naturalWidth;
      const sheetH = _bellSheet.naturalHeight;
      const frameW = Math.floor(sheetW / 3);
      const bellDX = cfg.standX + 22 - Math.floor(frameW / 2);
      const bellDY = cfg.standY + 4;
      _drawOutroSprite(ctx, () => {
        ctx.drawImage(_bellSheet, frameW, 0, frameW, sheetH, bellDX, bellDY, frameW, sheetH);
      }, inReach);
    }
  } else if (cfg.kind === 'lever') {
    if (_leverMid.complete && _leverMid.naturalWidth > 0) {
      _drawOutroSprite(ctx, () => {
        ctx.drawImage(_leverMid, cfg.drawX, cfg.drawY, cfg.drawW, cfg.drawH);
      }, inReach);
    }
  }
}

// ── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
canvas.width  = 480; // set via JS attribute — NEVER via CSS
canvas.height = 640;
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;  // pixel-crisp rendering — prevents sprite blur at any drawImage scale

// ── Game loop timing ─────────────────────────────────────────────────────────
let lastTime = performance.now(); // initialized here — prevents first-frame dt spike

function gameLoop(timestamp) {
  // Semi-fixed timestep: cap at 50ms (≈3 frames at 60fps) prevents physics explosion on tab-switch
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // seconds
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ── Update dispatcher ────────────────────────────────────────────────────────
function update(dt) {
  updateBackground(dt); // always run — animates background on all screens

  switch (GameState.phase) {
    case GamePhase.START:
      if (keys.menuUp) {
        keys.menuUp = false;
        const i = DIFFICULTY_ORDER.indexOf(GameState.difficulty);
        GameState.difficulty = DIFFICULTY_ORDER[(i + DIFFICULTY_ORDER.length - 1) % DIFFICULTY_ORDER.length];
      }
      if (keys.menuDown) {
        keys.menuDown = false;
        const i = DIFFICULTY_ORDER.indexOf(GameState.difficulty);
        GameState.difficulty = DIFFICULTY_ORDER[(i + 1) % DIFFICULTY_ORDER.length];
      }

      // Mouse hit-test: click on a difficulty row → select it; click "Audio" → open audio menu.
      // Must run BEFORE keys.enter so a row-click doesn't also trigger game start.
      if (mouseJustClicked) {
        mouseJustClicked = false;
        const rect    = canvas.getBoundingClientRect();
        const mx      = lastMouseClientX - rect.left;
        const my      = lastMouseClientY - rect.top;
        const cx      = canvas.width / 2;
        const optY0   = 310;
        const optStep = 32;
        let hitRow = false;
        for (let i = 0; i < DIFFICULTY_ORDER.length; i++) {
          const ry = optY0 + i * optStep;
          if (mx >= cx - 130 && mx <= cx + 130 && my >= ry - 22 && my <= ry + 10) {
            GameState.difficulty = DIFFICULTY_ORDER[i];
            keys.enter = false; // select only — do not start the game
            hitRow = true;
            break;
          }
        }
        // "Audio" link hit region (matches render position y=510)
        if (!hitRow && mx >= cx - 60 && mx <= cx + 60 && my >= 492 && my <= 520) {
          keys.enter          = false;
          GameState.menuCursor = 0;
          GameState.phase     = GamePhase.AUDIO_MENU;
        }
      }

      if (keys.enter) {
        keys.enter = false; // one-shot: prevent instant pass-through on next frame
        resetGame();
        resetBalloon(); // called after resetGame → resetPlatforms
        spawnEnemies(); // called after resetPlatforms so platforms array is ready
        // Override: show LEVEL_INTRO bubble before gameplay starts
        GameState.phase = GamePhase.LEVEL_INTRO;
        showLevelStart(GameState.level);
      }
      if (keys.push) {
        keys.push = false;
        GameState.phase = GamePhase.DEV_SELECT;
      }
      break;

    case GamePhase.DEV_SELECT:
      if (keys.escape) { keys.escape = false; GameState.phase = GamePhase.START; break; }
      if (keys.menuUp)   { keys.menuUp   = false; GameState.devCursor = GameState.devCursor > 1 ? GameState.devCursor - 1 : 3; }
      if (keys.menuDown) { keys.menuDown = false; GameState.devCursor = GameState.devCursor < 3 ? GameState.devCursor + 1 : 1; }
      if (keys.enter) {
        keys.enter = false;
        resetGame(GameState.devCursor);
        resetBalloon();
        spawnEnemies();
        GameState.phase = GamePhase.LEVEL_INTRO;
        showLevelStart(GameState.level);
      }
      break;

    case GamePhase.LEVEL_INTRO:
      // Bubble overlay shown before each level. Press ENTER / Space / Z to dismiss.
      updateDialogue(dt);
      // Swallow ESC during the bubble — otherwise a held/bleed ESC hops straight
      // through PLAYING on the next frame and slams into PAUSED.
      if (keys.escape) keys.escape = false;
      if (keys.enter || keys.jump || keys.push) {
        keys.enter = false;
        keys.jump  = false;
        keys.push  = false;
        if (advanceDialogue()) GameState.phase = GamePhase.PLAYING;
      }
      break;

    case GamePhase.LEVEL_OUTRO:
      // Bubble overlay shown after finish-trigger, before LEVEL_COMPLETE menu.
      updateDialogue(dt);
      // Swallow ESC — LEVEL_COMPLETE reads ESC as "back to menu" or similar,
      // so we don't want a stray ESC skipping past the stats screen.
      if (keys.escape) keys.escape = false;
      if (keys.enter || keys.jump || keys.push) {
        keys.enter = false;
        keys.jump  = false;
        keys.push  = false;
        if (advanceDialogue()) {
          GameState.menuCursor = 0;
          GameState.phase      = GamePhase.LEVEL_COMPLETE;
        }
      }
      break;

    case GamePhase.DEV_BROWSE: {
      // Free-camera level viewer: physics frozen, camera driven by mouse wheel or arrow keys.
      // Press \ or ESC to resume playing.
      if (keys.escape || keys.devBrowse) {
        keys.escape    = false;
        keys.devBrowse = false;
        devWheelDelta  = 0;
        GameState.phase = GamePhase.PLAYING;
        break;
      }
      const _devMin = (GameState.levelGoalY || -9999) - 200;
      const _devMax = 100;
      if (devWheelDelta !== 0) {
        GameState.cameraY = Math.max(_devMin, Math.min(_devMax, GameState.cameraY + devWheelDelta * 2));
        devWheelDelta = 0;
      }
      if (keys.menuUp)   GameState.cameraY = Math.max(_devMin, GameState.cameraY - 40);
      if (keys.menuDown) GameState.cameraY = Math.min(_devMax, GameState.cameraY + 40);
      break;
    }

    case GamePhase.PLAYING:
      // Life-lost dialogue (transient) pauses physics — tick dialogue timer only.
      if (isDialogueBlocking()) { updateDialogue(dt); break; }

      // DEV: \ toggles free-camera mode
      if (keys.devBrowse) {
        keys.devBrowse = false;
        devWheelDelta  = 0;
        GameState.phase = GamePhase.DEV_BROWSE;
        break;
      }

      // ESC → pause
      if (keys.escape) {
        keys.escape          = false;
        GameState.menuCursor = 0;
        GameState.phase      = GamePhase.PAUSED;
        break;
      }

      // ⚠ CALL ORDER IS LOAD-BEARING — do not reorder:
      // 1. updatePlayer(dt)          — gravity, mid-air boost (Space), movement; saves prevY
      // 2. updatePlatforms(dt)       — advances crumble timers
      // 3. checkPlatformCollisions() — reads prevY for one-way check; resets airBoostUsed on landing
      // 4. updateCamera()            — follows player after physics settle
      updatePlayer(dt);
      updatePlatforms(dt);
      checkPlatformCollisions();
      updateCamera();
      updateBalloon(dt);
      updateEnemies(dt);
      updateOutroTrigger(dt);

      // Score: height climbed this level (pixels above spawn point)
      // killBonus is tracked separately and revealed at level complete
      GameState.score = Math.max(0, PLAYER_START_Y - GameState.maxHeightReached);

      // Fall-off-bottom: costs one life, respawns at camera top
      if (player.y > GameState.cameraY + canvas.height && hazard.iframeTimer <= 0) {
        takeDamage('hazard');
        if (GameState.phase === GamePhase.PLAYING) {
          player.y  = GameState.cameraY + 60; // respawn near top of camera view
          player.vy = JUMP_VELOCITY;           // auto-bounce on respawn
        }
      }

      // Countdown: tick down; hazard only activates once timer expires
      if (GameState.countdownTimer > 0) {
        GameState.countdownTimer = Math.max(0, GameState.countdownTimer - dt);
      } else {
        updateHazard(dt);
      }
      break;

    case GamePhase.PAUSED:
      // ESC = resume immediately
      if (keys.escape) { keys.escape = false; GameState.phase = GamePhase.PLAYING; break; }
      if (keys.menuUp)   { keys.menuUp   = false; GameState.menuCursor = (GameState.menuCursor + 5) % 6; }
      if (keys.menuDown) { keys.menuDown = false; GameState.menuCursor = (GameState.menuCursor + 1) % 6; }
      // Rows 4 (Music) and 5 (SFX): ←→ adjust volume, Space toggle mute
      if (GameState.menuCursor >= 4) {
        const track = GameState.menuCursor === 4 ? GameState.audio.music : GameState.audio.sfx;
        if (keys.left)  { keys.left  = false; track.vol = Math.max(0, +(track.vol - 0.05).toFixed(2)); }
        if (keys.right) { keys.right = false; track.vol = Math.min(1, +(track.vol + 0.05).toFixed(2)); }
        if (keys.jump)  { keys.jump  = false; track.muted = !track.muted; } // Space = mute toggle
      }
      if (keys.enter) {
        keys.enter = false;
        switch (GameState.menuCursor) {
          case 0: GameState.phase = GamePhase.PLAYING; break;                              // Continue
          case 1: restartLevel(); resetBalloon(); spawnEnemies();
                  GameState.phase = GamePhase.LEVEL_INTRO; showLevelStart(GameState.level); break; // Restart level
          case 2: resetGame();    resetBalloon(); spawnEnemies();
                  GameState.phase = GamePhase.LEVEL_INTRO; showLevelStart(GameState.level); break; // Restart game
          case 3: GameState.phase = GamePhase.START; break;                                // Main menu
          case 4: case 5: break;                                                           // audio rows: ←→/Space only
        }
      }
      break;

    case GamePhase.AUDIO_MENU:
      // ESC or Back row (cursor 2) → return to Start screen
      if (keys.escape) { keys.escape = false; GameState.menuCursor = 0; GameState.phase = GamePhase.START; break; }
      if (keys.menuUp)   { keys.menuUp   = false; GameState.menuCursor = (GameState.menuCursor + 2) % 3; }
      if (keys.menuDown) { keys.menuDown = false; GameState.menuCursor = (GameState.menuCursor + 1) % 3; }
      // Rows 0 (Music) and 1 (SFX): ←→ adjust volume, Space toggle mute
      if (GameState.menuCursor <= 1) {
        const track = GameState.menuCursor === 0 ? GameState.audio.music : GameState.audio.sfx;
        if (keys.left)  { keys.left  = false; track.vol = Math.max(0, +(track.vol - 0.05).toFixed(2)); }
        if (keys.right) { keys.right = false; track.vol = Math.min(1, +(track.vol + 0.05).toFixed(2)); }
        if (keys.jump)  { keys.jump  = false; track.muted = !track.muted; } // Space = mute toggle
      }
      if (keys.enter) {
        keys.enter = false;
        if (GameState.menuCursor === 2) { GameState.menuCursor = 0; GameState.phase = GamePhase.START; } // Back
      }
      break;

    case GamePhase.LEVEL_COMPLETE:
      if (keys.menuUp)   { keys.menuUp   = false; GameState.menuCursor = (GameState.menuCursor + 3) % 4; }
      if (keys.menuDown) { keys.menuDown = false; GameState.menuCursor = (GameState.menuCursor + 1) % 4; }
      if (keys.enter) {
        keys.enter = false;
        switch (GameState.menuCursor) {
          case 0: // Next level — if on last level, go to start
            if (GameState.level < 3) {
              startNextLevel(); resetBalloon(); spawnEnemies();
              GameState.phase = GamePhase.LEVEL_INTRO; showLevelStart(GameState.level);
            }
            else GameState.phase = GamePhase.START;
            break;
          case 1: restartLevel(); resetBalloon(); spawnEnemies();
                  GameState.phase = GamePhase.LEVEL_INTRO; showLevelStart(GameState.level); break; // Restart level
          case 2: resetGame();    resetBalloon(); spawnEnemies();
                  GameState.phase = GamePhase.LEVEL_INTRO; showLevelStart(GameState.level); break; // Restart game
          case 3: GameState.phase = GamePhase.START;             break; // Main menu
        }
      }
      break;

    case GamePhase.GAMEOVER:
      if (keys.enter) {
        keys.enter = false;
        GameState.phase = GamePhase.START;
      }
      break;
  }
}

// ── Render pass ──────────────────────────────────────────────────────────────
function render() {
  // 1. Clear canvas — sky blue base so transparent edges of background layers blend cleanly
  ctx.fillStyle = '#7eb8c9'; // BG-1 sky day — matches day.png dominant color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Background layers — screen space, each at its own parallax scroll speed
  renderBackground(ctx);

  // 3. Enter world space — all entities use world coordinates
  ctx.save();
  ctx.translate(0, -GameState.cameraY); // cameraY is 0 in Phase 1; camera added in Phase 2

  // 4. Draw world-space objects
  const _drawWorld = (
    GameState.phase === GamePhase.PLAYING        ||
    GameState.phase === GamePhase.LEVEL_COMPLETE ||
    GameState.phase === GamePhase.PAUSED         ||
    GameState.phase === GamePhase.LEVEL_INTRO    ||
    GameState.phase === GamePhase.LEVEL_OUTRO    ||
    GameState.phase === GamePhase.DEV_BROWSE
  );
  if (GameState.phase === GamePhase.START ||
      GameState.phase === GamePhase.AUDIO_MENU) renderWindowFloors(ctx);
  if (_drawWorld) {
    renderPlatforms(ctx);     // draw platforms before player (player renders on top)
    renderOutroTrigger(ctx);  // trigger sprite behind player — cat can overlap bell/lever
    renderEnemies(ctx);       // enemies behind player — stomp is clearer when player overlaps on top
    renderBalloon(ctx);
    renderPlayer(ctx);
    renderHazard(ctx);
  }

  // 5. Exit world space
  ctx.restore();

  // 6. Draw HUD — ALWAYS in screen space (after ctx.restore)
  renderHUD();

  // 7. DEV_BROWSE overlay — coordinate readout + usage hint
  if (GameState.phase === GamePhase.DEV_BROWSE) {
    const worldY = Math.round(GameState.cameraY);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, 28);
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DEV BROWSE  cameraY: ${worldY}  [↑↓ or Scroll]  [F2 or Esc = resume]`, 8, 18);
    ctx.textAlign = 'left'; // reset
  }

  // 8. Dialogue overlay — drawn LAST so bubbles sit on top of HUD + world
  renderDialogue(ctx);
}


function renderHUD() {
  // ── Damage flash overlay — drawn first so it sits behind HUD text ──────────
  if (hazard.flashTimer > 0) {
    const alpha = (hazard.flashTimer / FLASH_DURATION) * 0.5; // 0.5 at peak, fades to 0
    ctx.fillStyle = 'rgba(220, 30, 30, ' + alpha.toFixed(3) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── PLAYING: real-time score in top-left ─────────────────────────────────
  if (GameState.phase === GamePhase.PLAYING) {
    // HUD background banner
    ctx.fillStyle = 'rgba(0,0,0,0.50)';
    ctx.fillRect(0, 0, canvas.width, 68);

    // Score — top-left
    ctx.font      = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const _scoreText = 'SCORE: ' + Math.floor(GameState.score) + ' px';
    ctx.fillText(_scoreText, 12, 24);
    // Kill bonus — bold yellow counter, inline right of score, hidden at 0
    if (GameState.killBonus > 0) {
      const _scoreW = ctx.measureText(_scoreText).width; // measure in regular font BEFORE switching
      ctx.font      = 'bold 16px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(' +' + GameState.killBonus, 12 + _scoreW, 24);
      ctx.font      = '16px monospace';
    }

    // Level — top-left below score (original position)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL: ' + GameState.level, 12, 46);

    // Lives — top-right icons, right-to-left, y=26
    if (_hudLifeIcon.complete && _hudLifeIcon.naturalWidth > 0) {
      const icoW = 32, icoH = 26, gap = 4;
      const maxShow = Math.min(GameState.lives, 9);
      ctx.save();
      ctx.shadowColor   = '#f1c40f';
      ctx.shadowBlur    = 6;
      ctx.shadowOffsetY = 4;
      for (let i = 0; i < maxShow; i++) {
        const ix = canvas.width - 8 - (i + 1) * (icoW + gap);
        ctx.drawImage(_hudLifeIcon, ix, 11, icoW, icoH);
      }
      ctx.restore();
    }
  }

  // ── Danger countdown banner — shown at start of each level before hazard activates ──
  if (GameState.phase === GamePhase.PLAYING && GameState.countdownTimer > 0) {
    const countdown = Math.ceil(GameState.countdownTimer); // 3 → 2 → 1

    // Anchor at top of screen (bannerY=75 → band covers y=0–140)
    const bannerY = 75;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
    ctx.fillRect(0, 0, canvas.width, 140);

    ctx.textAlign = 'center';

    // Header
    ctx.fillStyle = '#e74c3c';
    ctx.font      = '18px monospace';
    ctx.fillText('DANGER!', canvas.width / 2, bannerY - 34);

    // Big countdown number
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '72px monospace';
    ctx.fillText(String(countdown), canvas.width / 2, bannerY + 42);

    ctx.textAlign = 'left'; // always reset
  }

  // ── START screen ─────────────────────────────────────────────────────────
  if (GameState.phase === GamePhase.START) {
    const cx = canvas.width / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font      = '36px monospace';
    ctx.fillText('SOGGY MOGGY', cx, 175);

    // Difficulty picker — vertical 3-option list, ↑↓ or click to select
    ctx.fillStyle = '#ffffff';
    ctx.font      = '18px monospace';
    ctx.fillText('Difficulty', cx, 270);

    const optY0   = 310;
    const optStep = 32;
    for (let i = 0; i < DIFFICULTY_ORDER.length; i++) {
      const key      = DIFFICULTY_ORDER[i];
      const y        = optY0 + i * optStep;
      const selected = key === GameState.difficulty;
      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(cx - 130, y - 22, 260, 30);
        ctx.fillStyle = '#f1c40f';
      } else {
        ctx.fillStyle = '#888888';
      }
      ctx.font = '18px monospace';
      ctx.fillText((selected ? '▶ ' : '  ') + DIFFICULTY[key].label, cx, y);
    }

    ctx.font = '12px monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('↑↓ or click to select', cx, 430);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('ENTER or click to start', cx, 470);

    // Audio settings link
    ctx.font = '16px monospace';
    ctx.fillStyle = '#5dade2';
    ctx.fillText('Audio', cx, 510);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#555555';
    ctx.fillText('Z — dev level select', cx, 560);

    ctx.textAlign = 'left'; // always reset after centered rendering
  }

  // ── DEV SELECT screen ─────────────────────────────────────────────────────
  if (GameState.phase === GamePhase.DEV_SELECT) {
    const cx = canvas.width / 2;
    const LEVEL_NAMES = ['', 'L1 — City', 'L2 — Elevator Shaft', 'L3 — Open Sea'];

    ctx.fillStyle = 'rgba(0,0,0,0.80)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';

    ctx.fillStyle = '#e74c3c';
    ctx.font      = '14px monospace';
    ctx.fillText('DEV MODE', cx, 155);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '26px monospace';
    ctx.fillText('Select Level', cx, 195);

    const optY0   = 280;
    const optStep = 70;
    for (let i = 1; i <= 3; i++) {
      const y        = optY0 + (i - 1) * optStep;
      const selected = i === GameState.devCursor;
      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(cx - 160, y - 26, 320, 40);
        ctx.fillStyle = '#f1c40f';
      } else {
        ctx.fillStyle = '#888888';
      }
      ctx.font = '20px monospace';
      ctx.fillText((selected ? '\u25b6 ' : '  ') + LEVEL_NAMES[i], cx, y);
    }

    ctx.fillStyle = '#555555';
    ctx.font      = '13px monospace';
    ctx.fillText('\u2191\u2193 select   ENTER start   ESC back', cx, 520);

    ctx.textAlign = 'left';
  }

  // ── LEVEL COMPLETE screen ─────────────────────────────────────────────────
  if (GameState.phase === GamePhase.LEVEL_COMPLETE) {
    const LEVEL_NAMES = ['', 'City', 'Elevator Shaft', 'Open Sea', 'Amusement Park'];
    const cx = canvas.width / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = '#2ecc71';
    ctx.font      = '28px monospace';
    ctx.fillText('LEVEL ' + GameState.level + ' COMPLETE', cx, 120);
    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '16px monospace';
    ctx.fillText(LEVEL_NAMES[GameState.level] || '', cx, 148);

    // Stats — height score + kill bonus + clear bonus breakdown, then combined total
    const _lvlTotal = Math.floor(GameState.score) + Math.floor(GameState.killBonus) + GameState.clearBonus;
    ctx.font      = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Height:   ' + Math.floor(GameState.score)      + ' px',  cx, 184);
    ctx.fillStyle = GameState.killBonus > 0 ? '#f1c40f' : '#888888';
    ctx.fillText('Wasps:    ' + Math.floor(GameState.killBonus)  + ' pts', cx, 206);
    ctx.fillStyle = GameState.clearBonus > 0 ? '#ff9f43' : '#555555';
    ctx.font      = GameState.clearBonus > 0 ? 'bold 16px monospace' : '16px monospace';
    ctx.fillText('All clear! ' + (GameState.clearBonus > 0 ? '+200 pts' : '---'),  cx, 228);
    ctx.font      = '16px monospace';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('Total:    ' + _lvlTotal                        + ' pts', cx, 252);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Best:     ' + Math.floor(GameState.highScore)  + ' pts', cx, 274);
    // Lives — cat icons
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Lives:', cx - 36, 298);
    if (_hudLifeIcon.complete && _hudLifeIcon.naturalWidth > 0) {
      const icoW = 44, icoH = 36;
      const maxShow = Math.min(GameState.lives, 9);
      ctx.save();
      ctx.shadowColor   = '#f1c40f';
      ctx.shadowBlur    = 6;
      ctx.shadowOffsetY = 4;
      for (let i = 0; i < maxShow; i++) {
        ctx.drawImage(_hudLifeIcon, cx + 14 + i * (icoW + 4), 280, icoW, icoH);
      }
      ctx.restore();
    }

    // Menu options
    const option0 = GameState.level < 3 ? 'Next Level' : 'Final Score';
    const options = [option0, 'Restart Level', 'Restart Game', 'Main Menu'];
    const optY0   = 328;
    const optStep = 46;
    options.forEach((label, i) => {
      const y = optY0 + i * optStep;
      const selected = i === GameState.menuCursor;
      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(cx - 150, y - 22, 300, 32);
        ctx.fillStyle = '#f1c40f';
      } else {
        ctx.fillStyle = '#888888';
      }
      ctx.font = '18px monospace';
      ctx.fillText((selected ? '\u25b6 ' : '  ') + label, cx, y);
    });

    // Hint
    ctx.fillStyle = '#555555';
    ctx.font      = '13px monospace';
    ctx.fillText('\u2191\u2193 navigate   ENTER confirm', cx, 520);

    ctx.textAlign = 'left';
  }

  // ── PAUSED screen ─────────────────────────────────────────────────────────
  if (GameState.phase === GamePhase.PAUSED) {
    const cx = canvas.width / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font      = '36px monospace';
    ctx.fillText('PAUSED', cx, 155);

    // Rows 0\u20133: action options
    const options = ['Continue', 'Restart Level', 'Restart Game', 'Main Menu'];
    const optY0   = 225;
    const optStep = 45;
    options.forEach((label, i) => {
      const y        = optY0 + i * optStep;
      const selected = i === GameState.menuCursor;
      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(cx - 150, y - 22, 300, 32);
        ctx.fillStyle = '#f1c40f';
      } else {
        ctx.fillStyle = '#888888';
      }
      ctx.font = '18px monospace';
      ctx.fillText((selected ? '\u25b6 ' : '  ') + label, cx, y);
    });

    // Rows 4\u20135: audio controls (Music / SFX)
    ['Music', 'SFX'].forEach((label, idx) => {
      const row      = 4 + idx;
      const y        = optY0 + row * optStep;
      const selected = row === GameState.menuCursor;
      const track    = idx === 0 ? GameState.audio.music : GameState.audio.sfx;

      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(cx - 150, y - 22, 300, 32);
      }

      // Label
      ctx.fillStyle = selected ? '#f1c40f' : '#888888';
      ctx.font      = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText((selected ? '\u25b6 ' : '  ') + label, cx - 140, y);

      // Volume bar (80 px wide)
      const barX = cx - 48, barY = y - 10, barW = 80, barH = 13;
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = track.muted ? '#555555' : '#3498db';
      ctx.fillRect(barX, barY, Math.round(barW * track.vol), barH);

      // Percentage or MUTED label
      ctx.fillStyle = selected ? '#f1c40f' : '#888888';
      ctx.font      = '12px monospace';
      ctx.fillText(track.muted ? 'MUTED' : Math.round(track.vol * 100) + '%', cx + 40, y);

      ctx.textAlign = 'center'; // restore for next pass
    });

    ctx.fillStyle = '#555555';
    ctx.font      = '12px monospace';
    ctx.fillText('ESC resume  \u2191\u2193 navigate  ENTER confirm', cx, 563);
    ctx.fillText('\u2190\u2192 volume  Space mute  (rows 5\u20136)', cx, 579);

    ctx.textAlign = 'left';
  }

  // ── AUDIO MENU screen (opened from Start screen) ─────────────────────────
  if (GameState.phase === GamePhase.AUDIO_MENU) {
    const cx = canvas.width / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font      = '30px monospace';
    ctx.fillText('AUDIO', cx, 180);

    // Rows 0 (Music) and 1 (SFX)
    const audioRows = [
      { label: 'Music', track: GameState.audio.music },
      { label: 'SFX',   track: GameState.audio.sfx   },
    ];
    const rowY0 = 280, rowStep = 70;
    audioRows.forEach(({ label, track }, idx) => {
      const y        = rowY0 + idx * rowStep;
      const selected = idx === GameState.menuCursor;

      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(cx - 160, y - 28, 320, 42);
      }

      // Label
      ctx.fillStyle = selected ? '#f1c40f' : '#aaaaaa';
      ctx.font      = '18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText((selected ? '▶ ' : '  ') + label, cx - 150, y);

      // Volume bar (90 px wide)
      const barX = cx - 50, barY = y - 14, barW = 90, barH = 16;
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = track.muted ? '#555555' : '#3498db';
      ctx.fillRect(barX, barY, Math.round(barW * track.vol), barH);

      // Percentage or MUTED label
      ctx.fillStyle = selected ? '#f1c40f' : '#aaaaaa';
      ctx.font      = '14px monospace';
      ctx.fillText(track.muted ? 'MUTED' : Math.round(track.vol * 100) + '%', cx + 50, y);

      ctx.textAlign = 'center'; // restore
    });

    // Row 2: Back
    const backY        = rowY0 + 2 * rowStep;
    const backSelected = GameState.menuCursor === 2;
    if (backSelected) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(cx - 80, backY - 22, 160, 30);
      ctx.fillStyle = '#f1c40f';
    } else {
      ctx.fillStyle = '#888888';
    }
    ctx.font = '18px monospace';
    ctx.fillText((backSelected ? '▶ ' : '  ') + 'Back', cx, backY);

    ctx.fillStyle = '#555555';
    ctx.font      = '12px monospace';
    ctx.fillText('←→ volume  Space mute  ESC / Back to return', cx, 530);

    ctx.textAlign = 'left';
  }

  // ── GAME OVER screen ──────────────────────────────────────────────────────
  if (GameState.phase === GamePhase.GAMEOVER) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#e74c3c';
    ctx.font      = '32px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText('Score: ' + Math.floor(GameState.score) + ' pts', canvas.width / 2, 290);
    ctx.fillText('Best:  ' + Math.floor(GameState.highScore) + ' pts', canvas.width / 2, 320);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('Press ENTER to return to start', canvas.width / 2, 400);

    ctx.textAlign = 'left';
  }
}

// ── Camera ───────────────────────────────────────────────────────────────────
function updateCamera() {
  const SCROLL_THRESHOLD = canvas.height * 0.4; // 256px — player held at 40% from top

  // Scroll up: only update if player has climbed above the threshold (cameraY can only decrease)
  const newCameraY = player.y - SCROLL_THRESHOLD;
  if (newCameraY < GameState.cameraY) {
    GameState.cameraY = newCameraY;
  }

  // Camera-end clamp — applied UNCONDITIONALLY every frame so any past over-scroll
  // (older state, hazard-respawn artifact) is pulled back to the level-end sprite.
  // "Come back to end pos" semantics: if cat or camera ever went above the limit,
  // they snap back here next frame instead of staying stuck above the level.
  if (GameState.cameraEndY !== undefined && GameState.cameraY < GameState.cameraEndY) {
    GameState.cameraY = GameState.cameraEndY;
  }

  // Track maximum height reached (lower Y = higher in world — stores minimum Y value)
  if (player.y < GameState.maxHeightReached) {
    GameState.maxHeightReached = player.y;
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  resetPlatforms(); // pre-populate windowFloors so START screen shows L1 windows
  requestAnimationFrame(gameLoop);
});
