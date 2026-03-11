// src/input.js
// Key-state map — polled every frame by update(); never drives logic directly
// No import/export — classic script tag; keys is a global.

const keys = {
  left:  false,
  right: false,
  jump:  false,
  shoot: false,
  push:  false, // Phase 5: Z key — push/throw action
  enter: false,
};

document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA': keys.left  = true;  break;
    case 'ArrowRight': case 'KeyD': keys.right = true;  break;
    case 'Space':                   keys.jump  = true;  keys.shoot = true;  break;
    case 'KeyZ':                    keys.push  = true;  break;
    case 'Enter':                   keys.enter = true;  break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA': keys.left  = false; break;
    case 'ArrowRight': case 'KeyD': keys.right = false; break;
    case 'Space':                   keys.jump  = false; keys.shoot = false; break;
    case 'KeyZ':                    keys.push  = false; break;
    case 'Enter':                   keys.enter = false; break;
  }
});
