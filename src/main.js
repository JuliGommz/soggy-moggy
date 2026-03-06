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
      // Any directional key starts the game
      if (keys.left || keys.right) resetGame();
      break;

    case GamePhase.PLAYING:
      updatePlayer(dt);
      updatePlatforms(dt);          // Phase 2: update platform state (no-op in Phase 2)
      checkPlatformCollisions();    // Phase 2: one-way landing detection + auto-bounce
      // updateCamera();            // Added in Plan 02-02
      // Phase 4 will add: updateWater(dt)
      break;

    case GamePhase.GAMEOVER:
      // Any directional key returns to start screen
      if (keys.left || keys.right) GameState.phase = GamePhase.START;
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
  if (GameState.phase === GamePhase.PLAYING) {
    renderPlatforms(ctx);  // draw platforms before player (player renders on top)
    renderPlayer(ctx);
  }
  // Phase 4 will add: renderWater(ctx)

  // 4. Exit world space
  ctx.restore();

  // 5. Draw HUD — ALWAYS in screen space (after ctx.restore)
  renderHUD();
}

function renderHUD() {
  ctx.fillStyle = '#000000';
  ctx.font      = '16px monospace';

  // Phase indicator — visible state machine debug info
  ctx.fillText('Phase: ' + GameState.phase, 8, 20);

  if (GameState.phase === GamePhase.START) {
    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText('SOGGY MOGGY', 160, 300);
    ctx.font = '14px monospace';
    ctx.fillText('Press Arrow / A-D to start', 110, 340);
  }

  if (GameState.phase === GamePhase.GAMEOVER) {
    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText('GAME OVER', 170, 300);
    ctx.font = '14px monospace';
    ctx.fillText('Press Arrow / A-D to restart', 105, 340);
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
