/**
 * File:        dev-flags.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-04-26
 * Updated:     2026-04-26
 *
 * Purpose:     Session-only developer flags object for cheats and debug overlays.
 *              Mutated by the Dev Tools tab in start-screen.js, read by main.js,
 *              player.js, game-state.js. All flags reset on page reload.
 * Depends on:  (none — leaf module, loaded first)
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 */

/**
 * @typedef {{
 *   startAtLevel:  number,   // 1-3, used by resetGame()
 *   dropHeightPct: number,   // 0-100, vertical spawn offset within level
 *   godMode:       boolean,  // disables damage + hazards
 *   infiniteLives: boolean,  // life counter never decrements
 *   gravityMul:    number,   // 0.0-3.0, multiplies the GRAVITY constant
 *   timescale:     number,   // 0.1-2.0, multiplies dt in update()
 *   showHitboxes:  boolean,  // render collision rectangles
 *   showFps:       boolean,  // top-left FPS counter overlay
 * }} DevFlags
 */
const devFlags = {
  startAtLevel:  1,
  dropHeightPct: 0,
  godMode:       false,
  infiniteLives: false,
  gravityMul:    1.0,
  timescale:     1.0,
  showHitboxes:  false,
  showFps:       false,
};
