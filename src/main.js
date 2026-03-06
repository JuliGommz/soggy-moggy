// src/main.js
// Entry point — canvas init, game loop, update dispatcher, render pass
// Depends on: GamePhase, GameState, resetGame (game-state.js)
//             keys (input.js)
//             player, updatePlayer, renderPlayer, resetPlayer (player.js)

// ── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
canvas.width  = 480; // set via JS attribute — NEVER via CSS
canvas.height = 640;
const ctx = canvas.getContext('2d', { alpha: false });

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
  switch (GameState.phase) {
    case GamePhase.START:
      if (keys.enter) {
        keys.enter = false; // one-shot: prevent instant pass-through on next frame
        resetGame();
      }
      break;

    case GamePhase.PLAYING:
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

      // Level goal reached?
      if (GameState.levelGoalY !== undefined && player.y <= GameState.levelGoalY) {
        saveHighScore(GameState.score);
        GameState.phase = GamePhase.LEVEL_COMPLETE;
      }

      // Fall-off-bottom: Phase 4 will replace with lives-- + respawn
      if (player.y > GameState.cameraY + canvas.height) {
        saveHighScore(GameState.score);
        GameState.phase = GamePhase.GAMEOVER;
      }

      // Phase 4 will add: updateWater(dt)
      break;

    case GamePhase.LEVEL_COMPLETE:
      if (keys.enter) {
        keys.enter = false; // one-shot
        startNextLevel();
      }
      break;

    case GamePhase.GAMEOVER:
      if (keys.enter) {
        keys.enter = false; // one-shot
        GameState.phase = GamePhase.START;
      }
      break;
  }
}

// ── Render pass ──────────────────────────────────────────────────────────────
function render() {
  // 1. Clear canvas (fillRect is faster than clearRect when alpha: false)
  ctx.fillStyle = '#87CEEB'; // sky blue — placeholder background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Enter world space — all entities use world coordinates
  ctx.save();
  ctx.translate(0, -GameState.cameraY); // cameraY is 0 in Phase 1; camera added in Phase 2

  // 3. Draw world-space objects
  if (GameState.phase === GamePhase.PLAYING || GameState.phase === GamePhase.LEVEL_COMPLETE) {
    renderPlatforms(ctx);  // draw platforms before player (player renders on top)
    renderPlayer(ctx);

    // Goal line: dashed yellow horizontal line at the level goal world Y
    if (GameState.levelGoalY !== undefined) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth   = 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(0,            GameState.levelGoalY);
      ctx.lineTo(canvas.width, GameState.levelGoalY);
      ctx.stroke();
      ctx.setLineDash([]); // reset dash to avoid affecting other renders
    }
  }
  // Phase 4 will add: renderWater(ctx)

  // 4. Exit world space
  ctx.restore();

  // 5. Draw HUD — ALWAYS in screen space (after ctx.restore)
  renderHUD();
}

function renderHUD() {
  // ── PLAYING: real-time score in top-left ─────────────────────────────────
  if (GameState.phase === GamePhase.PLAYING) {
    ctx.fillStyle = '#ffffff';
    ctx.font      = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + GameState.score + ' px', 8, 20);
    ctx.fillText('Level: ' + GameState.level, 8, 42);
  }

  // ── START screen ─────────────────────────────────────────────────────────
  if (GameState.phase === GamePhase.START) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font      = '36px monospace';
    ctx.fillText('SOGGY MOGGY', canvas.width / 2, 220);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Arrow keys or A / D to move', canvas.width / 2, 300);
    ctx.fillText('Reach the goal line to clear each level', canvas.width / 2, 325);
    ctx.fillText('Space mid-air for a boost — once per jump', canvas.width / 2, 350);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('Press ENTER to start', canvas.width / 2, 420);

    ctx.textAlign = 'left'; // always reset after centered rendering
  }

  // ── LEVEL COMPLETE screen ─────────────────────────────────────────────────
  if (GameState.phase === GamePhase.LEVEL_COMPLETE) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#2ecc71';
    ctx.font      = '32px monospace';
    ctx.fillText('LEVEL ' + GameState.level + ' CLEAR!', canvas.width / 2, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText('Score: ' + GameState.score + ' px', canvas.width / 2, 290);
    ctx.fillText('Best:  ' + GameState.highScore + ' px', canvas.width / 2, 320);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('Press ENTER to continue', canvas.width / 2, 400);

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
    ctx.fillText('Score: ' + GameState.score + ' px', canvas.width / 2, 290);
    ctx.fillText('Best:  ' + GameState.highScore + ' px', canvas.width / 2, 320);

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
