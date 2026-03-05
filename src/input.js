// src/input.js
// Key-state map — polled every frame by update(); never drives logic directly
// No import/export — classic script tag; keys is a global.

const keys = {
  left:  false,
  right: false,
  shoot: false,
};

document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA': keys.left  = true;  break;
    case 'ArrowRight': case 'KeyD': keys.right = true;  break;
    case 'Space':                   keys.shoot = true;  break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowLeft':  case 'KeyA': keys.left  = false; break;
    case 'ArrowRight': case 'KeyD': keys.right = false; break;
    case 'Space':                   keys.shoot = false; break;
  }
});
