/*
====================================================================
* audio.js - HTMLAudio music + SFX system (Firefox + Chromium safe)
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-26
* Version: 2.1 - HTMLAudio with preload cache + seek gate
*           (Web Audio v3.0 reverted: Firefox blocks XHR on file://)
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - HTMLAudio chosen over Web Audio API buffer sources: HTMLAudio loads
*   and plays reliably on file:// without CORS issues. Web Audio API
*   requires fetch() or XHR for buffer loading, which browsers block on
*   file:// — same reason Babel was removed from start-screen.js.
* - new Audio(path) per playSound() call: avoids the "can't replay a
*   sound that is already playing" problem that a single shared element
*   would cause for rapid-fire SFX (e.g. jump, damage).
* - fadeOutMusic via setInterval: no Web Audio API dependency needed;
*   steps volume down every 50ms until 0, then stopMusic().
* - Silent fail pattern: all .play() calls wrapped in try/catch so a
*   missing audio file never crashes the game loop.
*
* NOTES:
* - Loads AFTER game-state.js (reads GameState.audio) and BEFORE main.js.
* - updateAudioGains() and unlockAudio() signatures preserved so
*   start-screen.js keeps working without modification.
* - All playSound / playMusic calls in game files are guarded:
*   if (typeof playSound === 'function') playSound('key')
*   so the game runs even if this file fails to load.
*
* VERSION HISTORY:
* - v1.0: AudioContext + gain-node stubs (Phase 5 placeholder)
* - v2.0: Full HTMLAudio implementation: SOUNDS map, playSound,
*         playMusic, stopMusic, fadeOutMusic, updateAudioGains
====================================================================
*/

// ---------------------------------------------------------------------------
// SOUNDS map — relative paths from index.html (project root)
// ---------------------------------------------------------------------------
const SOUNDS = {
  // SFX — player
  jump:                'audio/sfx/player/jump.mp3',
  damage:              { path: 'audio/sfx/player/damage.mp3', start: 0.007,   dur: 0.02  },
  land:                { path: 'audio/sfx/player/land.mp3',  start: 0.02            },
  balloon_collect:     'audio/sfx/player/balloon_collect.mp3',
  stomp_bounce:        'audio/sfx/player/stomp_bounce.mp3',
  respawn:             'audio/sfx/player/respawn.mp3',
  // SFX — UI
  game_over:           'audio/sfx/ui/game_over.mp3',
  level_complete:      'audio/sfx/ui/level_complete.mp3',
  menu_click:          'audio/sfx/ui/menu_click.mp3',   // Start button only
  menu_nav:            'audio/sfx/ui/menu_nav.mp3',     // Arrow-key navigation
  countdown_tick:      'audio/sfx/ui/countdown_tick.mp3',
  // SFX — outro triggers
  windrad:             'audio/sfx/outro/windrad.mp3',
  bell:                { path: 'audio/sfx/outro/bell.mp3',                     dur: 0.15  },
  water_drain:         'audio/sfx/outro/water_drain.mp3',
  l1_outro_bubble:     'audio/sfx/outro/l1_outro_bubble.mp3', // L1 outro bubble (cough)
  l2_outro_bubble:     'audio/sfx/outro/l2_outro_bubble.mp3', // L2 outro bubble (sigh)
  l3_outro_bubble:     'audio/sfx/outro/l3_outro_bubble.mp3', // L3 outro bubble (meow)
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
  electro_crumble:     { path: 'audio/sfx/platforms/electro_crumble.mp3',     dur: 0.5   },
  // Music
  music_start:         { path: 'audio/music/start_screen.mp3', start: 0.036,  dur: 1.2   },
  music_l1:            'audio/music/l1_city.mp3',
  music_l2:            { path: 'audio/music/l2_shaft.mp3',                    dur: 0.3   },
  music_l3:            'audio/music/l3_lighthouse.mp3',
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
    } catch (e) {}
  }
})();

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let _currentMusic    = null;   // currently playing HTMLAudio music element
let _fadeInterval    = null;   // setInterval handle for fadeOutMusic
const _activeSfx     = new Set(); // in-flight HTMLAudio elements — cleared by stopAllSfx()

// ---------------------------------------------------------------------------
// playSound(key) — plays a SFX once via HTMLAudio
// Reuses the preloaded cache element. Rapid re-triggers cut off the previous
// play (acceptable for jump/land/damage). The seek is gated to avoid the
// seeking→seeked latency cycle when no offset is needed.
// ---------------------------------------------------------------------------
function playSound(key) {
  const entry = SOUNDS[key];
  if (!entry) return;
  const sfx   = GameState.audio.sfx;
  if (sfx.muted) return;
  const start = typeof entry === 'string' ? 0    : (entry.start || 0);
  const dur   = typeof entry === 'string' ? null : (entry.dur   || null);
  const audio = _audioCache[key];
  if (!audio) return; // preload missed (file missing) — silent fail
  try {
    audio.volume = sfx.vol;
    if (start > 0) audio.currentTime = start;
    if (audio._durTimer) { clearTimeout(audio._durTimer); audio._durTimer = null; }
    _activeSfx.add(audio);
    audio.play().catch(() => {});
    if (dur) {
      audio._durTimer = setTimeout(() => {
        audio._durTimer = null;
        try { audio.pause(); } catch (e) {}
        _activeSfx.delete(audio);
      }, dur * 1000);
    }
  } catch (e) {
    // Silent fail — browser restriction
  }
}

// ---------------------------------------------------------------------------
// playMusic(key) — starts a looping background music track
// Stops any currently playing track first. Silent fail if file is missing.
// ---------------------------------------------------------------------------
function playMusic(key) {
  stopMusic(); // always stop current track before starting a new one
  const entry = SOUNDS[key];
  if (!entry) return;
  const path  = typeof entry === 'string' ? entry : entry.path;
  const start = typeof entry === 'string' ? 0     : (entry.start || 0);
  const dur   = typeof entry === 'string' ? null  : (entry.dur   || null);
  const m = GameState.audio.music;
  try {
    const audio  = new Audio(path);
    audio.loop   = true;
    audio.volume = m.muted ? 0 : m.vol;
    if (start) audio.currentTime = start;
    audio.play().catch(() => {}); // silent fail
    if (dur) setTimeout(() => { if (_currentMusic === audio) stopMusic(); }, dur * 1000);
    _currentMusic = audio;
  } catch (e) {
    // Silent fail
  }
}

// ---------------------------------------------------------------------------
// stopMusic() — stops current music track immediately
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
// stopAllSfx() — immediately silences all in-flight SFX (e.g. on GAMEOVER).
// Does not affect music — use stopMusic() / fadeOutMusic() for that.
// ---------------------------------------------------------------------------
function stopAllSfx() {
  for (const a of _activeSfx) { try { a.pause(); } catch (e) {} }
  _activeSfx.clear();
}

// ---------------------------------------------------------------------------
// fadeOutMusic(durationMs) — fades out current track over durationMs, then stops
// If no music is playing, does nothing.
// ---------------------------------------------------------------------------
function fadeOutMusic(durationMs) {
  if (!_currentMusic) return;

  // Clear any existing fade so two fades don't fight each other
  if (_fadeInterval !== null) {
    clearInterval(_fadeInterval);
    _fadeInterval = null;
  }

  const steps      = 20;                         // number of volume steps
  const stepMs     = Math.round(durationMs / steps); // ms between steps
  const startVol   = _currentMusic.volume;
  const volStep    = startVol / steps;
  let   stepsDone  = 0;
  const target     = _currentMusic;              // capture in closure

  _fadeInterval = setInterval(() => {
    stepsDone++;
    const newVol = Math.max(0, startVol - volStep * stepsDone);
    if (target === _currentMusic) {
      _currentMusic.volume = newVol;
    }
    if (stepsDone >= steps) {
      clearInterval(_fadeInterval);
      _fadeInterval = null;
      stopMusic();
    }
  }, stepMs);
}

// ---------------------------------------------------------------------------
// updateAudioGains() — syncs live volume from GameState.audio
// Called by start-screen.js whenever a slider or mute toggle changes.
// Also updates _currentMusic volume if a track is already playing.
// ---------------------------------------------------------------------------
function updateAudioGains() {
  if (!_currentMusic) return;
  const m = GameState.audio.music;
  _currentMusic.volume = m.muted ? 0 : m.vol;
}

// ---------------------------------------------------------------------------
// unlockAudio() — no-op for HTMLAudio (kept for start-screen.js compatibility)
// ---------------------------------------------------------------------------
function unlockAudio() {
  // No-op — HTMLAudio does not require an explicit unlock step.
}

// ---------------------------------------------------------------------------
// updateWaspBuzz(nearestDist) — proximity-driven wasp buzz layer
// Single looping HTMLAudio element driven by the nearest alive wasp's distance.
// ---------------------------------------------------------------------------
const _WASP_BUZZ_RANGE = 350;  // px — fully silent beyond this distance
const _WASP_BUZZ_MAX   = 0.35; // fraction of sfx vol — subtlety ceiling

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

  const proximity = Math.max(0, 1 - nearestDist / _WASP_BUZZ_RANGE);
  const curved    = proximity * proximity;   // quadratic — gentler at distance
  _waspBuzzEl.volume = sfx.vol * _WASP_BUZZ_MAX * curved;
}

// ---------------------------------------------------------------------------
// stopWaspBuzz() — stops the wasp buzz loop (call on phase exit from PLAYING)
// ---------------------------------------------------------------------------
function stopWaspBuzz() {
  if (_waspBuzzEl) {
    _waspBuzzEl.pause();
    _waspBuzzEl.currentTime = 0;
    _waspBuzzEl = null;
  }
}
