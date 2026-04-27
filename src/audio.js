/**
 * File:        audio.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-04-26
 * Updated:     2026-04-26
 *
 * Purpose:     HTMLAudio music + SFX system. Loads audio files from the
 *              local audio/ folder and plays them on demand. Compatible with
 *              file:// (USB stick) on both Firefox and Chromium-based browsers.
 *              Web Audio API is intentionally NOT used because Firefox blocks
 *              the XHR / fetch needed to load buffers from file://.
 * Depends on:  game-state.js (reads GameState.audio for volume + mute state)
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 */

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------
const _MS_PER_SECOND        = 1000;
const _FADE_STEP_COUNT      = 20;     // fadeOutMusic: number of volume steps
const _WASP_BUZZ_RANGE_PX   = 350;    // wasp buzz: silent beyond this distance
const _WASP_BUZZ_VOL_FRAC   = 0.55;   // wasp buzz: max fraction of sfx volume
const _HAZARD_AMB_VOL_FRAC  = 0.40;   // hazard ambient: fraction of sfx volume

// ---------------------------------------------------------------------------
// SOUNDS map — relative paths from index.html (project root).
// Plain string  → played from start, full length.
// Object form   → { path, start?, dur? } where start is a seek offset in seconds
//                 and dur cuts the playback short after dur seconds.
// ---------------------------------------------------------------------------
const SOUNDS = {
  // SFX — player
  jump:                'audio/sfx/player/jump.mp3',
  damage:              { path: 'audio/sfx/player/damage.mp3', start: 0.007, dur: 0.02 },
  land:                { path: 'audio/sfx/player/land.mp3',   start: 0.02 },
  balloon_collect:     'audio/sfx/player/balloon_collect.mp3',
  stomp_bounce:        'audio/sfx/player/stomp_bounce.mp3',
  respawn:             'audio/sfx/player/respawn.mp3',

  // SFX — UI
  game_over:           'audio/sfx/ui/game_over.mp3',
  level_complete:      'audio/sfx/ui/level_complete.mp3',
  menu_click:          'audio/sfx/ui/menu_click.mp3',     // Start button
  menu_nav:            'audio/sfx/ui/menu_nav.mp3',       // Arrow-key navigation
  countdown_tick:      { path: 'audio/sfx/ui/countdown_tick.mp3', volMul: 0.8 }, // baseline -20%

  // SFX — outro triggers
  windrad:             { path: 'audio/sfx/outro/windrad.mp3', volMul: 1.2 }, // baseline +20% — quiet source
  bell:                { path: 'audio/sfx/outro/bell.mp3',   dur: 0.15 },
  l3_lever:            'audio/sfx/outro/lever.mp3',
  water_drain:         'audio/sfx/outro/water_drain.mp3',     // L3 outro: post-lever water sound
  l1_outro_bubble:     'audio/sfx/outro/l1_outro_bubble.mp3', // L1 cough
  l2_outro_bubble:     'audio/sfx/outro/l2_outro_bubble.mp3', // L2 sigh
  l3_outro_bubble:     'audio/sfx/outro/l3_outro_bubble.mp3', // L3 meow

  // SFX — enemies
  wasp_sting:          'audio/sfx/enemies/wasp_sting.mp3',
  wasp_death:          { path: 'audio/sfx/enemies/wasp_death.mp3', start: 0.03 },
  wasp_buzz:           'audio/sfx/enemies/wasp_buzz.mp3',

  // SFX — hazards
  electricity_ambient: 'audio/sfx/hazards/electricity_ambient.mp3',
  flood_ambient:       'audio/sfx/hazards/flood_ambient.mp3',
  smog_ambient:        'audio/sfx/hazards/smog_ambient.mp3',

  // SFX — platforms
  crumble:             'audio/sfx/platforms/crumble.mp3',
  electro_crumble:     { path: 'audio/sfx/platforms/electro_crumble.mp3', volMul: 1.25 },

  // Music
  music_start:         { path: 'audio/music/start_screen.mp3', start: 0.036, dur: 1.2 },
  music_l1:            'audio/music/l1_city.mp3',
  music_l2:            { path: 'audio/music/l2_shaft.mp3', dur: 0.3 },
  music_l3:            { path: 'audio/music/l3_lighthouse.mp3', volMul: 0.75 },
  music_victory:       'audio/sfx/ui/victory.mp3',
};

// ---------------------------------------------------------------------------
// Preload cache — one HTMLAudio element per SFX key, loaded at startup.
// Music entries are excluded (large files, streamed on demand by playMusic).
// ---------------------------------------------------------------------------
const _audioCache = {};
(function _preloadSounds() {
  for (const [key, entry] of Object.entries(SOUNDS)) {
    if (key.startsWith('music_')) continue;
    const path = typeof entry === 'string' ? entry : entry.path;
    try {
      const a   = new Audio(path);
      a.preload = 'auto';
      _audioCache[key] = a;
    } catch (e) { /* silent fail — file missing */ }
  }
})();

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let _currentMusic = null;          // currently playing HTMLAudio music element
let _fadeInterval = null;          // setInterval handle for fadeOutMusic
const _activeSfx  = new Set();     // in-flight HTMLAudio elements — cleared by stopAllSfx()

// ---------------------------------------------------------------------------
// playSound(key)
// Plays a sound effect once via the preload cache. The same cache element is
// reused on every call, so a rapid re-trigger of the same key cuts off the
// previous play and restarts from the beginning. This is intentional for
// short sounds like jump, damage, land — each press is its own audible event.
// Silent fail if the key is missing, the file did not load, or the browser
// rejects the play() call (autoplay policy).
// ---------------------------------------------------------------------------
function playSound(key) {
  const entry = SOUNDS[key];
  if (!entry) return;
  const sfx = GameState.audio.sfx;
  if (sfx.muted) return;
  const start  = typeof entry === 'string' ? 0    : (entry.start  || 0);
  const dur    = typeof entry === 'string' ? null : (entry.dur    || null);
  const volMul = typeof entry === 'string' ? 1    : (entry.volMul || 1);
  const audio = _audioCache[key];
  if (!audio) return; // preload missed (file missing) — silent fail
  try {
    // Browser clamps audio.volume to [0, 1] automatically, so volMul > 1 only
    // boosts when sfx.vol is below 1.0 (i.e. when there is headroom).
    audio.volume = Math.min(1, sfx.vol * volMul);
    // Always reset currentTime, even when start is 0. Without this, calling
    // play() on an already-playing element is a no-op in some browsers
    // (Firefox in particular), so rapid re-presses would silently drop.
    audio.currentTime = start;
    if (audio._durTimer) { clearTimeout(audio._durTimer); audio._durTimer = null; }
    _activeSfx.add(audio);
    audio.play().catch(() => {});
    if (dur) {
      audio._durTimer = setTimeout(() => {
        audio._durTimer = null;
        try { audio.pause(); } catch (e) {}
        _activeSfx.delete(audio);
      }, dur * _MS_PER_SECOND);
    }
  } catch (e) {
    // Silent fail — browser restriction or missing file
  }
}

// ---------------------------------------------------------------------------
// playMusic(key)
// Starts a looping background music track. Stops any currently playing track
// first. Silent fail if the file is missing.
// ---------------------------------------------------------------------------
function playMusic(key) {
  stopMusic(); // always stop the current track before starting a new one
  const entry = SOUNDS[key];
  if (!entry) return;
  const path   = typeof entry === 'string' ? entry : entry.path;
  const start  = typeof entry === 'string' ? 0     : (entry.start  || 0);
  const dur    = typeof entry === 'string' ? null  : (entry.dur    || null);
  const volMul = typeof entry === 'string' ? 1     : (entry.volMul || 1);
  const m = GameState.audio.music;
  try {
    const audio  = new Audio(path);
    audio.loop   = true;
    audio.volume = m.muted ? 0 : Math.min(1, m.vol * volMul);
    if (start) audio.currentTime = start;
    audio.play().catch(() => {});
    if (dur) setTimeout(() => { if (_currentMusic === audio) stopMusic(); }, dur * _MS_PER_SECOND);
    _currentMusic = audio;
  } catch (e) {
    // Silent fail
  }
}

// ---------------------------------------------------------------------------
// stopMusic() — stops the current music track immediately.
// ---------------------------------------------------------------------------
function stopMusic() {
  if (_fadeInterval !== null) {
    clearInterval(_fadeInterval);
    _fadeInterval = null;
  }
  if (_currentMusic) {
    _currentMusic.pause();
    _currentMusic.currentTime = 0;
    _currentMusic = null;
  }
}

// ---------------------------------------------------------------------------
// stopAllSfx() — silences every in-flight SFX (e.g. on GAMEOVER).
// Does not affect music — use stopMusic() / fadeOutMusic() for that.
// ---------------------------------------------------------------------------
function stopAllSfx() {
  for (const a of _activeSfx) { try { a.pause(); } catch (e) {} }
  _activeSfx.clear();
}

// ---------------------------------------------------------------------------
// fadeOutMusic(durationMs) — fades the current track out, then stops it.
// No-op if no music is playing.
// ---------------------------------------------------------------------------
function fadeOutMusic(durationMs) {
  if (!_currentMusic) return;

  // Clear any existing fade so two fades cannot fight each other.
  if (_fadeInterval !== null) {
    clearInterval(_fadeInterval);
    _fadeInterval = null;
  }

  const stepMs    = Math.round(durationMs / _FADE_STEP_COUNT);
  const startVol  = _currentMusic.volume;
  const volStep   = startVol / _FADE_STEP_COUNT;
  const target    = _currentMusic; // capture in closure — current may change
  let   stepsDone = 0;

  _fadeInterval = setInterval(() => {
    stepsDone++;
    const newVol = Math.max(0, startVol - volStep * stepsDone);
    if (target === _currentMusic) {
      _currentMusic.volume = newVol;
    }
    if (stepsDone >= _FADE_STEP_COUNT) {
      clearInterval(_fadeInterval);
      _fadeInterval = null;
      stopMusic();
    }
  }, stepMs);
}

// ---------------------------------------------------------------------------
// updateAudioGains() — re-applies the music volume from GameState.audio.
// Called by start-screen.js after a music-slider or music-mute change.
// SFX volume is not buffered — it is read fresh on every playSound() call —
// so SFX changes take effect on the next sound played.
// ---------------------------------------------------------------------------
function updateAudioGains() {
  if (!_currentMusic) return;
  const m = GameState.audio.music;
  _currentMusic.volume = m.muted ? 0 : m.vol;
}

// ---------------------------------------------------------------------------
// unlockAudio() — no-op for HTMLAudio (kept for start-screen.js compatibility).
// HTMLAudio elements do not require an explicit unlock step. Web Audio API
// would, but is not used here.
// ---------------------------------------------------------------------------
function unlockAudio() {
  // No-op
}

// ---------------------------------------------------------------------------
// updateWaspBuzz(nearestDist) — proximity-driven wasp buzz layer.
// One looping HTMLAudio element. Volume is driven by the nearest alive wasp's
// distance: full at 0, silent at _WASP_BUZZ_RANGE_PX, quadratic in between.
// Pass null when no wasp is alive.
// ---------------------------------------------------------------------------
let _waspBuzzEl = null;

function updateWaspBuzz(nearestDist) {
  const sfx = GameState.audio.sfx;

  if (!_waspBuzzEl) {
    const path = typeof SOUNDS.wasp_buzz === 'string' ? SOUNDS.wasp_buzz : SOUNDS.wasp_buzz.path;
    try {
      _waspBuzzEl        = new Audio(path);
      _waspBuzzEl.loop   = true;
      _waspBuzzEl.volume = 0;
      _waspBuzzEl.play().catch(() => {});
    } catch (e) {
      _waspBuzzEl = null;
      return;
    }
  }

  if (sfx.muted || nearestDist === null) {
    _waspBuzzEl.volume = 0;
    return;
  }

  const proximity = Math.max(0, 1 - nearestDist / _WASP_BUZZ_RANGE_PX);
  const curved    = proximity * proximity; // quadratic — gentler at distance
  _waspBuzzEl.volume = sfx.vol * _WASP_BUZZ_VOL_FRAC * curved;

  // Retry play() every frame until the browser autoplay policy allows it.
  // Mirrors the same retry pattern in updateHazardAmbient. Without this, the
  // very first PLAYING entry can leave the buzz silent for the whole session
  // if the initial play() was rejected before the first user gesture.
  if (_waspBuzzEl.paused) _waspBuzzEl.play().catch(() => {});
}

// ---------------------------------------------------------------------------
// stopWaspBuzz() — stops the wasp buzz loop (call on phase exit from PLAYING).
// ---------------------------------------------------------------------------
function stopWaspBuzz() {
  if (_waspBuzzEl) {
    _waspBuzzEl.pause();
    _waspBuzzEl.currentTime = 0;
    _waspBuzzEl = null;
  }
}

// ---------------------------------------------------------------------------
// updateHazardAmbient(level, sfxState)
// Looping ambient track for the active level's hazard. Call every frame from
// main.js while PLAYING. Pass null when not in PLAYING.
// ---------------------------------------------------------------------------
let _hazardAmbEl  = null;
let _hazardAmbKey = null;

function updateHazardAmbient(level, sfxState) {
  const keyMap = { 1: 'smog_ambient', 2: 'electricity_ambient', 3: 'flood_ambient' };
  const key = keyMap[level];
  if (!key) return;

  if (_hazardAmbKey !== key || !_hazardAmbEl) {
    if (_hazardAmbEl) { _hazardAmbEl.pause(); _hazardAmbEl = null; }
    _hazardAmbKey = key;
    const entry = SOUNDS[key];
    const path  = typeof entry === 'string' ? entry : entry.path;
    try {
      _hazardAmbEl        = new Audio(path);
      _hazardAmbEl.loop   = true;
      _hazardAmbEl.volume = 0;
      _hazardAmbEl.play().catch(() => {});
    } catch (e) {
      _hazardAmbEl = null;
      return;
    }
  }

  if (!_hazardAmbEl) return;
  _hazardAmbEl.volume = sfxState.muted ? 0 : sfxState.vol * _HAZARD_AMB_VOL_FRAC;

  // Retry play() every frame until the browser autoplay policy allows it.
  // Needed for L1: the first PLAYING entry may precede the first canvas gesture.
  if (_hazardAmbEl.paused) _hazardAmbEl.play().catch(() => {});
}

// ---------------------------------------------------------------------------
// stopHazardAmbient() — stops hazard ambient loop (call on phase exit from PLAYING).
// ---------------------------------------------------------------------------
function stopHazardAmbient() {
  if (_hazardAmbEl) {
    _hazardAmbEl.pause();
    _hazardAmbEl.currentTime = 0;
    _hazardAmbEl = null;
  }
  _hazardAmbKey = null;
}
