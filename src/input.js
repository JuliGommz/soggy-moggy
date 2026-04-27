/**
 * File:        input.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-03-04
 * Updated:     2026-04-26
 *
 * Purpose:     Keyboard and mouse input state. Exposes a polled `keys` map
 *              consumed each frame by main.js / player.js, plus mouse position
 *              tracking for canvas-relative hit-testing on menu screens.
 * Depends on:  game-state.js (reads GameState.phase / GamePhase for dev-browse gate)
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 *
 * Bindings:
 *   ArrowLeft / A         → keys.left
 *   ArrowRight / D        → keys.right
 *   Space / left mouse    → keys.jump  (also keys.enter on left mouse)
 *   Z / right mouse       → keys.push  (action / interact)
 *   Enter                 → keys.enter
 *   ArrowUp / ArrowDown   → keys.menuUp / keys.menuDown
 *   Escape                → keys.escape (pause / resume)
 *   F2                    → keys.devBrowse (toggle dev free-camera)
 */

const keys = {
  left:      false,
  right:     false,
  jump:      false,
  push:      false,   // Z key — interact / action
  enter:     false,
  menuUp:    false,   // ArrowUp   — menu navigation
  menuDown:  false,   // ArrowDown — menu navigation
  escape:    false,   // Escape    — pause / resume
  devBrowse: false,   // F2 — toggle dev free-camera mode
};

// Mouse buttons (DOM MouseEvent.button)
const _MOUSE_LEFT  = 0;
const _MOUSE_RIGHT = 2;

// ---------------------------------------------------------------------------
// Mouse-wheel delta for DEV_BROWSE camera scroll. Consumed each frame by
// updateCamera() in main.js. The wheel listener is gated to DEV_BROWSE so
// it does not block native scrolling on DOM overlays (start screen, dev
// tools panel) at any other time.
// ---------------------------------------------------------------------------
let devWheelDelta = 0;
document.addEventListener('wheel', (e) => {
  if (typeof GameState !== 'undefined' && GameState.phase === GamePhase.DEV_BROWSE) {
    devWheelDelta += e.deltaY;
    e.preventDefault();
  }
}, { passive: false });

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------
// On German QWERTZ keyboards, the key labeled "Z" sits in the physical position
// that the US layout calls "KeyY" (Y and Z are swapped). KeyboardEvent.code
// reports the physical position regardless of layout, so we accept BOTH KeyZ
// and KeyY for the action key. This makes the action work on QWERTY (US/UK)
// and QWERTZ (German) keyboards alike.
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA':            keys.left      = true; break;
    case 'ArrowRight': case 'KeyD':            keys.right     = true; break;
    case 'Space':                              keys.jump      = true; break;
    case 'KeyZ':       case 'KeyY':            keys.push      = true; break;
    case 'Enter':                              keys.enter     = true; break;
    case 'ArrowUp':                            keys.menuUp    = true; break;
    case 'ArrowDown':                          keys.menuDown  = true; break;
    case 'Escape':                             keys.escape    = true; break;
    case 'F2':                                 keys.devBrowse = true; e.preventDefault(); break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA':            keys.left      = false; break;
    case 'ArrowRight': case 'KeyD':            keys.right     = false; break;
    case 'Space':                              keys.jump      = false; break;
    case 'KeyZ':       case 'KeyY':            keys.push      = false; break;
    case 'Enter':                              keys.enter     = false; break;
    case 'ArrowUp':                            keys.menuUp    = false; break;
    case 'ArrowDown':                          keys.menuDown  = false; break;
    case 'Escape':                             keys.escape    = false; break;
    case 'F2':                                 keys.devBrowse = false; break;
  }
});

// ---------------------------------------------------------------------------
// Mouse
// Left click  = jump (same as Space), also fires enter for menu screens.
// Right click = push/action (same as Z).
// lastMouseClientX/Y + mouseJustClicked let main.js do canvas-relative
// hit-testing on START / AUDIO_MENU difficulty rows and the Audio link.
// ---------------------------------------------------------------------------
let lastMouseClientX = -1;
let lastMouseClientY = -1;
let mouseJustClicked = false; // set true on left mousedown; consumed (set false) in update()

document.addEventListener('contextmenu', (e) => e.preventDefault()); // suppress right-click menu

document.addEventListener('mousedown', (e) => {
  if (e.button === _MOUSE_LEFT) {
    lastMouseClientX = e.clientX;
    lastMouseClientY = e.clientY;
    mouseJustClicked = true;
    keys.jump  = true;
    keys.enter = true;
  }
  if (e.button === _MOUSE_RIGHT) {
    keys.push = true;
  }
});

document.addEventListener('mouseup', (e) => {
  if (e.button === _MOUSE_LEFT)  { keys.jump = false; keys.enter = false; }
  if (e.button === _MOUSE_RIGHT) { keys.push = false; }
});
