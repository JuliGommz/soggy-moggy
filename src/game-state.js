// src/game-state.js
// Shared game state — must be loaded FIRST (see index.html script order)
// No import/export — classic script tag; all symbols are global.

const GamePhase = Object.freeze({
  START:    'start',
  PLAYING:  'playing',
  GAMEOVER: 'gameover',
});

const GameState = {
  phase:            GamePhase.START,
  score:            0,
  lives:            3,
  cameraY:          0,
  maxHeightReached: 0,
};

function resetGame() {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.lives            = 3;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 0;
  resetPlayer(); // reset position — defined in player.js (loaded after game-state.js)
}
