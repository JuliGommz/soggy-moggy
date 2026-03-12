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

      // Score: height climbed this level (pixels above spawn point)
      GameState.score = Math.max(0, 528 - GameState.maxHeightReached);

      if (GameState.levelGoalY !== undefined && player.y <= GameState.levelGoalY) {
        saveHighScore(GameState.score);
        GameState.menuCursor = 0;
        // Clear any held keys so the menu doesn't auto-confirm on the first frame
        keys.enter = false;
        keys.jump  = false;
        GameState.phase = GamePhase.LEVEL_COMPLETE;
      }

      // Fall-off-bottom: costs one life, respawns at camera top
      if (player.y > GameState.cameraY + canvas.height && water.iframeTimer <= 0) {
        takeDamage();
        player.y  = GameState.cameraY + 60; // respawn near top of camera view
        player.vy = JUMP_VELOCITY;           // auto-bounce on respawn
      }

      // Countdown: tick down; hazard only activates once timer expires
      if (GameState.countdownTimer > 0) {
        GameState.countdownTimer = Math.max(0, GameState.countdownTimer - dt);
      } else {
        updateWater(dt);
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
          case 1: restartLevel();                      break; // Reiniciar nivel
          case 2: resetGame();                         break; // Reiniciar juego
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
            if (GameState.level < 4) startNextLevel();
            else GameState.phase = GamePhase.START;
            break;
          case 1: restartLevel();                    break; // Reiniciar nivel
          case 2: resetGame();                       break; // Reiniciar juego
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
    renderPlayer(ctx);

    if (GameState.levelGoalY !== undefined) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth   = 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(0,            GameState.levelGoalY);
      ctx.lineTo(canvas.width, GameState.levelGoalY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  if (GameState.phase === GamePhase.PLAYING || GameState.phase === GamePhase.LEVEL_COMPLETE || GameState.phase === GamePhase.PAUSED) {
    renderWater(ctx);
  }

  // 5. Exit world space
  ctx.restore();

  // 6. Draw HUD — ALWAYS in screen space (after ctx.restore)
  renderHUD();
}

function renderHUD() {
  // ── Damage flash overlay — drawn first so it sits behind HUD text ──────────
  if (water.flashTimer > 0) {
    const alpha = (water.flashTimer / FLASH_DURATION) * 0.5; // 0.5 at peak, fades to 0
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

    // Hearts — top-right, rendered right-to-left so heart 1 is rightmost
    ctx.font      = '18px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < GameState.lives ? '#e74c3c' : '#444444'; // red = full, grey = empty
      ctx.fillText('\u2665', (canvas.width - 8) - i * 22, 20);
    }
    ctx.textAlign = 'left'; // always reset after right-aligned text
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
    // Lives
    ctx.fillText('Vidas: ', cx - 36, 240);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < GameState.lives ? '#e74c3c' : '#444444';
      ctx.fillText('\u2665', cx + 20 + i * 20, 240);
    }

    // Menu options
    const option0 = GameState.level < 4 ? 'Siguiente nivel' : 'Ver puntuacion final';
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
