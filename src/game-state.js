/*
====================================================================
* game-state.js - Shared game state, phase enum, score & high score
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-04
* Version: 1.4 - AUDIO_MENU phase + GameState.audio (music/sfx vol+mute)
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
  AUDIO_MENU:     'audio_menu',     // standalone audio settings (opened from Start screen)
  LEVEL_OUTRO:    'level_outro',    // bubble shown after finish-trigger, before LEVEL_COMPLETE menu
  LEVEL_COMPLETE: 'level_complete',
  GAMEOVER:       'gameover',
});

// Global difficulty multipliers — read once at run start in resetGame, frozen per run.
// hazardMul scales hazard.speed in resetHazard; waspMul scales _WASP_COUNT[level] in spawnEnemies;
// cloudDriftMul scales CLOUD_DRIFT_BASE_PXS in updatePlatforms (L3 only). 0 disables drift entirely.
const DIFFICULTY = Object.freeze({
  explorer:    { hazardMul: 0.80, waspMul: 0.60, cloudDriftMul: 0.00, lives: 5, label: 'Explorer'    },
  adventurer:  { hazardMul: 1.00, waspMul: 1.00, cloudDriftMul: 0.80, lives: 3, label: 'Adventurer'  },
  enlightened: { hazardMul: 1.25, waspMul: 1.30, cloudDriftMul: 1.40, lives: 2, label: 'Enlightened' },
});
const DIFFICULTY_ORDER = ['explorer', 'adventurer', 'enlightened'];

const GameState = {
  phase:            GamePhase.START,
  difficulty:       'adventurer',   // 'explorer' | 'adventurer' | 'enlightened' — selected on START screen
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
  introTimer:       0,    // counts down 3→0 on the LEVEL_INTRO bubble screen; auto-advances at 0
  menuCursor:       0,    // selected option index on PAUSED / AUDIO_MENU / LEVEL_COMPLETE screens
  pausedGame:       false, // true when player navigated PAUSED → START; drives "▶ CONTINUE" vs "▶ START"
  audio: {
    music: { vol: 0.7, muted: false },  // music volume 0–1; muted = silence without losing vol level
    sfx:   { vol: 0.8, muted: false },  // sfx volume 0–1
  },
};

function resetGame(startLevel = 1) {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.lives            = DIFFICULTY[GameState.difficulty].lives;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = 9999; // sentinel: first frame will capture actual player.y
  GameState.level            = startLevel;
  GameState.countdownTimer   = 2;   // 2s free play after LEVEL_INTRO ends before hazard activates
  GameState.menuCursor       = 0;
  GameState.pausedGame       = false; // fresh run — start screen shows "▶ START" again
  // highScore is intentionally NOT reset — it persists across full game resets
  // levelGoalY is NOT reset here — set by generateLevelPlatforms() inside resetPlatforms()
  if (typeof resetRng === 'function') resetRng(); // re-seed PRNG for reproducible runs (dev-flags.js)
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
  GameState.countdownTimer   = 2;   // fresh hazard delay for each new level
  GameState.menuCursor       = 0;
  // GameState.lives is intentionally NOT reset — lives persist across levels
  resetPlayer();
  resetPlatforms(); // also sets GameState.levelGoalY for the new level
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
  GameState.countdownTimer   = 2;
  GameState.menuCursor       = 0;
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

// ── Start-screen preferences (difficulty + audio) ─────────────────────────
// Persisted across reloads. Devflags are intentionally NOT persisted (session-only).
const SM_PREFS_KEY = 'soggymoggy_prefs';

function loadStartScreenPrefs() {
  try {
    const raw = localStorage.getItem(SM_PREFS_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (p && typeof p === 'object') {
      if (DIFFICULTY[p.difficulty]) GameState.difficulty = p.difficulty;
      if (p.audio && p.audio.music) {
        if (typeof p.audio.music.vol   === 'number')  GameState.audio.music.vol   = Math.max(0, Math.min(1, p.audio.music.vol));
        if (typeof p.audio.music.muted === 'boolean') GameState.audio.music.muted = p.audio.music.muted;
      }
      if (p.audio && p.audio.sfx) {
        if (typeof p.audio.sfx.vol     === 'number')  GameState.audio.sfx.vol     = Math.max(0, Math.min(1, p.audio.sfx.vol));
        if (typeof p.audio.sfx.muted   === 'boolean') GameState.audio.sfx.muted   = p.audio.sfx.muted;
      }
    }
  } catch (e) {
    // Storage unavailable — silent fallback to defaults
  }
}

function saveStartScreenPrefs() {
  try {
    const p = {
      difficulty: GameState.difficulty,
      audio: {
        music: { vol: GameState.audio.music.vol, muted: GameState.audio.music.muted },
        sfx:   { vol: GameState.audio.sfx.vol,   muted: GameState.audio.sfx.muted   },
      },
    };
    localStorage.setItem(SM_PREFS_KEY, JSON.stringify(p));
  } catch (e) {
    // Storage unavailable — silent
  }
}

loadStartScreenPrefs();
