/*
====================================================================
* dialogue.js - Bubble overlay + lifecycle
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
*
* Bubbles are static PNGs with text already rendered inside them by Julian
* in Illustrator. No automatic text generation, no bitmap font, no atlas.
* This file only:
*   - loads the 8 dialogue bubble PNGs
*   - draws them centered on screen
*   - shows a clearly marked placeholder when a PNG is missing
*   - manages the overlay lifecycle (show / dismiss / auto-clear)
====================================================================
*/
// No runtime dependencies — pure screen-space overlay module.

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — DIALOGUE BUBBLE PNG LOADER
// ════════════════════════════════════════════════════════════════════════════

const _BUBBLE_KEYS = [
  'l1_intro', 'l2_intro', 'l3_intro',
  'l1_outro', 'l2_outro', 'l3_outro',
  'life_hazard', 'life_wasp',
];

const _bubbleSprites = {};
for (const key of _BUBBLE_KEYS) {
  const img = new Image();
  img.src = `PixelArt/thought_bubbles/dialogues/${key}.png`;
  _bubbleSprites[key] = img;
}

// Placeholder footprints (approximate target artboard sizes). Only used when
// the PNG is missing so the placeholder box approximates the final bubble area.
const _PLACEHOLDER_SIZE = {
  l1_intro:    { w: 240, h: 110 },
  l2_intro:    { w: 240, h: 110 },
  l3_intro:    { w: 240, h: 110 },
  l1_outro:    { w: 200, h: 110 },
  l2_outro:    { w: 240, h: 110 },
  l3_outro:    { w: 240, h: 240 },
  life_hazard: { w: 240, h: 240 },
  life_wasp:   { w: 240, h: 240 },
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — TRIGGER KEYS (which bubble shows when)
// ════════════════════════════════════════════════════════════════════════════

const _TRIGGER = {
  levelStart: [null, 'l1_intro', 'l2_intro', 'l3_intro'],
  levelEnd:   [null, 'l1_outro', 'l2_outro', 'l3_outro'],
  lifeLost:   { hazard: 'life_hazard', wasp: 'life_wasp' },
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Active overlay state + lifecycle
// ════════════════════════════════════════════════════════════════════════════

// _active = null (no overlay) | {
//   bubbleKey:   string                     — key into _bubbleSprites
//   kind:        'intro' | 'outro' | 'lifeLost'
//   blocking:    boolean                    — true → physics pause
//   dismissible: boolean                    — true → Space/click advances
//   duration:    number (seconds)           — 0 = wait for input; >0 = auto-clear
//   timer:       number                     — counts down to 0
//   readyTimer:  number                     — suppresses dismiss input briefly
//   onDismiss:   function (optional)        — called when overlay clears
// }
let _active = null;

function showLevelStart(level) {
  const bubbleKey = _TRIGGER.levelStart[level];
  if (!bubbleKey) return;
  _active = {
    bubbleKey,
    kind:        'intro',
    blocking:    true,
    dismissible: true,
    duration:    0,
    timer:       0,
    readyTimer:  0.15,
  };
}

function showLevelEnd(level, onDismiss) {
  const bubbleKey = _TRIGGER.levelEnd[level];
  if (!bubbleKey) return;
  _active = {
    bubbleKey,
    kind:        'outro',
    blocking:    true,
    dismissible: true,
    duration:    0,
    timer:       0,
    readyTimer:  0.15,
    onDismiss,
  };
}

function showLifeLost(cause) {
  const bubbleKey = _TRIGGER.lifeLost[cause] || _TRIGGER.lifeLost.hazard;
  _active = {
    bubbleKey,
    kind:        'lifeLost',
    blocking:    true,
    dismissible: false,
    duration:    1.2,
    timer:       1.2,
  };
}

function advanceDialogue() {
  if (!_active || !_active.dismissible) return false;
  if (_active.readyTimer && _active.readyTimer > 0) return false;
  const cb = _active.onDismiss;
  _active = null;
  if (typeof cb === 'function') cb();
  return true;
}

function updateDialogue(dt) {
  if (!_active) return;
  if (_active.readyTimer && _active.readyTimer > 0) {
    _active.readyTimer = Math.max(0, _active.readyTimer - dt);
  }
  if (_active.duration > 0) {
    _active.timer -= dt;
    if (_active.timer <= 0) {
      const cb = _active.onDismiss;
      _active = null;
      if (typeof cb === 'function') cb();
    }
  }
}

function isDialogueBlocking() {
  return _active !== null && _active.blocking === true;
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Rendering
// ════════════════════════════════════════════════════════════════════════════

// Screen-space draw. Caller must call AFTER ctx.restore() (i.e. outside world space).
function renderDialogue(ctx) {
  if (!_active) return;

  const canvasW = 480;
  const canvasH = 640;

  if (_active.kind !== 'lifeLost') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  const img    = _bubbleSprites[_active.bubbleKey];
  const hasImg = img && img.complete && img.naturalWidth > 0;

  let bw, bh, bx, by;

  if (hasImg) {
    bw = img.naturalWidth;
    bh = img.naturalHeight;
    bx = Math.round((canvasW - bw) / 2);
    by = Math.round((canvasH - bh) / 2 - 40);
    ctx.drawImage(img, bx, by, bw, bh);
  } else {
    // PLACEHOLDER — bubble PNG missing. Clearly marked so the gap is obvious.
    const hint = _PLACEHOLDER_SIZE[_active.bubbleKey] || { w: 240, h: 140 };
    bw = hint.w;
    bh = hint.h;
    bx = Math.round((canvasW - bw) / 2);
    by = Math.round((canvasH - bh) / 2 - 40);

    ctx.fillStyle = 'rgba(20, 20, 20, 0.88)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#ff4fff';
    ctx.lineWidth   = 3;
    ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
    ctx.setLineDash([]);

    ctx.fillStyle = '#ff4fff';
    ctx.font      = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PLACEHOLDER: ${_active.bubbleKey}.png`, bx + bw / 2, by + 20);
    ctx.textAlign = 'left';
  }

  if (_active.dismissible) {
    ctx.fillStyle = '#f1c40f';
    ctx.font      = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE or CLICK to continue]', canvasW / 2, canvasH - 30);
    ctx.textAlign = 'left';
  }
}
