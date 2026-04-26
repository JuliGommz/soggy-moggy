/*
====================================================================
* start-screen.js - React DOM overlay for GamePhase.START
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-26
* Version: 1.1 - JSX → React.createElement (file:// compatibility)
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - Ported from Visuals/ui/menus/start-screen-A.jsx (FlatLayoutB only;
*   all other layouts and dev variants stripped — design IS the spec)
* - DOM overlay over Canvas — chosen so CSS box-shadows / bevel effects /
*   Google fonts port 1:1 instead of being recreated in ctx.* draw calls
* - JSX converted to React.createElement so this file loads as a plain
*   <script src="..."> tag. Babel-standalone uses XHR for external src=,
*   which is blocked on file:// by browser CORS policy.
*
* NOTES:
* - Loaded as a regular <script src="..."> tag — no Babel, no XHR required
* - Depends on React + ReactDOM loaded before this file
* - Loads LAST in index.html; depends on GameState, devFlags, updateAudioGains,
*   unlockAudio, GamePhase, resetGame, saveStartScreenPrefs, HS_KEY
* - Mount via window.mountStartScreen(); unmount via window.unmountStartScreen()
*
* SECTION MAP (search for §-marker to jump):
*   § 1  Palette + font constants (PAL, PIXEL, PIXEL_BLOCK)
*   § 2  Primitives (PixelBtn, VolumeSlider, MoggyTitle)
*   § 3  Difficulty + Audio panels (DifficultyColumn, AudioFlatRow)
*   § 4  FlatLayoutB main layout (DEV chip, HI-SCORE, START, panels)
*   § 5  DevToolsOverlay + DevTabs + dev rows
*   § 6  StartScreen root + mount/unmount
====================================================================
*/

/* global React, ReactDOM, GameState, GamePhase, DIFFICULTY, DIFFICULTY_ORDER,
   devFlags, updateAudioGains, unlockAudio, saveStartScreenPrefs, resetGame,
   resetBalloon, resetOutroTrigger, spawnEnemies, showLevelStart, HS_KEY */

const { useState, useEffect, useRef } = React;
const ce = React.createElement; // shorthand so createElement calls stay readable

// ============================================================
// § 1  Palette + font constants
// ============================================================
const PAL = {
  navy:      '#1a2030',
  brickDark: '#4a221e',
  brick:     '#7a3a32',
  brickLite: '#9c4a3a',
  mortar:    '#2a1410',
  yellow:    '#ffd83d',
  yellowHi:  '#fff3a8',
  yellowDeep:'#e0a020',
  red:       '#c83020',
  redDark:   '#8a1a14',
  cream:     '#e8d8b8',
  paper:     '#f4ead0',
  ink:       '#1a1410',
  off:       '#e8e4d8',
  dim:       '#8a8478',
};

const PIXEL       = `'VT323', 'Courier New', monospace`;
const PIXEL_BLOCK = `'Press Start 2P', 'VT323', monospace`;

const INTENSITY = {
  green:   '#7ad04a', greenHi:  '#a8e87a',
  yellow:  PAL.yellow, yellowHi: PAL.yellowHi,
  red:     '#e84030', redHi:    '#ff8070',
};
function barColor(idx) {
  if (idx < 3) return { fill: INTENSITY.green,  hi: INTENSITY.greenHi };
  if (idx < 7) return { fill: INTENSITY.yellow, hi: INTENSITY.yellowHi };
  return         { fill: INTENSITY.red,    hi: INTENSITY.redHi };
}

// ============================================================
// § 2  Primitives
// ============================================================

function PixelBtn({ children, primary, big, huge, full, onClick, style: extraStyle = {} }) {
  const [hover, setHover]   = useState(false);
  const [active, setActive] = useState(false);
  const bg  = primary ? PAL.yellow : 'rgba(20,20,30,0.7)';
  const txt = primary ? PAL.ink    : PAL.off;
  const dims = huge
    ? { fontSize: 22, letterSpacing: 3, padding: '20px 60px' }
    : big
      ? { fontSize: 18, letterSpacing: 2, padding: '16px 24px' }
      : { fontSize: 13, letterSpacing: 1.5, padding: '10px 16px' };
  return ce('button', {
    onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => { setHover(false); setActive(false); },
    onMouseDown:  () => setActive(true),
    onMouseUp:    () => setActive(false),
    style: {
      fontFamily:    PIXEL_BLOCK,
      fontSize:      dims.fontSize,
      letterSpacing: dims.letterSpacing,
      padding:       dims.padding,
      background:    bg,
      color:         txt,
      border:        `3px solid ${PAL.ink}`,
      boxShadow:     active
        ? `inset 3px 3px 0 ${primary ? PAL.yellowDeep : 'rgba(0,0,0,0.6)'}, 0 0 0 2px ${PAL.ink}`
        : `inset -3px -3px 0 ${primary ? PAL.yellowDeep : 'rgba(0,0,0,0.6)'}, inset 3px 3px 0 ${primary ? PAL.yellowHi : 'rgba(255,255,255,0.1)'}, 0 4px 0 ${PAL.ink}, 0 6px 0 rgba(0,0,0,0.4)`,
      cursor:        'pointer',
      textTransform: 'uppercase',
      fontWeight:    900,
      width:         full ? '100%' : 'auto',
      transform:     active ? 'translateY(4px)' : (hover ? 'translateY(-1px)' : 'translateY(0)'),
      transition:    'transform 0.05s',
      position:      'relative',
      ...extraStyle,
    },
  }, children);
}

function VolumeSlider({ value, onChange, muted, max = 10 }) {
  const handleClick = (i) => {
    const target = (i + 1 === value) ? i : i + 1;
    onChange(target);
  };
  return ce('div', { style: { display: 'flex', gap: 2, alignItems: 'center' } },
    ...Array.from({ length: max }).map((_, i) => {
      const filled = i < value && !muted;
      const c = barColor(i);
      return ce('button', {
        key: i,
        onClick: () => handleClick(i),
        style: {
          width: 14, height: 18, padding: 0,
          background: filled ? c.fill : 'rgba(0,0,0,0.5)',
          border:     `2px solid ${PAL.ink}`,
          cursor:     'pointer',
          boxShadow:  filled ? `inset 1px 1px 0 ${c.hi}` : 'none',
          opacity:    muted ? 0.4 : 1,
        },
        'aria-label': `Set volume to ${i + 1}`,
      });
    })
  );
}

function MoggyTitle() {
  const canvasRef = useRef(null);
  const SCALE  = 0.44;
  const LINE_H = Math.ceil(147 * SCALE);
  const GAP    = 8;
  const CW     = 424;
  const CH     = LINE_H * 2 + GAP;

  useEffect(() => {
    let raf;
    const tryDraw = () => {
      const cv = canvasRef.current;
      if (!cv || typeof measureYellowText !== 'function') return;
      const w1 = measureYellowText('SOGGY', SCALE);
      if (!w1) { raf = requestAnimationFrame(tryDraw); return; }
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, CW, CH);
      const w2 = measureYellowText('MOGGY', SCALE);
      drawYellowText(ctx, 'SOGGY', Math.round((CW - w1) / 2), 0,            SCALE);
      drawYellowText(ctx, 'MOGGY', Math.round((CW - w2) / 2), LINE_H + GAP, SCALE);
    };
    tryDraw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return ce('canvas', {
    ref: canvasRef,
    width: CW,
    height: CH,
    style: { imageRendering: 'pixelated', display: 'block', userSelect: 'none' },
  });
}

// ============================================================
// § 3  Difficulty + Audio panels
// ============================================================

const DIFFICULTY_OPTIONS = [
  { id: 'explorer',    name: 'EXPLORER',    sub: "Just lookin'"    },
  { id: 'adventurer',  name: 'ADVENTURER',  sub: 'The sweet spot'  },
  { id: 'enlightened', name: 'ENLIGHTENED', sub: 'Ommm...'         },
];

function DifficultyColumn({ value, onChange, disabled = false }) {
  const current = DIFFICULTY_OPTIONS.find((o) => o.id === value);
  return ce('div', { style: { display: 'flex', flexDirection: 'column', gap: 4, opacity: disabled ? 0.55 : 1 } },
    ce('div', {
      style: {
        fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
        letterSpacing: 2, textAlign: 'center',
        textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
      },
    }, 'DIFFICULTY'),
    ce('div', { style: { display: 'flex', flexDirection: 'column', gap: 3, border: `3px solid ${PAL.ink}`, boxShadow: `0 3px 0 ${PAL.ink}` } },
      ...DIFFICULTY_OPTIONS.map((o, i) => {
        const sel = value === o.id;
        return ce('button', {
          key: o.id,
          onClick: () => !disabled && onChange(o.id),
          disabled,
          style: {
            padding: '5px 4px',
            background: sel ? PAL.yellow : 'rgba(20,16,12,0.75)',
            color: sel ? PAL.ink : PAL.cream,
            border: 'none',
            borderBottom: i < DIFFICULTY_OPTIONS.length - 1 ? `2px solid ${PAL.ink}` : 'none',
            fontFamily: PIXEL, fontSize: 12, letterSpacing: 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: sel ? 700 : 400,
            textShadow: sel ? 'none' : `1px 1px 0 ${PAL.ink}`,
            boxShadow: sel ? `inset 0 -2px 0 ${PAL.yellowDeep}, inset 0 2px 0 ${PAL.yellowHi}` : 'none',
          },
        }, o.name);
      })
    ),
    ce('div', {
      key: value,
      style: {
        fontFamily: PIXEL, fontSize: 12, marginTop: 2, textAlign: 'center',
        minHeight: 14, letterSpacing: 0.5, textShadow: `1px 1px 0 ${PAL.ink}`,
        animation: 'fadeIn 0.25s ease-out', lineHeight: 1.1,
      },
    },
      ce('span', { style: { color: '#7ad04a' } }, '→ '),
      ce('span', { style: { color: '#7ad04a' } }, current?.sub)
    )
  );
}

function AudioFlatRow({ label, icon, value, onChange, muted, onMuteToggle, labelWidth = 44 }) {
  const c = barColor(Math.max(0, value - 1));
  return ce('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
    ce('button', {
      onClick: onMuteToggle,
      style: {
        width: 22, height: 18, padding: 0,
        background: muted ? PAL.mortar : 'rgba(0,0,0,0.4)',
        border: `2px solid ${PAL.ink}`,
        color: muted ? '#e84030' : c.fill,
        fontFamily: PIXEL_BLOCK, fontSize: 10, cursor: 'pointer',
        textShadow: `1px 1px 0 ${PAL.ink}`,
        flexShrink: 0,
      },
      title: muted ? 'Unmute' : 'Mute',
    }, muted ? '✕' : icon),
    ce('span', {
      style: {
        fontFamily: PIXEL, fontSize: 13, color: muted ? PAL.dim : PAL.off,
        letterSpacing: 1.5, width: labelWidth, flexShrink: 0,
      },
    }, label),
    ce('div', { style: { flex: 1, minWidth: 0 } },
      ce(VolumeSlider, { value, onChange, muted, max: 10 })
    ),
    ce('span', {
      style: { fontFamily: PIXEL, fontSize: 12, color: PAL.dim, minWidth: 26, textAlign: 'right', flexShrink: 0 },
    }, muted ? 'OFF' : `${value * 10}%`)
  );
}

// ============================================================
// § 4  FlatLayoutB main layout
// ============================================================

function FlatLayoutB(p) {
  const [devHover, setDevHover] = useState(false);
  const devChipStyle = {
    position: 'absolute', bottom: 4, left: 14, zIndex: 3,
    fontFamily: PIXEL, fontSize: 14, letterSpacing: 2,
    color: devHover ? PAL.yellow : PAL.cream,
    opacity: devHover ? 1 : 0.9,
    background: 'rgba(20,16,12,0.8)',
    border: `2px solid ${PAL.ink}`,
    padding: '5px 10px',
    cursor: 'pointer',
    textShadow: `1px 1px 0 ${PAL.ink}`,
    boxShadow: `0 3px 0 ${PAL.ink}`,
  };
  return ce(React.Fragment, null,
    ce('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, background: 'linear-gradient(180deg, rgba(20,16,12,0.88) 0%, rgba(20,16,12,0.4) 70%, transparent 100%)', pointerEvents: 'none' } }),
    ce('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.65) 35%, rgba(20,16,12,0.95) 100%)', pointerEvents: 'none' } }),
    ce('div', { style: { position: 'absolute', top: 24, left: 28, right: 28, display: 'flex', justifyContent: 'center', zIndex: 2 } },
      ce(MoggyTitle, null)
    ),
    ce('button', {
      onClick: () => p.openDev && p.openDev(),
      onMouseEnter: () => setDevHover(true),
      onMouseLeave: () => setDevHover(false),
      style: devChipStyle,
      title: 'Open developer tools',
    }, '⚙ DEV TOOLS'),
    ce('div', {
      style: {
        position: 'absolute', bottom: 4, right: 14, zIndex: 3,
        background: 'rgba(20,16,12,0.92)',
        border: `2px solid ${PAL.ink}`,
        padding: '4px 10px 5px',
        boxShadow: `0 3px 0 ${PAL.ink}`,
        display: 'flex', alignItems: 'baseline', gap: 8,
      },
    },
      ce('span', {
        style: { fontFamily: PIXEL_BLOCK, fontSize: 9, color: PAL.yellow, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}` },
      }, 'HI-SCORE'),
      ce('span', {
        style: {
          fontFamily: PIXEL_BLOCK, fontSize: 14, color: PAL.cream, letterSpacing: 1,
          textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        },
      }, (p.highscore || 0).toLocaleString())
    ),
    ce('div', {
      style: { position: 'absolute', top: 340, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 },
    },
      ce(PixelBtn, { primary: true, huge: true, onClick: p.onStart },
        p.showPaused ? '▶ CONTINUE' : '▶ START'
      ),
      ce('div', {
        style: { textAlign: 'center', fontFamily: PIXEL, fontSize: 14, color: PAL.cream, opacity: 0.75, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}` },
      }, p.showPaused ? `[SPACE] · PAUSED · LEVEL ${p.levelNumber}` : '[SPACE] OR CLICK')
    ),
    ce('div', {
      style: { position: 'absolute', left: 14, right: 14, bottom: 34, display: 'flex', alignItems: 'stretch', gap: 10, zIndex: 2 },
    },
      ce('div', {
        style: { flex: 1, minWidth: 0, background: 'rgba(20,16,12,0.88)', border: `3px solid ${PAL.ink}`, boxShadow: `0 4px 0 ${PAL.ink}`, padding: '13px 10px 8px' },
      },
        ce(DifficultyColumn, { value: p.difficulty, onChange: p.setDifficulty, disabled: p.showPaused })
      ),
      ce('div', {
        style: { flex: 1, minWidth: 0, background: 'rgba(20,16,12,0.88)', border: `3px solid ${PAL.ink}`, boxShadow: `0 4px 0 ${PAL.ink}`, padding: '13px 10px 8px', display: 'flex', flexDirection: 'column', gap: 6 },
      },
        ce('div', {
          style: {
            fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow, letterSpacing: 2, textAlign: 'center',
            textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
          },
        }, 'AUDIO'),
        ce('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', flex: 1 } },
          ce(AudioFlatRow, { label: 'MUSIC', icon: '♪', value: p.musicVol, onChange: p.setMusicVol, muted: p.musicMute, onMuteToggle: p.toggleMusicMute, labelWidth: 44 }),
          ce(AudioFlatRow, { label: 'SFX',   icon: '✸', value: p.sfxVol,   onChange: p.setSfxVol,   muted: p.sfxMute,   onMuteToggle: p.toggleSfxMute,   labelWidth: 44 })
        )
      )
    )
  );
}

// ============================================================
// § 5  DevToolsOverlay + DevTabs + dev rows
// ============================================================

function DevToggle({ value, onChange }) {
  return ce('button', {
    onClick: () => onChange(!value),
    style: {
      width: 48, height: 22, padding: 0,
      background: value ? PAL.yellow : 'rgba(20,16,12,0.7)',
      color: value ? PAL.ink : PAL.dim,
      border: `2px solid ${PAL.ink}`,
      fontFamily: PIXEL_BLOCK, fontSize: 10, letterSpacing: 1,
      cursor: 'pointer',
      boxShadow: value ? `inset 0 -2px 0 ${PAL.yellowDeep}, inset 0 2px 0 ${PAL.yellowHi}` : 'none',
      textShadow: value ? 'none' : `1px 1px 0 ${PAL.ink}`,
      flexShrink: 0,
    },
  }, value ? 'ON' : 'OFF');
}

function DevSlider({ value, min, max, onChange }) {
  return ce('input', {
    type: 'range', min, max, value,
    onChange: (e) => onChange(parseInt(e.target.value, 10)),
    style: { flex: 1, minWidth: 60, accentColor: PAL.yellow, cursor: 'pointer' },
  });
}

function DevScrubber({ value, min, max, onChange }) {
  const cells = [];
  for (let i = min; i <= max; i++) {
    const sel    = i === value;
    const passed = i < value;
    cells.push(ce('button', {
      key: i,
      onClick: () => onChange(i),
      title: `Level ${i}`,
      style: {
        flex: 1, minWidth: 0, height: 22, padding: 0,
        background: sel ? PAL.yellow : 'rgba(20,16,12,0.7)',
        color: sel ? PAL.ink : passed ? PAL.yellowHi : PAL.dim,
        border: 'none',
        borderRight: i < max ? `1px solid ${PAL.ink}` : 'none',
        fontFamily: PIXEL, fontSize: 11,
        cursor: 'pointer',
        fontWeight: sel ? 700 : 400,
        boxShadow: sel ? `inset 0 -2px 0 ${PAL.yellowDeep}, inset 0 2px 0 ${PAL.yellowHi}` : 'none',
      },
    }, String(i)));
  }
  return ce('div', { style: { display: 'flex', flex: 1, minWidth: 0, border: `2px solid ${PAL.ink}`, boxShadow: `0 2px 0 ${PAL.ink}` } },
    ...cells
  );
}

function DevTextInput({ value, onChange, placeholder }) {
  return ce('input', {
    type: 'text', value, placeholder,
    onChange: (e) => onChange(e.target.value),
    style: {
      flex: 1, minWidth: 0,
      background: 'rgba(0,0,0,0.45)',
      border: `2px solid ${PAL.ink}`,
      color: PAL.cream,
      fontFamily: PIXEL, fontSize: 14, letterSpacing: 2,
      padding: '4px 8px',
      outline: 'none',
      textShadow: `1px 1px 0 ${PAL.ink}`,
    },
  });
}

function DevButton({ label, danger, onClick }) {
  const [hover, setHover] = useState(false);
  return ce('button', {
    onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: danger ? (hover ? '#e84030' : 'rgba(232,64,48,0.25)') : (hover ? 'rgba(40,32,24,0.85)' : 'rgba(20,16,12,0.7)'),
      color: PAL.cream,
      border: `2px solid ${danger ? '#e84030' : PAL.ink}`,
      fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
      padding: '6px 10px',
      cursor: 'pointer',
      boxShadow: `0 2px 0 ${PAL.ink}`,
      textShadow: `1px 1px 0 ${PAL.ink}`,
    },
  }, label);
}

function DevRow({ opt }) {
  const labelEl = ce('div', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
    ce('span', {
      style: { fontFamily: PIXEL, fontSize: 14, color: PAL.cream, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}`, lineHeight: 1.1 },
    }, opt.label),
    opt.sub && ce('span', {
      style: { fontFamily: PIXEL, fontSize: 12, color: PAL.dim, letterSpacing: 1, lineHeight: 1.1 },
    }, opt.sub)
  );
  let control;
  if (opt.kind === 'toggle') {
    control = ce(DevToggle, { value: opt.value, onChange: opt.set });
  } else if (opt.kind === 'slider') {
    control = ce('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 } },
      ce(DevSlider, { value: opt.value, min: opt.min, max: opt.max, onChange: opt.set }),
      ce('span', {
        style: { fontFamily: PIXEL, fontSize: 13, color: PAL.yellow, minWidth: 44, textAlign: 'right', textShadow: `1px 1px 0 ${PAL.ink}` },
      }, opt.format ? opt.format(opt.value) : opt.value)
    );
  } else if (opt.kind === 'scrubber') {
    control = ce('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 } },
      ce(DevScrubber, { value: opt.value, min: opt.min, max: opt.max, onChange: opt.set }),
      ce('span', {
        style: { fontFamily: PIXEL, fontSize: 13, color: PAL.yellow, minWidth: 50, textAlign: 'right', textShadow: `1px 1px 0 ${PAL.ink}` },
      }, opt.format ? opt.format(opt.value) : opt.value)
    );
  } else if (opt.kind === 'text') {
    control = ce(DevTextInput, { value: opt.value, onChange: opt.set, placeholder: opt.placeholder });
  } else if (opt.kind === 'button') {
    control = ce(DevButton, { label: opt.btnLabel || 'RUN', danger: opt.danger, onClick: opt.onClick });
  }
  return ce('div', { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', minWidth: 0 } },
    ce('div', { style: { width: 130, flexShrink: 0 } }, labelEl),
    ce('div', { style: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 } }, control)
  );
}

function DevTabs({ options }) {
  const [tab, setTab] = useState('start');
  const tabs = [
    { id: 'start',  label: 'START'  },
    { id: 'player', label: 'PLAYER' },
    { id: 'visual', label: 'VISUAL' },
  ];
  return ce('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } },
    ce('div', { style: { display: 'flex', borderBottom: `3px solid ${PAL.ink}`, marginTop: 20 } },
      ...tabs.map((t, i) => {
        const sel = tab === t.id;
        return ce('button', {
          key: t.id,
          onClick: () => setTab(t.id),
          style: {
            flex: 1, padding: '8px 4px',
            background: sel ? PAL.yellow : 'rgba(140,135,125,0.45)',
            color: sel ? PAL.ink : PAL.cream,
            border: 'none',
            borderRight: i < tabs.length - 1 ? `2px solid ${PAL.ink}` : 'none',
            fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
            cursor: 'pointer',
            textShadow: sel ? 'none' : `1px 1px 0 ${PAL.ink}`,
            boxShadow: sel ? `inset 0 -3px 0 ${PAL.yellowDeep}, inset 0 3px 0 ${PAL.yellowHi}` : 'none',
          },
        }, t.label);
      })
    ),
    ce('div', { style: { padding: '33px 14px 8px', overflow: 'auto', flex: 1 } },
      ...options[tab].map((opt, i) => ce(DevRow, { key: i, opt }))
    )
  );
}

function DevToolsOverlay({ onClose, onResetHighscore, onUnlockLevels }) {
  const [floor,    setFloor]    = useState(devFlags.startAtLevel);
  const [startY,   setStartY]   = useState(devFlags.dropHeightPct);
  const [seed,     setSeed]     = useState(devFlags.rngSeed);
  const [god,      setGod]      = useState(devFlags.godMode);
  const [infLives, setInfLives] = useState(devFlags.infiniteLives);
  const [grav10,   setGrav10]   = useState(Math.round(devFlags.gravityMul * 10));
  const [time10,   setTime10]   = useState(Math.round(devFlags.timescale  * 10));
  const [hitboxes, setHitboxes] = useState(devFlags.showHitboxes);
  const [fps,      setFps]      = useState(devFlags.showFps);
  const [flash,    setFlash]    = useState('');

  useEffect(() => { devFlags.startAtLevel  = floor;       }, [floor]);
  useEffect(() => { devFlags.dropHeightPct = startY;      }, [startY]);
  useEffect(() => { devFlags.rngSeed       = seed;        }, [seed]);
  useEffect(() => { devFlags.godMode       = god;         }, [god]);
  useEffect(() => { devFlags.infiniteLives = infLives;    }, [infLives]);
  useEffect(() => { devFlags.gravityMul    = grav10 / 10; }, [grav10]);
  useEffect(() => { devFlags.timescale     = time10 / 10; }, [time10]);
  useEffect(() => { devFlags.showHitboxes  = hitboxes;    }, [hitboxes]);
  useEffect(() => { devFlags.showFps       = fps;         }, [fps]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const TOTAL_LEVELS = 3;

  const handleReset = () => {
    onResetHighscore();
    setFlash('✓ HIGHSCORE WIPED');
    setTimeout(() => setFlash(''), 1400);
  };
  const handleUnlock = () => {
    onUnlockLevels();
    setFlash('✓ ALL LEVELS UNLOCKED');
    setTimeout(() => setFlash(''), 1400);
  };

  const allOptions = {
    start: [
      { kind: 'scrubber', label: 'START AT LEVEL',  value: floor,  set: setFloor,  min: 1, max: TOTAL_LEVELS, format: (v) => `${v} / ${TOTAL_LEVELS}` },
      { kind: 'slider',   label: 'DROP HEIGHT (Y)', value: startY, set: setStartY, min: 0, max: 100, format: (v) => `${v}%`, sub: 'Where the cat spawns within the level' },
      { kind: 'text',     label: 'RNG SEED',        value: seed,   set: setSeed,   placeholder: 'leave blank for random', sub: 'Reproduce the same run for testing' },
    ],
    player: [
      { kind: 'toggle', label: 'GOD MODE',          value: god,      set: setGod,      sub: 'No fall damage · No hazards' },
      { kind: 'toggle', label: 'INFINITE LIVES',    value: infLives, set: setInfLives, sub: "Lives don't decrement"        },
      { kind: 'slider', label: 'GRAVITY',           value: grav10,   set: setGrav10,   min: 0, max: 30, format: (v) => `${(v / 10).toFixed(1)}×` },
      { kind: 'slider', label: 'TIME SCALE',        value: time10,   set: setTime10,   min: 1, max: 20, format: (v) => `${(v / 10).toFixed(1)}×` },
      { kind: 'button', label: 'UNLOCK ALL LEVELS', btnLabel: 'UNLOCK', onClick: handleUnlock, sub: 'Mark all levels as cleared in save data' },
      { kind: 'button', label: 'RESET HIGHSCORE',   btnLabel: 'WIPE',   danger: true, onClick: handleReset, sub: 'Clears the saved best score' },
    ],
    visual: [
      { kind: 'toggle', label: 'SHOW HITBOXES', value: hitboxes, set: setHitboxes, sub: 'Render collision shapes' },
      { kind: 'toggle', label: 'SHOW FPS',      value: fps,      set: setFps,      sub: 'Frame counter top-left'  },
    ],
  };

  const _overlayBtn = {
    position: 'absolute',
    background: 'rgba(20,16,12,0.85)',
    border: `3px solid ${PAL.ink}`,
    boxShadow: `0 3px 0 ${PAL.ink}`,
    color: PAL.cream,
    fontFamily: PIXEL_BLOCK,
    letterSpacing: 2,
    cursor: 'pointer',
    zIndex: 4,
    textShadow: `1px 1px 0 ${PAL.ink}`,
  };

  return ce('div', {
    style: { position: 'absolute', inset: 0, background: 'rgba(20,16,12,0.55)', zIndex: 5, display: 'flex', flexDirection: 'column' },
  },
    ce('button', { onClick: onClose, title: 'Close',
      style: { ..._overlayBtn, top: 14, right: 14, width: 35, height: 35, padding: 0, fontSize: 16 },
    }, '✕'),
    ce('button', { onClick: onClose, title: 'Close dev tools',
      style: { ..._overlayBtn, bottom: 14, right: 14, padding: '6px 14px', fontSize: 12 },
    }, 'CLOSE'),
    ce('div', { style: { paddingTop: 24, paddingBottom: 6, display: 'flex', justifyContent: 'center' } },
      ce(MoggyTitle, null)
    ),
    ce('div', { style: { paddingTop: 59, paddingBottom: 10 } },
      ce('div', {
        style: {
          fontFamily: PIXEL_BLOCK, fontSize: 18, color: PAL.yellow,
          letterSpacing: 4, textAlign: 'center', lineHeight: 1.2, padding: '0 8px',
          textShadow: `2px 2px 0 ${PAL.red}, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}, 1px 1px 0 ${PAL.ink}`,
        },
      }, 'DEV TOOLS')
    ),
    ce('div', {
      style: {
        flex: 1, minHeight: 0, overflow: 'hidden',
        margin: '0 14px 14px',
        background: 'rgba(20,16,12,0.92)',
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 4px 0 ${PAL.ink}`,
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      },
    },
      ce(DevTabs, { options: allOptions }),
      flash && ce('div', {
        style: {
          position: 'absolute', bottom: 50, left: 14, right: 14,
          background: 'rgba(46,204,113,0.92)',
          border: `2px solid ${PAL.ink}`,
          color: PAL.ink,
          fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
          padding: '8px 12px', textAlign: 'center',
          boxShadow: `0 3px 0 ${PAL.ink}`,
          animation: 'fadeIn 0.2s ease-out',
        },
      }, flash)
    )
  );
}

// ============================================================
// § 6  StartScreen root + mount/unmount
// ============================================================

const _BG_IMG_SRC = 'Visuals/ui/menus/assets/bg-tumble.png';

const volTo10  = (v) => Math.max(0, Math.round(v * 10));
const _10ToVol = (n) => Math.max(0, Math.min(1, n / 10));

function StartScreen() {
  const [difficulty, setDifficulty] = useState(GameState.difficulty);
  const [musicVol,   setMusicVolN]  = useState(volTo10(GameState.audio.music.vol));
  const [musicMute,  setMusicMute]  = useState(GameState.audio.music.muted);
  const [sfxVol,     setSfxVolN]    = useState(volTo10(GameState.audio.sfx.vol));
  const [sfxMute,    setSfxMute]    = useState(GameState.audio.sfx.muted);
  const [highscore,  setHighscore]  = useState(GameState.highScore);
  const [devOpen,    setDevOpen]    = useState(false);

  const showPaused  = GameState.pausedGame;
  const levelNumber = GameState.level;

  const ensureUnlocked = () => { if (typeof unlockAudio === 'function') unlockAudio(); };

  const onChangeDifficulty = (id) => {
    if (showPaused) return;
    GameState.difficulty = id;
    setDifficulty(id);
    saveStartScreenPrefs();
  };

  const onChangeMusicVol = (n) => {
    ensureUnlocked();
    GameState.audio.music.vol = _10ToVol(n);
    setMusicVolN(n);
    if (typeof updateAudioGains === 'function') updateAudioGains();
    saveStartScreenPrefs();
  };
  const onToggleMusicMute = () => {
    ensureUnlocked();
    const next = !GameState.audio.music.muted;
    GameState.audio.music.muted = next;
    setMusicMute(next);
    if (typeof updateAudioGains === 'function') updateAudioGains();
    saveStartScreenPrefs();
  };
  const onChangeSfxVol = (n) => {
    ensureUnlocked();
    GameState.audio.sfx.vol = _10ToVol(n);
    setSfxVolN(n);
    if (typeof updateAudioGains === 'function') updateAudioGains();
    saveStartScreenPrefs();
  };
  const onToggleSfxMute = () => {
    ensureUnlocked();
    const next = !GameState.audio.sfx.muted;
    GameState.audio.sfx.muted = next;
    setSfxMute(next);
    if (typeof updateAudioGains === 'function') updateAudioGains();
    saveStartScreenPrefs();
  };

  const onStart = () => {
    ensureUnlocked();
    if (typeof keys !== 'undefined') {
      keys.jump = false; keys.push = false; keys.enter = false;
      keys.menuUp = false; keys.menuDown = false;
    }
    if (typeof window !== 'undefined') window.mouseJustClicked = false;
    if (showPaused) {
      window.unmountStartScreen();
      GameState.pausedGame = false;
      GameState.phase = GamePhase.PLAYING;
      return;
    }
    window.unmountStartScreen();
    resetGame(devFlags.startAtLevel || 1);
    if (typeof resetBalloon       === 'function') resetBalloon();
    if (typeof resetOutroTrigger  === 'function') resetOutroTrigger();
    if (typeof spawnEnemies       === 'function') spawnEnemies();
    GameState.phase = GamePhase.LEVEL_INTRO;
    if (typeof showLevelStart === 'function') showLevelStart(GameState.level);
  };

  const onResetHighscore = () => {
    try { localStorage.removeItem(HS_KEY); } catch (e) {}
    GameState.highScore = 0;
    setHighscore(0);
  };
  const onUnlockLevels = () => {
    try { localStorage.setItem('sm_levels_unlocked', '3'); } catch (e) {}
  };

  return ce('div', { style: { width: 480, height: 640, position: 'relative', overflow: 'hidden', background: PAL.navy } },
    ce('img', {
      src: _BG_IMG_SRC, alt: '',
      style: {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', imageRendering: 'pixelated', filter: 'brightness(0.85)',
      },
    }),
    ce(FlatLayoutB, {
      difficulty,          setDifficulty:   onChangeDifficulty,
      musicVol,            setMusicVol:     onChangeMusicVol,
      musicMute,           toggleMusicMute: onToggleMusicMute,
      sfxVol,              setSfxVol:       onChangeSfxVol,
      sfxMute,             toggleSfxMute:   onToggleSfxMute,
      highscore,
      showPaused,
      levelNumber,
      onStart,
      openDev: () => setDevOpen(true),
    }),
    devOpen && ce(DevToolsOverlay, {
      onClose:          () => setDevOpen(false),
      onResetHighscore,
      onUnlockLevels,
    })
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Mount / unmount lifecycle (called from main.js on phase enter/exit)
// ────────────────────────────────────────────────────────────────────────────
let _smRoot    = null;
let _smMounted = false;

function mountStartScreen() {
  const el = document.getElementById('sm-start-root');
  if (!el || _smMounted) return;
  if (!_smRoot) _smRoot = ReactDOM.createRoot(el);
  _smRoot.render(ce(StartScreen, null));
  el.classList.add('sm-active');
  _smMounted = true;
}

function unmountStartScreen() {
  const el = document.getElementById('sm-start-root');
  if (!el || !_smMounted) return;
  // Set flags synchronously so double-calls are safe even before the deferred unmount runs.
  _smMounted = false;
  el.classList.remove('sm-active');
  // Defer the actual React unmount one microtask so we never call it mid-render
  // (e.g. when onStart() calls unmountStartScreen inside a React event handler).
  if (_smRoot) {
    const root = _smRoot;
    _smRoot = null;
    Promise.resolve().then(() => root.unmount());
  }
}

window.mountStartScreen   = mountStartScreen;
window.unmountStartScreen = unmountStartScreen;

// Auto-mount: if the game is already on the START phase when this script runs,
// mount immediately. This handles the initial page load and any return to START.
if (typeof GameState !== 'undefined' && GameState.phase === GamePhase.START) {
  mountStartScreen();
}
