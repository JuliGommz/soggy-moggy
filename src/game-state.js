// src/game-state.js
// Shared game state — must be loaded FIRST (see index.html script order)
// No import/export — classic script tag; all symbols are global.

const GamePhase = Object.freeze({
  START:          'start',
  PLAYING:        'playing',
  LEVEL_COMPLETE: 'level_complete',
  GAMEOVER:       'gameover',
});

const GameState = {
  phase:            GamePhase.START,
  score:            0,
  lives:            3,
  cameraY:          0,
  maxHeightReached: 0,
  level:            1,
  highScore:        0,
  levelGoalY:       undefined,
};

function resetGame() {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.lives            = 3;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999; // sentinel: first frame will capture actual player.y
  GameState.level            = 1;
  // highScore is intentionally NOT reset — it persists across full game resets
  // levelGoalY is NOT reset here — it is set by generateLevelPlatforms() inside resetPlatforms()
  resetPlayer();
  resetPlatforms(); // Phase 2: defined in platforms.js (loaded after game-state.js — safe at runtime)
  resetHazard(1);   // level 1 hazard on full game reset — dispatches via water.js
}

function startNextLevel() {
  GameState.level           += 1;
  GameState.score            = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  GameState.phase            = GamePhase.PLAYING;
  // GameState.lives is intentionally NOT reset — lives persist across levels
  resetPlayer();
  resetPlatforms(); // also sets GameState.levelGoalY for the new level
  resetHazard(GameState.level); // reset hazard for new level; higher level = faster/harder
}

const HS_KEY = 'soggymoggy_highscore';

function loadHighScore() {
  try {
    const raw = localStorage.getItem(HS_KEY);
    GameState.highScore = raw !== null ? parseInt(raw, 10) : 0;
    if (isNaN(GameState.highScore)) GameState.highScore = 0;
  } catch (e) {
    GameState.highScore = 0; // graceful fallback for Firefox file:// and private mode
  }
}

function saveHighScore(score) {
  if (score > GameState.highScore) {
    GameState.highScore = score;
    try {
      localStorage.setItem(HS_KEY, String(score));
    } catch (e) {
      // Storage unavailable — silent fallback
    }
  }
}

loadHighScore();
