/*
====================================================================
* input.js - Keyboard and mouse input state map
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-04
* Version: 1.3 - Left click also fires keys.enter (click-to-start on all menu screens)
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Key-state polling architecture: keys object polled per frame
*   rather than event-driven logic — prevents missed inputs
* - Mouse dual-mapping: left click = jump, right click = action (Z)
*
* NOTES:
* - keys object is global — polled by updatePlayer() and update() in main.js
* - keys.jump fires on Space/left-click
* - contextmenu suppressed so right-click can be used as game input
*
* VERSION HISTORY:
* - v1.0: Initial key map (left, right, jump, enter)
* - v1.1: Added push key (Z) for Phase 5 prep
* - v1.2: Added mouse support (left = jump, right = push)
* - v1.3: Left click fires keys.enter so START / LEVEL_COMPLETE / GAMEOVER screens respond to click
====================================================================
*/
// No import/export — classic script tag; keys is a global.

const keys = {
  left:     false,
  right:    false,
  jump:     false,
  push:     false,   // Phase 5: Z key — push/throw action
  enter:    false,
  menuUp:   false,   // ArrowUp   — menu navigation
  menuDown: false,   // ArrowDown — menu navigation
  escape:   false,   // Escape    — pause / resume
};

document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA': keys.left  = true;  break;
    case 'ArrowRight': case 'KeyD': keys.right = true;  break;
    case 'Space':                   keys.jump     = true;  break;
    case 'KeyZ':                    keys.push     = true;  break;
    case 'Enter':                   keys.enter    = true;  break;
    case 'ArrowUp':                 keys.menuUp   = true;  break;
    case 'ArrowDown':               keys.menuDown = true;  break;
    case 'Escape':                  keys.escape   = true;  break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA': keys.left     = false; break;
    case 'ArrowRight': case 'KeyD': keys.right    = false; break;
    case 'Space':                   keys.jump     = false; break;
    case 'KeyZ':                    keys.push     = false; break;
    case 'Enter':                   keys.enter    = false; break;
    case 'ArrowUp':                 keys.menuUp   = false; break;
    case 'ArrowDown':               keys.menuDown = false; break;
    case 'Escape':                  keys.escape   = false; break;
  }
});

// ── Mouse support ─────────────────────────────────────────────────────────────
// Left click = jump (same as Space), right click = push/action (same as Z)
document.addEventListener('contextmenu', (e) => e.preventDefault()); // suppress right-click menu

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) { keys.jump = true;  keys.enter = true; }  // left: jump + advance menus
  if (e.button === 2) { keys.push = true; }                                          // right: push/action
});

document.addEventListener('mouseup', (e) => {
  if (e.button === 0) { keys.jump = false; keys.enter = false; }
  if (e.button === 2) { keys.push = false; }
});

