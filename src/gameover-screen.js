/*
====================================================================
* gameover-screen.js - React DOM overlay for GamePhase.GAMEOVER
====================================================================
* Project: Soggy Moggy
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-04-26
* Version: 1.0
*
* AUTHORSHIP CLASSIFICATION: [AI-ASSISTED]
*
* NOTES:
* - Plain <script src="..."> tag — no Babel / no XHR required
* - Loaded after start-screen.js; reuses PAL, PIXEL, PIXEL_BLOCK, PixelBtn
*   from that file (all are globals in the same scope)
* - Depends on: GameState, GamePhase, resetGame, resetBalloon,
*   resetOutroTrigger, spawnEnemies, showLevelStart
* - Mount via window.mountGameOverScreen()
* - Unmount via window.unmountGameOverScreen()
*
* SECTION MAP:
*   § 1  ScoreRow primitive
*   § 2  GameOverScreen root component
*   § 3  Mount / unmount lifecycle
====================================================================
*/

/* global React, ReactDOM, PAL, PIXEL, PIXEL_BLOCK, PixelBtn,
   GameState, GamePhase, resetGame, resetBalloon, resetOutroTrigger,
   spawnEnemies, showLevelStart */

const _goce = React.createElement;

// ============================================================
// § 1  ScoreRow primitive
// ============================================================

function ScoreRow({ label, value, hiScore }) {
  return _goce('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  },
    _goce('span', {
      style: {
        fontFamily: PIXEL_BLOCK, fontSize: hiScore ? 9 : 11,
        color: PAL.yellow,
        letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}`,
      },
    }, label),
    _goce('span', {
      style: {
        fontFamily: PIXEL_BLOCK, fontSize: hiScore ? 14 : 15,
        color: PAL.cream,
        letterSpacing: 1,
        textShadow: hiScore
          ? `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`
          : `2px 2px 0 ${PAL.ink}`,
      },
    }, value)
  );
}

// ============================================================
// § 2  GameOverScreen root component
// ============================================================

const _GO_BG_SRC = 'Visuals/ui/menus/assets/bg-tumble.png';

function GameOverScreen() {
  const score     = Math.floor(GameState.score);
  const highScore = Math.floor(GameState.highScore);
  const level     = GameState.level;
  const isNewBest = score > 0 && score === highScore;

  const onRetry = () => {
    window.unmountGameOverScreen();
    resetGame(level);
    if (typeof resetBalloon      === 'function') resetBalloon();
    if (typeof resetOutroTrigger === 'function') resetOutroTrigger();
    if (typeof spawnEnemies      === 'function') spawnEnemies();
    GameState.phase = GamePhase.LEVEL_INTRO;
    if (typeof showLevelStart === 'function') showLevelStart(level);
  };

  const onMenu = () => {
    window.unmountGameOverScreen();
    GameState.pausedGame = false;
    GameState.phase = GamePhase.START;
  };

  return _goce('div', {
    style: { width: 480, height: 640, position: 'relative', overflow: 'hidden', background: PAL.navy },
  },
    _goce('img', {
      src: _GO_BG_SRC, alt: '',
      style: {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', imageRendering: 'pixelated',
        filter: 'brightness(0.5) sepia(0.5) saturate(0.5)',
      },
    }),
    _goce('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(100,0,0,0.55) 0%, rgba(20,0,0,0.72) 50%, rgba(10,0,0,0.90) 100%)',
      },
    }),
    _goce('div', {
      style: { position: 'absolute', top: 88, left: 0, right: 0, textAlign: 'center', zIndex: 2 },
    },
      _goce('div', {
        style: {
          fontFamily: PIXEL_BLOCK, fontSize: 36, color: '#e84030',
          letterSpacing: 4, lineHeight: 1.3,
          textShadow: `2px 2px 0 #8a1a14, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        },
      }, 'GAME OVER')
    ),
    _goce('div', {
      style: {
        position: 'absolute', top: 210, left: 28, right: 28, zIndex: 2,
        background: 'rgba(20,16,12,0.92)',
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 4px 0 ${PAL.ink}`,
        padding: '18px 20px 14px',
      },
    },
      _goce('div', {
        style: {
          fontFamily: PIXEL_BLOCK, fontSize: 10, color: PAL.dim,
          letterSpacing: 2, marginBottom: 16, textAlign: 'center',
          textShadow: `1px 1px 0 ${PAL.ink}`,
        },
      }, `REACHED LEVEL ${level} OF 3`),
      _goce(ScoreRow, { label: 'SCORE',    value: score.toLocaleString() }),
      _goce(ScoreRow, { label: 'HI-SCORE', value: highScore.toLocaleString(), hiScore: true }),
      isNewBest && _goce('div', {
        style: {
          marginTop: 4, padding: '7px 12px',
          background: PAL.yellow, color: PAL.ink,
          border: `2px solid ${PAL.ink}`,
          boxShadow: `0 2px 0 ${PAL.ink}, inset 0 2px 0 ${PAL.yellowHi}`,
          fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
          textAlign: 'center', animation: 'fadeIn 0.4s ease-out',
        },
      }, '★ NEW BEST ★')
    ),
    _goce('div', {
      style: {
        position: 'absolute', bottom: 70, left: 28, right: 28, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      },
    },
      _goce(PixelBtn, { primary: true, big: true, full: true, onClick: onRetry }, '↺ RETRY'),
      _goce(PixelBtn, { big: true, full: true, onClick: onMenu }, '← BACK TO MENU'),
      _goce('div', {
        style: {
          fontFamily: PIXEL, fontSize: 14, color: PAL.off, opacity: 0.55,
          letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}`,
          marginTop: 4, textAlign: 'center',
        },
      }, '[ENTER] to menu')
    )
  );
}

// ============================================================
// § 3  Mount / unmount lifecycle
// ============================================================

let _goRoot    = null;
let _goMounted = false;

function mountGameOverScreen() {
  const el = document.getElementById('sm-gameover-root');
  if (!el || _goMounted) return;
  if (!_goRoot) _goRoot = ReactDOM.createRoot(el);
  _goRoot.render(_goce(GameOverScreen, null));
  el.classList.add('sm-active');
  _goMounted = true;
}

function unmountGameOverScreen() {
  const el = document.getElementById('sm-gameover-root');
  if (!el || !_goMounted) return;
  _goMounted = false;
  el.classList.remove('sm-active');
  if (_goRoot) {
    const root = _goRoot;
    _goRoot = null;
    Promise.resolve().then(() => root.unmount());
  }
}

window.mountGameOverScreen   = mountGameOverScreen;
window.unmountGameOverScreen = unmountGameOverScreen;
