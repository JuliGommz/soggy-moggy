/*
====================================================================
* game-state.js - Shared game state, phase enum, score & high score
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-04
* Version: 1.3 - countdownTimer: 3s danger banner before hazard activates each level
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Object.freeze enum pattern for GamePhase state machine
* - localStorage high score with try/catch — graceful fallback
*   for Firefox file:// and private-mode environments
* - startNextLevel() structure: lives persist across levels,
*   score/camera reset, hazard speed scaling per level
*
* NOTES:
* - Must be loaded FIRST in index.html (all symbols are global)
* - No import/export — classic script tag pattern
* - levelGoalY is NOT reset in resetGame() — set by generateLevelPlatforms()
*
* VERSION HISTORY:
* - v1.0: Initial state object, GamePhase enum, resetGame()
* - v1.1: Added lives system, level field, score tracking
* - v1.2: Added startNextLevel(), localStorage high score (loadHighScore / saveHighScore)
* - v1.3: Added countdownTimer — 3s pre-hazard countdown banner; hazard gated in main.js update()
====================================================================
*/
// No import/export — classic script tag; all symbols are global.

const GamePhase = Object.freeze({
  START:          'start',
  DEV_SELECT:     'dev_select',
  DEV_BROWSE:     'dev_browse',     // free-camera level viewer: physics frozen, scroll with mouse wheel
  LEVEL_INTRO:    'level_intro',    // bubble shown before each level begins
  PLAYING:        'playing',
  PAUSED:         'paused',
  LEVEL_OUTRO:    'level_outro',    // bubble shown after finish-trigger, before LEVEL_COMPLETE menu
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
  devCursor:        1, // dev level selector cursor (1–3)
  highScore:        0,
  levelGoalY:       undefined,
  killBonus:        0,    // accumulated points from stomping wasps (+50 per kill)
  clearBonus:       0,    // +200 if all wasps in the level were defeated; 0 otherwise
  countdownTimer:   0,    // seconds remaining before hazard activates; 0 = hazard active
  menuCursor:       0,    // selected option index on PAUSED / LEVEL_COMPLETE screens
  finishState:      'idle',  // 'idle' | 'activating' | 'done'
  finishAnimTimer:  0,        // seconds remaining during finish activation animation
  finishTrigger:    null,     // { x, y, w, h } — set by generateLevelPlatforms()
};

function resetGame(startLevel = 1) {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.lives            = 3;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999; // sentinel: first frame will capture actual player.y
  GameState.level            = startLevel;
  GameState.countdownTimer   = 3;   // 3s danger countdown before hazard activates
  GameState.menuCursor       = 0;
  GameState.finishState      = 'idle';
  GameState.finishAnimTimer  = 0;
  // highScore is intentionally NOT reset — it persists across full game resets
  // levelGoalY and finishTrigger are NOT reset here — set by generateLevelPlatforms() inside resetPlatforms()
  resetPlayer();
  resetPlatforms(); // Phase 2: defined in platforms.js (loaded after game-state.js — safe at runtime)
  resetEnemies();   // clear enemy state before spawnEnemies() runs in main.js
  resetHazard(startLevel);
}

function startNextLevel() {
  GameState.level           += 1;
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  GameState.phase            = GamePhase.PLAYING;
  GameState.countdownTimer   = 3;   // fresh 3s countdown for each new level
  GameState.menuCursor       = 0;
  GameState.finishState      = 'idle';
  GameState.finishAnimTimer  = 0;
  // GameState.lives is intentionally NOT reset — lives persist across levels
  resetPlayer();
  resetPlatforms(); // also sets GameState.levelGoalY and finishTrigger for the new level
  resetEnemies();
  resetHazard(GameState.level); // reset hazard for new level; higher level = faster/harder
}

// Retry the current level — lives are preserved, score and camera reset.
function restartLevel() {
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999;
  GameState.phase            = GamePhase.PLAYING;
  GameState.countdownTimer   = 3;
  GameState.menuCursor       = 0;
  GameState.finishState      = 'idle';
  GameState.finishAnimTimer  = 0;
  // GameState.level and GameState.lives intentionally NOT changed
  resetPlayer();
  resetPlatforms();
  resetEnemies();
  resetHazard(GameState.level);
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
