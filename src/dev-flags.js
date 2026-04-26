/*
====================================================================
* dev-flags.js - Global dev-tools state for in-game cheats / debug
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-26
* Version: 1.0 - Initial dev-flags object + seeded PRNG
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Mulberry32 PRNG (4 lines) for reproducible RNG_SEED runs
* - JSDoc typedef so each flag's shape + range is self-documenting
*
* NOTES:
* - Loads BEFORE game-state.js (no deps); read by main.js, player.js
* - All flags reset on page reload (intentional: dev tools are session-only)
* - rng() is the ONLY entry-point — call it instead of Math.random when
*   reproducible runs are needed (currently called by main.js spawn code)
====================================================================
*/

/**
 * @typedef {{
 *   startAtLevel:  number,   // 1-3, used by resetGame()
 *   dropHeightPct: number,   // 0-100, vertical spawn offset within level
 *   rngSeed:       string,   // '' = native Math.random, non-empty = seeded
 *   godMode:       boolean,  // disables damage + hazards
 *   infiniteLives: boolean,  // life counter never decrements
 *   gravityMul:    number,   // 0.0-3.0, multiplies GRAVITY constant
 *   timescale:     number,   // 0.1-2.0, multiplies dt in update()
 *   showHitboxes:  boolean,  // render collision rectangles
 *   showFps:       boolean,  // top-left FPS counter overlay
 * }} DevFlags
 */
const devFlags = {
  startAtLevel:  1,
  dropHeightPct: 0,
  rngSeed:       '',
  godMode:       false,
  infiniteLives: false,
  gravityMul:    1.0,
  timescale:     1.0,
  showHitboxes:  false,
  showFps:       false,
};

// Mulberry32: small, fast, good-enough seeded PRNG. Returns 0..1 like Math.random.
// Re-seeds whenever rngSeed changes; '' falls back to native Math.random.
let _rngState = 0;
let _rngSeedCache = null;

function _hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function rng() {
  if (devFlags.rngSeed === '') return Math.random();
  if (devFlags.rngSeed !== _rngSeedCache) {
    _rngSeedCache = devFlags.rngSeed;
    _rngState     = _hashSeed(devFlags.rngSeed);
  }
  let t = (_rngState += 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
  t ^= t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Reset PRNG state at the start of a fresh run so the same seed always
// produces the same sequence. Called by resetGame() in game-state.js.
function resetRng() {
  _rngSeedCache = null; // forces re-seed on next rng() call
}
