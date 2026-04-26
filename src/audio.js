/*
====================================================================
* audio.js - Web Audio API gain-node stub for music + sfx
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-26
* Version: 1.0 - AudioContext + musicGain/sfxGain stubs
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Lazy AudioContext init: browsers block AudioContext creation until a
*   user gesture, so we defer construction until the first slider interaction
* - Mute = gain.value = 0 without overwriting GameState.audio.*.vol so the
*   stored volume survives mute/unmute toggles
*
* NOTES:
* - Loads BEFORE main.js, AFTER game-state.js (reads GameState.audio)
* - Phase 6 will route real buffer sources through musicGain / sfxGain;
*   until then the gain nodes control silence
* - getMusicGain() / getSfxGain() exposed globally for Phase 6 audio code
====================================================================
*/

let _audioCtx   = null;
let _musicGain  = null;
let _sfxGain    = null;

function _ensureAudioContext() {
  if (_audioCtx) return _audioCtx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    _audioCtx  = new Ctor();
    _musicGain = _audioCtx.createGain();
    _sfxGain   = _audioCtx.createGain();
    _musicGain.connect(_audioCtx.destination);
    _sfxGain.connect(_audioCtx.destination);
    updateAudioGains();
  } catch (e) {
    _audioCtx = null;
  }
  return _audioCtx;
}

// Sync gain values from GameState.audio. Called by start-screen.js whenever
// a slider or mute toggle changes. Safe to call before AudioContext exists.
function updateAudioGains() {
  if (!_audioCtx) return;
  const m = GameState.audio.music;
  const s = GameState.audio.sfx;
  _musicGain.gain.value = m.muted ? 0 : m.vol;
  _sfxGain.gain.value   = s.muted ? 0 : s.vol;
}

// Phase 6 buffer sources connect to these. Lazy-init on first call.
function getMusicGain() { _ensureAudioContext(); return _musicGain; }
function getSfxGain()   { _ensureAudioContext(); return _sfxGain;   }

// Called by start-screen.js on the first user interaction to unlock the
// AudioContext (browser autoplay policy requires a user gesture).
function unlockAudio() {
  _ensureAudioContext();
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
}
