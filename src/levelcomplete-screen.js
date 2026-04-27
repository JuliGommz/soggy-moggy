/**
 * File:        levelcomplete-screen.js
 * Project:     Soggy Moggy — SRH Abschlussprojekt (Game & Multimedia Design)
 * Author:      Julian Gomez
 * AI support:  Developed with AI assistance (Claude / Anthropic) as a
 *              pair-programming partner for design, implementation, and debugging.
 *              All code reviewed and integrated by the author.
 * Created:     2026-04-26
 * Updated:     2026-04-27
 *
 * Purpose:     React DOM overlay shown after LEVEL_COMPLETE on Levels 1 and 2
 *              (the L3 final-victory variant lives in success-screen.js).
 *              Shows the level summary and offers "Next Level" / "Retry" /
 *              "Main Menu". Mount / unmount controlled by
 *              window.mountLevelCompleteScreen() / window.unmountLevelCompleteScreen().
 * Depends on:  React + ReactDOM (loaded via <script> before this file),
 *              start-screen.js (PAL, PIXEL, PIXEL_BLOCK, PixelBtn, MoggyTitle — globals),
 *              game-state.js (GameState, GamePhase, startNextLevel, restartLevel),
 *              player.js / enemies.js (resetBalloon, spawnEnemies),
 *              dialogue.js (showLevelStart),
 *              main.js (resetOutroTrigger).
 * Loaded by:   index.html (vanilla <script> tag — see load order in index.html)
 *
 * Section map:
 *   § 1  LcRow primitive
 *   § 2  LevelCompleteScreen root component
 *   § 3  Mount / unmount lifecycle
 */

/* global React, ReactDOM, PAL, PIXEL, PIXEL_BLOCK, PixelBtn, MoggyTitle,
   GameState, GamePhase, startNextLevel, restartLevel,
   resetBalloon, resetOutroTrigger, spawnEnemies, showLevelStart */

const _lce = React.createElement;

// ============================================================
// § 1  LcRow primitive
// ============================================================

function LcRow({ label, value, accent }) {
  return _lce('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  },
    _lce('span', {
      style: { fontFamily: PIXEL_BLOCK, fontSize: 12, color: accent || PAL.cream, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}` },
    }, label),
    _lce('span', {
      style: { fontFamily: PIXEL_BLOCK, fontSize: 15, color: PAL.cream, letterSpacing: 1, textShadow: `2px 2px 0 ${PAL.ink}` },
    }, value)
  );
}

// ============================================================
// § 2  LevelCompleteScreen root component
// ============================================================

const _LC_BG_SRC    = 'Visuals/ui/menus/assets/bg-tumble.png';
const _LC_NAMES     = ['', 'City', 'Elevator Shaft', 'Open Sea'];
const _LC_NEXT_NAME = ['', 'Elevator Shaft', 'Open Sea', ''];

function LevelCompleteScreen() {
  const level    = GameState.level;
  const score    = Math.floor(GameState.score);
  const kills    = Math.floor(GameState.killBonus);
  const clear    = GameState.clearBonus;
  const total    = score + kills + clear;
  const lives    = GameState.lives;
  const nextName = _LC_NEXT_NAME[level] || '';

  const _go = (fn) => {
    window.unmountLevelCompleteScreen();
    fn();
  };

  const onNext = () => _go(() => {
    startNextLevel();
    if (typeof resetBalloon      === 'function') resetBalloon();
    if (typeof resetOutroTrigger === 'function') resetOutroTrigger();
    if (typeof spawnEnemies      === 'function') spawnEnemies();
    GameState.phase = GamePhase.LEVEL_INTRO;
    if (typeof showLevelStart === 'function') showLevelStart(GameState.level);
  });

  const onRetry = () => _go(() => {
    restartLevel();
    if (typeof resetBalloon      === 'function') resetBalloon();
    if (typeof resetOutroTrigger === 'function') resetOutroTrigger();
    if (typeof spawnEnemies      === 'function') spawnEnemies();
    GameState.phase = GamePhase.LEVEL_INTRO;
    if (typeof showLevelStart === 'function') showLevelStart(GameState.level);
  });

  const onMenu = () => _go(() => {
    GameState.pausedGame = false;
    GameState.phase = GamePhase.START;
  });

  return _lce('div', {
    style: { width: 480, height: 640, position: 'relative', overflow: 'hidden', background: PAL.navy },
  },
    _lce('img', {
      src: _LC_BG_SRC, alt: '',
      style: {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', imageRendering: 'pixelated',
        filter: 'brightness(0.55) hue-rotate(200deg) saturate(0.7)',
      },
    }),
    _lce('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,20,60,0.55) 0%, rgba(0,10,40,0.68) 50%, rgba(0,5,20,0.90) 100%)',
      },
    }),
    _lce('div', {
      style: { position: 'absolute', top: 24, left: 28, right: 28, display: 'flex', justifyContent: 'center', zIndex: 2 },
    },
      _lce(MoggyTitle, null)
    ),
    _lce('div', {
      style: { position: 'absolute', top: 186, left: 0, right: 0, textAlign: 'center', zIndex: 2 },
    },
      _lce('div', {
        style: { fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.dim, letterSpacing: 3, textShadow: `1px 1px 0 ${PAL.ink}` },
      }, `LEVEL ${level}`)
    ),
    _lce('div', {
      style: { position: 'absolute', top: 212, left: 0, right: 0, textAlign: 'center', zIndex: 2 },
    },
      _lce('div', {
        style: {
          fontFamily: PIXEL_BLOCK, fontSize: 22, color: '#ffd83d',
          letterSpacing: 4, lineHeight: 1.3,
          textShadow: `2px 2px 0 #8a6010, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        },
      }, 'COMPLETE!')
    ),
    nextName && _lce('div', {
      style: { position: 'absolute', top: 244, left: 0, right: 0, textAlign: 'center', zIndex: 2 },
    },
      _lce('div', {
        style: { fontFamily: PIXEL, fontSize: 13, color: PAL.off, opacity: 0.65, letterSpacing: 2 },
      }, `UP NEXT: ${nextName}`)
    ),
    _lce('div', {
      style: {
        position: 'absolute', top: 276, left: 28, right: 28, zIndex: 2,
        background: 'rgba(20,16,12,0.92)',
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 4px 0 ${PAL.ink}`,
        padding: '16px 20px 12px',
      },
    },
      _lce(LcRow, { label: 'HEIGHT',    value: `${score} pts` }),
      _lce(LcRow, { label: 'WASPS',     value: `${kills} pts`, accent: kills > 0 ? PAL.yellow : PAL.dim }),
      _lce(LcRow, { label: 'ALL CLEAR', value: clear > 0 ? '+200 pts' : '---',  accent: clear > 0 ? '#ff9f43' : PAL.dim }),
      _lce('div', { style: { borderTop: `2px solid ${PAL.ink}`, margin: '8px 0' } }),
      _lce(LcRow, { label: 'TOTAL',  value: `${total} pts`, accent: '#ffd83d' }),
      _lce(LcRow, { label: 'LIVES',  value: `${lives} / 9`,  accent: lives <= 1 ? PAL.red : PAL.cream })
    ),
    _lce('div', {
      style: {
        position: 'absolute', bottom: 32, left: 28, right: 28, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      },
    },
      _lce(PixelBtn, { primary: true, full: true, onClick: onNext  }, '▶ NEXT LEVEL'),
      _lce(PixelBtn, { full: true, onClick: onRetry }, '↺ RETRY LEVEL'),
      _lce(PixelBtn, { full: true, onClick: onMenu  }, '← BACK TO MENU')
    )
  );
}

// ============================================================
// § 3  Mount / unmount lifecycle
// ============================================================

let _lcRoot    = null;
let _lcMounted = false;

function mountLevelCompleteScreen() {
  const el = document.getElementById('sm-levelcomplete-root');
  if (!el || _lcMounted) return;
  if (!_lcRoot) _lcRoot = ReactDOM.createRoot(el);
  _lcRoot.render(_lce(LevelCompleteScreen, null));
  el.classList.add('sm-active');
  _lcMounted = true;
}

function unmountLevelCompleteScreen() {
  const el = document.getElementById('sm-levelcomplete-root');
  if (!el || !_lcMounted) return;
  _lcMounted = false;
  el.classList.remove('sm-active');
  if (_lcRoot) {
    const root = _lcRoot;
    _lcRoot = null;
    Promise.resolve().then(() => root.unmount());
  }
}

window.mountLevelCompleteScreen   = mountLevelCompleteScreen;
window.unmountLevelCompleteScreen = unmountLevelCompleteScreen;
