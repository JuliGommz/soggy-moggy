/*
====================================================================
* main.js - Entry point: canvas, game loop, update, render
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
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
const _hudLifeIcon = new Image(); _hudLifeIcon.src = 'PixelArt/interactible_objects/live-up/cat_beishe.png';

// ── Balloon extra-life collectible ──────────────────────────────────────────
const _sprExtraLife = new Image(); _sprExtraLife.src = 'PixelArt/interactible_objects/live-up/extra-life.png';
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
  const levelHeight = 528 - GameState.levelGoalY;
  const frac        = 0.05 + Math.random() * 0.35;
  _balloon.spawnAtY = 528 - levelHeight * frac;
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

  // Paw zone: raised above player head (push_peak airborne) or extended forward (push_rise ground)
  // Covers ~40px above and across the player hitbox — reaches the plush cat when cat jumps up to it
  const pawX = player.x - 4;
  const pawY = player.y - 28;
  const pawW = player.w + 8;  // 40px
  const pawH = 40;

  const overlapX = pawX < plushX + _BAL_PLUSH.w && pawX + pawW > plushX;
  const overlapY = pawY < plushY + _BAL_PLUSH.h && pawY + pawH > plushY;
  if (overlapX && overlapY) {
    GameState.lives += 1;
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
      if (keys.enter) {
        keys.enter = false; // one-shot: prevent instant pass-through on next frame
        resetGame();
        resetBalloon(); // called after resetGame → resetPlatforms → finishTrigger is set
      }
      break;

    case GamePhase.PLAYING:
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

      // Score: height climbed this level (pixels above spawn point)
      GameState.score = Math.max(0, 528 - GameState.maxHeightReached);

      // Finish trigger: player must stand on finish platform and press Z (push key)
      if (GameState.finishState === 'idle' && GameState.finishTrigger) {
        const ft = GameState.finishTrigger;
        const overlapsX = player.x < ft.x + ft.w && player.x + player.w > ft.x;
        if (player.onGround && overlapsX && keys.push) {
          keys.push             = false;
          GameState.finishState = 'activating';
          GameState.finishAnimTimer = 1.5; // seconds of animation before level complete screen
        }
      }
      // Count down finish animation; transition to LEVEL_COMPLETE when done
      if (GameState.finishState === 'activating') {
        GameState.finishAnimTimer -= dt;
        if (GameState.finishAnimTimer <= 0) {
          saveHighScore(GameState.score);
          GameState.menuCursor = 0;
          keys.enter = false;
          keys.jump  = false;
          GameState.finishState = 'done';
          GameState.phase       = GamePhase.LEVEL_COMPLETE;
        }
      }

      // Fall-off-bottom: costs one life, respawns at camera top
      if (player.y > GameState.cameraY + canvas.height && hazard.iframeTimer <= 0) {
        takeDamage();
        player.y  = GameState.cameraY + 60; // respawn near top of camera view
        player.vy = JUMP_VELOCITY;           // auto-bounce on respawn
      }

      // Countdown: tick down; hazard only activates once timer expires
      if (GameState.countdownTimer > 0) {
        GameState.countdownTimer = Math.max(0, GameState.countdownTimer - dt);
      } else {
        updateHazard(dt);
      }
      break;

    case GamePhase.PAUSED:
      // ESC again = resume immediately
      if (keys.escape) { keys.escape = false; GameState.phase = GamePhase.PLAYING; break; }
      if (keys.menuUp)   { keys.menuUp   = false; GameState.menuCursor = (GameState.menuCursor + 3) % 4; }
      if (keys.menuDown) { keys.menuDown = false; GameState.menuCursor = (GameState.menuCursor + 1) % 4; }
      if (keys.enter) {
        keys.enter = false;
        switch (GameState.menuCursor) {
          case 0: GameState.phase = GamePhase.PLAYING; break; // Continuar
          case 1: restartLevel(); resetBalloon();      break; // Reiniciar nivel
          case 2: resetGame();    resetBalloon();      break; // Reiniciar juego
          case 3: GameState.phase = GamePhase.START;   break; // Menú principal
        }
      }
      break;

    case GamePhase.LEVEL_COMPLETE:
      if (keys.menuUp)   { keys.menuUp   = false; GameState.menuCursor = (GameState.menuCursor + 3) % 4; }
      if (keys.menuDown) { keys.menuDown = false; GameState.menuCursor = (GameState.menuCursor + 1) % 4; }
      if (keys.enter) {
        keys.enter = false;
        switch (GameState.menuCursor) {
          case 0: // Siguiente nivel — if on last level, go to start
            if (GameState.level < 3) { startNextLevel(); resetBalloon(); }
            else GameState.phase = GamePhase.START;
            break;
          case 1: restartLevel(); resetBalloon(); break; // Reiniciar nivel
          case 2: resetGame();    resetBalloon(); break; // Reiniciar juego
          case 3: GameState.phase = GamePhase.START; break; // Menú principal
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
  if (GameState.phase === GamePhase.PLAYING || GameState.phase === GamePhase.LEVEL_COMPLETE || GameState.phase === GamePhase.PAUSED) {
    renderPlatforms(ctx);  // draw platforms before player (player renders on top)
    renderBalloon(ctx);
    renderPlayer(ctx);
    if (GameState.finishTrigger) _renderFinishTrigger(ctx);
  }
  if (GameState.phase === GamePhase.PLAYING || GameState.phase === GamePhase.LEVEL_COMPLETE || GameState.phase === GamePhase.PAUSED) {
    renderHazard(ctx);
  }

  // 5. Exit world space
  ctx.restore();

  // 6. Draw HUD — ALWAYS in screen space (after ctx.restore)
  renderHUD();
}

// ── Finish trigger visual ────────────────────────────────────────────────────
// Called in world space (inside ctx.save/translate). Draws level-specific interactive
// object above the finish platform: L1 = pinwheel, L2 = bell, L3 = lever.
function _renderFinishTrigger(ctx) {
  const ft  = GameState.finishTrigger;
  const cx  = ft.x + ft.w / 2;
  const poleBaseY = ft.y; // top surface of the finish platform

  // Pole
  ctx.strokeStyle = '#888888';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.moveTo(cx, poleBaseY);
  ctx.lineTo(cx, poleBaseY - 52);
  ctx.stroke();
  ctx.lineWidth = 1;

  const pivotY = poleBaseY - 52;
  const t      = performance.now() / 1000;

  ctx.save();
  ctx.translate(cx, pivotY);

  if (GameState.level === 1) {
    // Pinwheel: 4 colored petals — spins slowly at idle, fast when activating
    const spinRate = GameState.finishState === 'activating' ? 7 : 0.8;
    ctx.rotate(t * spinRate);
    const petalColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = petalColors[i];
      ctx.fillRect(0, -5, 18, 10);
      ctx.rotate(Math.PI / 2);
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();

  } else if (GameState.level === 2) {
    // Bell: gentle sway at idle, vigorous ringing when activating
    const swingAmp = GameState.finishState === 'activating' ? 0.55 : 0.12;
    ctx.rotate(Math.sin(t * (GameState.finishState === 'activating' ? 8 : 1.5)) * swingAmp);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(0, 0, 14, Math.PI, 0);
    ctx.lineTo(14, 10); ctx.lineTo(-14, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d4ac0d';
    ctx.beginPath(); ctx.arc(0, 10, 14, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#888888'; // clapper
    ctx.beginPath(); ctx.arc(Math.sin(t * 6) * 7, 13, 3, 0, Math.PI * 2); ctx.fill();

  } else {
    // Lever: upright at idle, snapped forward when activating
    const leverAngle = GameState.finishState === 'activating' ? Math.PI / 3 : -Math.PI / 6;
    ctx.rotate(leverAngle);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-5, -28, 10, 28);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(0, -28, 7, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(-leverAngle);
    ctx.fillStyle = '#555555'; // lever base
    ctx.fillRect(-12, 0, 24, 7);
  }

  ctx.restore();

  // [Z] prompt — only shown when player is standing on the finish platform (idle state)
  if (GameState.finishState === 'idle') {
    const overlapsX = player.x < ft.x + ft.w && player.x + player.w > ft.x;
    if (player.onGround && overlapsX) {
      ctx.fillStyle = '#ffffff';
      ctx.font      = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[Z]', cx, poleBaseY - 68);
      ctx.textAlign = 'left';
    }
  }
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
    // Score and level — top-left
    ctx.fillStyle = '#ffffff';
    ctx.font      = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(GameState.score) + ' px', 8, 20);
    ctx.fillText('Level: ' + GameState.level, 8, 42);

    // Lives — top-right, cat icon repeated (max 9), right-to-left layout
    if (_hudLifeIcon.complete && _hudLifeIcon.naturalWidth > 0) {
      const icoW = 20, icoH = 16, gap = 2; // scaled from 64×64 source
      const maxShow = Math.min(GameState.lives, 9);
      for (let i = 0; i < maxShow; i++) {
        const ix = canvas.width - 8 - (i + 1) * (icoW + gap);
        ctx.drawImage(_hudLifeIcon, ix, 6, icoW, icoH);
      }
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
    ctx.fillText('¡PELIGRO!', canvas.width / 2, bannerY - 34);

    // Big countdown number
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '72px monospace';
    ctx.fillText(String(countdown), canvas.width / 2, bannerY + 42);

    ctx.textAlign = 'left'; // always reset
  }

  // ── START screen ─────────────────────────────────────────────────────────
  if (GameState.phase === GamePhase.START) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font      = '36px monospace';
    ctx.fillText('GATO SIN BOTAS', canvas.width / 2, 220);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('A / D or Arrow keys — move', canvas.width / 2, 300);
    ctx.fillText('Space or Left click — jump', canvas.width / 2, 325);
    ctx.fillText('Z or Right click — action', canvas.width / 2, 350);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('ENTER or click to start', canvas.width / 2, 420);

    ctx.textAlign = 'left'; // always reset after centered rendering
  }

  // ── LEVEL COMPLETE screen ─────────────────────────────────────────────────
  if (GameState.phase === GamePhase.LEVEL_COMPLETE) {
    const LEVEL_NAMES = ['', 'Stadt', 'Offener See', 'Aufzugschacht', 'Freizeitpark'];
    const cx = canvas.width / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = '#2ecc71';
    ctx.font      = '28px monospace';
    ctx.fillText('NIVEL ' + GameState.level + ' COMPLETADO', cx, 120);
    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '16px monospace';
    ctx.fillText(LEVEL_NAMES[GameState.level] || '', cx, 148);

    // Stats
    ctx.fillStyle = '#ffffff';
    ctx.font      = '16px monospace';
    ctx.fillText('Puntos: ' + Math.floor(GameState.score) + ' px', cx, 192);
    ctx.fillText('Mejor:  ' + Math.floor(GameState.highScore) + ' px', cx, 216);
    // Lives — cat icons
    ctx.fillText('Vidas:', cx - 36, 240);
    if (_hudLifeIcon.complete && _hudLifeIcon.naturalWidth > 0) {
      const icoW = 22, icoH = 18; // slightly larger for menu screen
      const maxShow = Math.min(GameState.lives, 9);
      for (let i = 0; i < maxShow; i++) {
        ctx.drawImage(_hudLifeIcon, cx + 14 + i * (icoW + 2), 226, icoW, icoH);
      }
    }

    // Menu options
    const option0 = GameState.level < 3 ? 'Siguiente nivel' : 'Ver puntuacion final';
    const options = [option0, 'Reiniciar nivel', 'Reiniciar juego', 'Menu principal'];
    const optY0   = 300;
    const optStep = 50;
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
    ctx.fillText('\u2191\u2193 navegar   ENTER confirmar', cx, 520);

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
    ctx.fillText('PAUSA', cx, 180);

    const options = ['Continuar', 'Reiniciar nivel', 'Reiniciar juego', 'Menu principal'];
    const optY0   = 270;
    const optStep = 55;
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

    ctx.fillStyle = '#555555';
    ctx.font      = '13px monospace';
    ctx.fillText('ESC reanudar   \u2191\u2193 navegar   ENTER confirmar', cx, 510);

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
    ctx.fillText('Score: ' + Math.floor(GameState.score) + ' px', canvas.width / 2, 290);
    ctx.fillText('Best:  ' + Math.floor(GameState.highScore) + ' px', canvas.width / 2, 320);

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

  // Track maximum height reached (lower Y = higher in world — stores minimum Y value)
  if (player.y < GameState.maxHeightReached) {
    GameState.maxHeightReached = player.y;
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  requestAnimationFrame(gameLoop);
});
