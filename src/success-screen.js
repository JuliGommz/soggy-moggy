/*
====================================================================
* success-screen.js - React DOM overlay for LEVEL_COMPLETE on L3
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
* - Loaded after start-screen.js; reuses PAL, PIXEL, PIXEL_BLOCK,
*   PixelBtn, MoggyTitle from that file (globals in the same scope)
* - Depends on: GameState, GamePhase, resetGame, resetBalloon,
*   resetOutroTrigger, spawnEnemies, showLevelStart
* - Triggered only when LEVEL_COMPLETE + level === 3
* - Mount via window.mountSuccessScreen()
* - Unmount via window.unmountSuccessScreen()
*
* SECTION MAP:
*   § 1  StatRow primitive
*   § 2  SuccessScreen root component
*   § 3  Mount / unmount lifecycle
====================================================================
*/

/* global React, ReactDOM, PAL, PIXEL, PIXEL_BLOCK, PixelBtn, MoggyTitle,
   GameState, GamePhase, resetGame, resetBalloon, resetOutroTrigger,
   spawnEnemies, showLevelStart */

const _sce = React.createElement;
const { useState: _scuseState, useEffect: _scUseEffect, useRef: _scUseRef } = React;

// ============================================================
// § 0  CongratsOverlay — 3-second intro animation
// ============================================================
// Replicates the LEVEL_INTRO look: dark mask + hazard bubble PNG + yellow title font.
// Bubble PNG: l1_intro.png (same speech-bubble shape used in level intro dialogues).
// Yellow font: YELLOW_FONT / drawYellowText from dialogue.js (global scope).

const _CONGRATS_BUBBLE_SRC = 'Visuals/thought_bubbles/dialogues/life_hazard.png';
const _CONGRATS_DURATION   = 5.0;  // seconds total
const _CONGRATS_FADE_AT    = 4.4;  // seconds when fade-out begins

const _CONFETTI_COLORS = ['#ffd83d','#7ad04a','#e84030','#3ab4f2','#ff9f43','#ffffff','#c678dd','#fd79a8'];

function CongratsOverlay({ onDone }) {
  const canvasRef   = _scUseRef(null);
  const particleRef = _scUseRef(null);

  _scUseEffect(() => {
    const startMs   = performance.now();
    let   prevNow   = startMs;
    const bubbleImg = new Image();
    bubbleImg.src   = _CONGRATS_BUBBLE_SRC;
    let raf;

    const draw = (now) => {
      const elapsed = (now - startMs) / 1000;
      if (elapsed >= _CONGRATS_DURATION) { onDone(); return; }

      const dt = Math.min((now - prevNow) / 1000, 0.05);
      prevNow = now;

      const cv = canvasRef.current;
      if (!cv) { raf = requestAnimationFrame(draw); return; }
      const ctx = cv.getContext('2d');
      const W = 480, H = 640;

      const fadeAlpha = elapsed >= _CONGRATS_FADE_AT
        ? 1 - (elapsed - _CONGRATS_FADE_AT) / (_CONGRATS_DURATION - _CONGRATS_FADE_AT)
        : 1;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);

      if (bubbleImg.complete && bubbleImg.naturalWidth > 0) {
        const BSCALE = 1.38;
        const bw = Math.round(bubbleImg.naturalWidth  * BSCALE);
        const bh = Math.round(bubbleImg.naturalHeight * BSCALE);
        let bx = Math.round((W - bw) / 2);
        let by = 145;

        // Soft shake — mirrors dialogue.js params
        const SHAKE_FIRST = 0.5, SHAKE_EVERY = 1.5, SHAKE_DUR = 0.9, SHAKE_AMP = 3;
        if (elapsed >= SHAKE_FIRST) {
          const phase = (elapsed - SHAKE_FIRST) % SHAKE_EVERY;
          if (phase < SHAKE_DUR) {
            const env = Math.sin((phase / SHAKE_DUR) * Math.PI);
            bx += Math.round(SHAKE_AMP * env * Math.sin(elapsed * Math.PI * 7));
            by += Math.round(SHAKE_AMP * 0.5 * env * Math.sin(elapsed * Math.PI * 8));
          }
        }

        // Bubble — lifeLost draw path (no flip)
        ctx.globalAlpha = 0.75 * fadeAlpha;
        ctx.drawImage(bubbleImg, bx, by, bw, bh);
        ctx.globalAlpha = fadeAlpha;

        // CONGRATS! text
        const SCALE = 0.31;
        const TEXT  = 'CONGRATS!';
        let textCX = W / 2, textCY = by + 103;
        if (typeof measureYellowText === 'function' && typeof drawYellowText === 'function') {
          const tw = measureYellowText(TEXT, SCALE);
          if (tw > 0) {
            const tx = Math.round((W - tw) / 2);
            textCX = tx + tw / 2;
            textCY = by + 103 + Math.ceil(147 * SCALE / 2);
            drawYellowText(ctx, TEXT, tx, by + 103, SCALE);
          }
        }

        // Init confetti particles once, anchored at text center
        if (particleRef.current === null) {
          const p = [];
          for (let i = 0; i < 90; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 280;
            p.push({
              x:     textCX + (Math.random() - 0.5) * 24,
              y:     textCY + (Math.random() - 0.5) * 12,
              vx:    Math.cos(angle) * speed,
              vy:    Math.sin(angle) * speed - 80,
              color: _CONFETTI_COLORS[i % _CONFETTI_COLORS.length],
              w:     3 + Math.random() * 5,
              h:     6 + Math.random() * 7,
              angle: Math.random() * Math.PI * 2,
              spin:  (Math.random() - 0.5) * 10,
            });
          }
          particleRef.current = p;
        }

        // Update + draw confetti
        ctx.globalAlpha = fadeAlpha;
        for (const p of particleRef.current) {
          p.x     += p.vx * dt;
          p.y     += p.vy * dt;
          p.vy    += 300 * dt;
          p.angle += p.spin * dt;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); particleRef.current = null; };
  }, [onDone]);

  return _sce('canvas', {
    ref: canvasRef,
    width: 480, height: 640,
    style: { position: 'absolute', inset: 0, zIndex: 20, imageRendering: 'pixelated', pointerEvents: 'all' },
  });
}

// ============================================================
// § 1  StatRow primitive
// ============================================================

function StatRow({ label, value, accent, hiScore }) {
  const labelColor = hiScore ? PAL.yellow : (accent ? accent : PAL.cream);
  const valueShadow = hiScore
    ? `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`
    : `1px 1px 0 ${PAL.ink}`;
  return _sce('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  },
    _sce('span', {
      style: { fontFamily: PIXEL_BLOCK, fontSize: hiScore ? 10 : 12, color: labelColor, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}` },
    }, label),
    _sce('span', {
      style: { fontFamily: PIXEL_BLOCK, fontSize: hiScore ? 16 : 15, color: PAL.cream, letterSpacing: 1, textShadow: valueShadow },
    }, value)
  );
}

// ============================================================
// § 2  SuccessScreen root component
// ============================================================

const _SC_BG_SRC = 'Visuals/ui/menus/assets/bg-tumble.png';

function SuccessScreen() {
  const [showCongrats, setShowCongrats] = _scuseState(true);

  const score      = Math.floor(GameState.score);
  const kills      = Math.floor(GameState.killBonus);
  const clear      = GameState.clearBonus;
  const total      = score + kills + clear;
  const highScore  = Math.floor(GameState.highScore);
  const isNewBest  = total > 0 && total === highScore;

  const onPlayAgain = () => {
    window.unmountSuccessScreen();
    resetGame(1);
    if (typeof resetBalloon      === 'function') resetBalloon();
    if (typeof resetOutroTrigger === 'function') resetOutroTrigger();
    if (typeof spawnEnemies      === 'function') spawnEnemies();
    GameState.phase = GamePhase.LEVEL_INTRO;
    if (typeof showLevelStart === 'function') showLevelStart(1);
  };

  const onMenu = () => {
    window.unmountSuccessScreen();
    GameState.pausedGame = false;
    GameState.phase = GamePhase.START;
  };

  return _sce('div', {
    style: { width: 480, height: 640, position: 'relative', overflow: 'hidden', background: PAL.navy },
  },
    _sce('img', {
      src: _SC_BG_SRC, alt: '',
      style: {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', imageRendering: 'pixelated',
        filter: 'brightness(0.6) hue-rotate(10deg) saturate(0.8)',
      },
    }),
    _sce('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,60,20,0.55) 0%, rgba(10,30,10,0.65) 50%, rgba(5,15,5,0.90) 100%)',
      },
    }),
    _sce('div', {
      style: { position: 'absolute', top: 24, left: 28, right: 28, display: 'flex', justifyContent: 'center', zIndex: 2 },
    },
      _sce(MoggyTitle, null)
    ),
    _sce('div', {
      style: { position: 'absolute', top: 172, left: 0, right: 0, textAlign: 'center', zIndex: 2 },
    },
      _sce('div', {
        style: {
          fontFamily: PIXEL_BLOCK, fontSize: 22, color: '#7ad04a',
          letterSpacing: 4, lineHeight: 1.3,
          textShadow: `2px 2px 0 #3a6020, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        },
      }, 'COMPLETE!')
    ),
    _sce('div', {
      style: {
        position: 'absolute', top: 228, left: 28, right: 28, zIndex: 2,
        background: 'rgba(20,16,12,0.92)',
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 4px 0 ${PAL.ink}`,
        padding: '16px 20px 12px',
      },
    },
      _sce(StatRow, { label: 'HEIGHT',    value: `${score} pts` }),
      _sce(StatRow, { label: 'WASPS',     value: `${kills} pts`, accent: kills > 0 ? PAL.yellow : PAL.dim }),
      _sce(StatRow, { label: 'ALL CLEAR', value: clear > 0 ? '+200 pts' : '---', accent: clear > 0 ? '#ff9f43' : PAL.dim }),
      _sce('div', { style: { borderTop: `2px solid ${PAL.ink}`, margin: '8px 0' } }),
      _sce(StatRow, { label: 'TOTAL',    value: `${total} pts`, accent: '#7ad04a' }),
      _sce(StatRow, { label: 'HI-SCORE', value: highScore.toLocaleString(), hiScore: true }),
      isNewBest && _sce('div', {
        style: {
          marginTop: 6, padding: '7px 12px',
          background: PAL.yellow, color: PAL.ink,
          border: `2px solid ${PAL.ink}`,
          boxShadow: `0 2px 0 ${PAL.ink}, inset 0 2px 0 ${PAL.yellowHi}`,
          fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
          textAlign: 'center', animation: 'fadeIn 0.4s ease-out',
        },
      }, '★ NEW BEST ★')
    ),
    _sce('div', {
      style: {
        position: 'absolute', bottom: 60, left: 28, right: 28, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      },
    },
      _sce(PixelBtn, { primary: true, big: true, full: true, onClick: onPlayAgain }, '▶ PLAY AGAIN'),
      _sce(PixelBtn, { big: true, full: true, onClick: onMenu }, '← BACK TO MENU')
    ),
    showCongrats && _sce(CongratsOverlay, { onDone: () => setShowCongrats(false) })
  );
}

// ============================================================
// § 3  Mount / unmount lifecycle
// ============================================================

let _scRoot    = null;
let _scMounted = false;

function mountSuccessScreen() {
  const el = document.getElementById('sm-success-root');
  if (!el || _scMounted) return;
  if (!_scRoot) _scRoot = ReactDOM.createRoot(el);
  _scRoot.render(_sce(SuccessScreen, null));
  el.classList.add('sm-active');
  _scMounted = true;
}

function unmountSuccessScreen() {
  const el = document.getElementById('sm-success-root');
  if (!el || !_scMounted) return;
  _scMounted = false;
  el.classList.remove('sm-active');
  if (_scRoot) {
    const root = _scRoot;
    _scRoot = null;
    Promise.resolve().then(() => root.unmount());
  }
}

window.mountSuccessScreen   = mountSuccessScreen;
window.unmountSuccessScreen = unmountSuccessScreen;
