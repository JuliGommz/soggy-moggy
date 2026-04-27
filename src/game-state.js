/**
 * File:        game-state.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-03-04
 * Updated:     2026-04-26
 *
 * Purpose:     Central GameState object, GamePhase enum, difficulty table,
 *              level lifecycle helpers (resetGame / startNextLevel / restartLevel),
 *              and localStorage persistence for high score + start-screen prefs.
 * Depends on:  dev-flags.js (read indirectly via resetPlayer/resetPlatforms),
 *              and forward-declares resetPlayer / resetPlatforms / resetEnemies /
 *              resetHazard which are defined in later-loaded files. Those are
 *              only called at runtime, never at load, so the order is safe.
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 *
 * Notes:
 *   - levelGoalY is NOT reset in resetGame() — it is set by
 *     generateLevelPlatforms() inside resetPlatforms() during init.
 *   - GameState.lives is reset only when the difficulty changes (full reset),
 *     never on startNextLevel() or restartLevel().
 *   - High score persists across page reloads via localStorage. Falls back to
 *     0 silently if storage is unavailable (Firefox file:// private mode).
 */

// Frame-1 sentinel for maxHeightReached. Any value larger than the cat's spawn
// y guarantees the first update tick captures the real position.
const _MAX_HEIGHT_SENTINEL = 9999;

// Free-play seconds at the start of each level before the hazard activates.
const _HAZARD_COUNTDOWN_SEC = 2;

// ---------------------------------------------------------------------------
// Phases — each value drives a different update + render path in main.js.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Difficulty table — read once at run start, frozen per run.
// hazardMul     scales hazard.speed in resetHazard.
// waspMul       scales _WASP_COUNT[level] in spawnEnemies.
// cloudDriftMul scales CLOUD_DRIFT_BASE_PXS in updatePlatforms (L3 only).
//               0 disables cloud drift entirely.
// lives         starting life count for a fresh run.
// ---------------------------------------------------------------------------
const DIFFICULTY = Object.freeze({
  explorer:    { hazardMul: 0.80, waspMul: 0.60, cloudDriftMul: 0.00, lives: 5, label: 'Explorer'    },
  adventurer:  { hazardMul: 1.00, waspMul: 1.00, cloudDriftMul: 0.80, lives: 3, label: 'Adventurer'  },
  enlightened: { hazardMul: 1.25, waspMul: 1.30, cloudDriftMul: 1.40, lives: 2, label: 'Enlightened' },
});
const DIFFICULTY_ORDER = ['explorer', 'adventurer', 'enlightened'];

// ---------------------------------------------------------------------------
// GameState — the single source of truth for everything that changes per run.
// ---------------------------------------------------------------------------
const GameState = {
  phase:            GamePhase.START,
  difficulty:       'adventurer',   // 'explorer' | 'adventurer' | 'enlightened'
  score:            0,
  lives:            3,
  cameraY:          0,
  maxHeightReached: 0,
  level:            1,
  devCursor:        1,              // dev level selector cursor (1–3)
  highScore:        0,
  lastWasNewBest:   false,          // set by saveHighScore — true only on strictly-higher score
  levelGoalY:       undefined,
  killBonus:        0,              // +50 per stomped wasp, accumulated within a level
  clearBonus:       0,              // +200 if all wasps in the level were defeated; 0 otherwise
  countdownTimer:   0,              // seconds remaining before hazard activates; 0 = active
  introTimer:       0,              // counts down to 0 on LEVEL_INTRO; auto-advances at 0
  menuCursor:       0,              // selected option index on PAUSED / AUDIO_MENU / LEVEL_COMPLETE
  pausedGame:       false,          // true after navigating PAUSED → START; drives "▶ CONTINUE"
  audio: {
    music: { vol: 0.7, muted: false },  // music volume 0–1
    sfx:   { vol: 0.8, muted: false },  // sfx volume 0–1
  },
};

// ---------------------------------------------------------------------------
// Level lifecycle helpers
// ---------------------------------------------------------------------------

// Full reset for a fresh run. Restores lives, clears score, jumps to startLevel.
// High score is intentionally preserved.
function resetGame(startLevel = 1) {
  GameState.phase            = GamePhase.PLAYING;
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.lives            = DIFFICULTY[GameState.difficulty].lives;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = _MAX_HEIGHT_SENTINEL;
  GameState.level            = startLevel;
  GameState.countdownTimer   = _HAZARD_COUNTDOWN_SEC;
  GameState.menuCursor       = 0;
  GameState.pausedGame       = false;
  resetPlayer();
  resetPlatforms();
  resetEnemies();
  resetHazard(startLevel);
}

// Advance to the next level. Lives persist; score and camera reset.
function startNextLevel() {
  GameState.level           += 1;
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = _MAX_HEIGHT_SENTINEL;
  GameState.phase            = GamePhase.PLAYING;
  GameState.countdownTimer   = _HAZARD_COUNTDOWN_SEC;
  GameState.menuCursor       = 0;
  resetPlayer();
  resetPlatforms();
  resetEnemies();
  resetHazard(GameState.level);
}

// Retry the current level. Lives and level number are preserved, everything
// else resets.
function restartLevel() {
  GameState.score            = 0;
  GameState.killBonus        = 0;
  GameState.clearBonus       = 0;
  GameState.cameraY          = 0;
  GameState.maxHeightReached = _MAX_HEIGHT_SENTINEL;
  GameState.phase            = GamePhase.PLAYING;
  GameState.countdownTimer   = _HAZARD_COUNTDOWN_SEC;
  GameState.menuCursor       = 0;
  resetPlayer();
  resetPlatforms();
  resetEnemies();
  resetHazard(GameState.level);
}

// ---------------------------------------------------------------------------
// High-score persistence
// ---------------------------------------------------------------------------
const HS_KEY = 'soggymoggy_highscore';

function loadHighScore() {
  try {
    const raw = localStorage.getItem(HS_KEY);
    GameState.highScore = raw !== null ? parseInt(raw, 10) : 0;
    if (isNaN(GameState.highScore)) GameState.highScore = 0;
  } catch (e) {
    GameState.highScore = 0; // graceful fallback for Firefox file:// + private mode
  }
}

function saveHighScore(score) {
  if (score > GameState.highScore) {
    GameState.highScore      = score;
    GameState.lastWasNewBest = true;
    try {
      localStorage.setItem(HS_KEY, String(score));
    } catch (e) {
      // Storage unavailable — silent
    }
  } else {
    GameState.lastWasNewBest = false;  // ties or lower scores never qualify as "new best"
  }
}

loadHighScore();

// ---------------------------------------------------------------------------
// Start-screen preferences (difficulty + audio sliders/mutes)
// Persisted across reloads. Devflags are intentionally NOT persisted —
// they are session-only by design.
// ---------------------------------------------------------------------------
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
