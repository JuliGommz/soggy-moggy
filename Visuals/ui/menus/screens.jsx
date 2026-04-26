/* global React */
const { useState } = React;

// --- Game palette pulled from screenshots ---
const C = {
  navy: "#1a2030",
  brickDark: "#5a2a26",
  brick: "#7a3a32",
  brickLite: "#9c4a3a",
  mortar: "#3a1f1c",
  yellow: "#ffd83d",
  yellowDeep: "#f0a020",
  red: "#c83020",
  redDark: "#8a1a14",
  cream: "#e8d8b8",
  couch: "#3a5a3a",
  paper: "#f4ead0",
  ink: "#1a1410",
  off: "#e8e4d8",
  dim: "#8a8478",
};

// Sketchy hand-drawn font stack for the wireframe vibe
const SKETCH_FONT = `'Patrick Hand', 'Caveat', 'Comic Sans MS', cursive`;
const PIXEL_FONT = `'VT323', 'Courier New', monospace`;

// ===================================================================
// Shared building blocks
// ===================================================================

// Brick wall pattern via SVG — keeps it lo-fi
function BrickBg({ opacity = 1 }) {
  return (
    <svg
      width="480"
      height="640"
      viewBox="0 0 480 640"
      style={{ position: "absolute", inset: 0, opacity }}
      preserveAspectRatio="none"
    >
      <rect width="480" height="640" fill={C.brick} />
      {/* Mortar grid */}
      {Array.from({ length: 22 }).map((_, row) => {
        const y = row * 30;
        const offset = row % 2 ? 0 : 40;
        return (
          <g key={row}>
            <line x1="0" y1={y} x2="480" y2={y} stroke={C.mortar} strokeWidth="2" />
            {Array.from({ length: 7 }).map((_, col) => (
              <line
                key={col}
                x1={col * 80 + offset}
                y1={y}
                x2={col * 80 + offset}
                y2={y + 30}
                stroke={C.mortar}
                strokeWidth="2"
              />
            ))}
          </g>
        );
      })}
      {/* Highlight some bricks darker for variation */}
      {[
        [80, 60], [240, 120], [40, 180], [320, 240], [160, 330],
        [400, 390], [120, 450], [280, 510], [200, 600],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="78" height="28" fill={C.brickDark} opacity="0.55" />
      ))}
    </svg>
  );
}

// The hallmark CITY ALERT title: chunky yellow with red drop shadow + black outline
function ChunkyTitle({ children, size = 56, color = C.yellow, shadow = C.red, outline = C.ink }) {
  return (
    <div
      style={{
        fontFamily: PIXEL_FONT,
        fontSize: size,
        fontWeight: 900,
        color,
        letterSpacing: 4,
        textShadow: [
          `3px 0 0 ${outline}`, `-3px 0 0 ${outline}`,
          `0 3px 0 ${outline}`, `0 -3px 0 ${outline}`,
          `3px 3px 0 ${outline}`, `-3px 3px 0 ${outline}`,
          `3px -3px 0 ${outline}`, `-3px -3px 0 ${outline}`,
          `6px 6px 0 ${shadow}`, `9px 9px 0 ${outline}`,
        ].join(", "),
        lineHeight: 1,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

// A wobbly hand-drawn rectangle border using SVG
function SketchBox({ w, h, fill = "transparent", stroke = C.off, strokeWidth = 2.5, children, style }) {
  // jitter the path so it looks hand-drawn
  const path = `
    M 4 ${6 + (Math.random() * 0)}
    L ${w - 6} 4
    L ${w - 4} ${h - 5}
    L 5 ${h - 4}
    Z
  `;
  return (
    <div style={{ position: "relative", width: w, height: h, ...style }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>{children}</div>
    </div>
  );
}

// Pixel-art cat placeholder (very abstract, just shape + ears)
function CatBlob({ size = 48, mood = "soggy" }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 48 44" style={{ imageRendering: "pixelated" }}>
      {/* ears */}
      <rect x="6" y="6" width="6" height="6" fill={C.off} stroke={C.ink} strokeWidth="1" />
      <rect x="36" y="6" width="6" height="6" fill={C.off} stroke={C.ink} strokeWidth="1" />
      {/* head */}
      <rect x="6" y="10" width="36" height="22" fill={C.off} stroke={C.ink} strokeWidth="1.5" />
      {/* eyes */}
      <rect x="14" y="18" width="4" height="4" fill={C.ink} />
      <rect x="30" y="18" width="4" height="4" fill={C.ink} />
      {mood === "soggy" && <rect x="14" y="22" width="4" height="2" fill={C.red} opacity="0.5" />}
      {/* nose */}
      <rect x="22" y="24" width="4" height="2" fill={C.red} />
      {/* mouth */}
      <rect x="18" y="28" width="4" height="2" fill={C.ink} />
      <rect x="26" y="28" width="4" height="2" fill={C.ink} />
      {/* body */}
      <rect x="12" y="32" width="24" height="10" fill={C.off} stroke={C.ink} strokeWidth="1.5" />
    </svg>
  );
}

// Chunky pixel button — beveled
function PixelButton({ children, primary, w = "auto", style = {}, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: PIXEL_FONT,
        fontSize: 22,
        letterSpacing: 2,
        padding: "10px 22px",
        background: primary ? C.yellow : C.off,
        color: C.ink,
        border: "none",
        boxShadow: primary
          ? `inset -4px -4px 0 ${C.yellowDeep}, inset 4px 4px 0 #fff8c0, 0 4px 0 ${C.ink}`
          : `inset -4px -4px 0 ${C.dim}, inset 4px 4px 0 #fff, 0 4px 0 ${C.ink}`,
        cursor: "pointer",
        textTransform: "uppercase",
        fontWeight: 900,
        width: w,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Volume slider — pixel chunks
function PixelSlider({ value = 7, max = 10, onChange, color = C.yellow }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          onClick={() => onChange?.(i + 1)}
          style={{
            width: 12,
            height: 18,
            background: i < value ? color : C.mortar,
            border: `1.5px solid ${C.ink}`,
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}

// ===================================================================
// A. CLASSIC STACK
// ===================================================================
function ScreenA({ showBg }) {
  return (
    <div style={{ width: 480, height: 640, position: "relative", background: C.navy, overflow: "hidden", border: `4px solid ${C.navy}` }}>
      {showBg ? (
        <img src="assets/bg-brick.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} />
      ) : (
        <BrickBg />
      )}
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />

      {/* Title */}
      <div style={{ position: "absolute", top: 60, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <ChunkyTitle size={52}>SOGGY</ChunkyTitle>
        <ChunkyTitle size={52}>MOGGY</ChunkyTitle>
        <div style={{ fontFamily: SKETCH_FONT, color: C.cream, fontSize: 18, marginTop: 6, fontStyle: "italic" }}>
          ~ a tale of one wet cat ~
        </div>
      </div>

      {/* Difficulty card */}
      <div style={{ position: "absolute", top: 290, left: 40, right: 40 }}>
        <div style={{ fontFamily: PIXEL_FONT, color: C.off, fontSize: 18, textAlign: "center", marginBottom: 8, letterSpacing: 3 }}>
          — DIFFICULTY —
        </div>
        {[
          { name: "EXPLORER", sub: "chill stroll", sel: false },
          { name: "ADVENTURER", sub: "the standard tumble", sel: true },
          { name: "ENLIGHTENED", sub: "soaked & suffering", sel: false },
        ].map((d) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 14px",
              background: d.sel ? "rgba(255,216,61,0.15)" : "transparent",
              borderLeft: d.sel ? `4px solid ${C.yellow}` : `4px solid transparent`,
              marginBottom: 2,
            }}
          >
            <span style={{ color: d.sel ? C.yellow : "transparent", fontFamily: PIXEL_FONT, fontSize: 18 }}>▶</span>
            <div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 22, color: d.sel ? C.yellow : C.off, letterSpacing: 2 }}>{d.name}</div>
              <div style={{ fontFamily: SKETCH_FONT, fontSize: 14, color: C.cream, opacity: 0.7 }}>{d.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Start button */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PixelButton primary>▶ START</PixelButton>
      </div>

      {/* Audio mini-strip */}
      <div style={{ position: "absolute", bottom: 30, left: 30, right: 30, padding: "10px 14px", background: "rgba(20,16,12,0.7)", border: `2px solid ${C.ink}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontFamily: PIXEL_FONT, color: C.off, fontSize: 14 }}>♪ MUSIC</span>
          <PixelSlider value={7} />
          <span style={{ fontFamily: PIXEL_FONT, color: C.dim, fontSize: 12, cursor: "pointer" }}>[ON]</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: PIXEL_FONT, color: C.off, fontSize: 14 }}>✸ SFX</span>
          <PixelSlider value={9} color={C.cream} />
          <span style={{ fontFamily: PIXEL_FONT, color: C.dim, fontSize: 12, cursor: "pointer" }}>[ON]</span>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// B. COMIC BURST — title in a CITY-ALERT yellow burst, speech bubbles
// ===================================================================
function ScreenB({ showBg }) {
  return (
    <div style={{ width: 480, height: 640, position: "relative", background: C.navy, overflow: "hidden", border: `4px solid ${C.navy}` }}>
      {showBg ? (
        <img src="assets/bg-brick.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", filter: "brightness(0.7)" }} />
      ) : (
        <BrickBg opacity={0.85} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(20,20,40,0.25)" }} />

      {/* Yellow burst title */}
      <div style={{ position: "absolute", top: 36, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <svg width="440" height="180" viewBox="0 0 440 180">
          {/* Burst star */}
          <polygon
            points="220,4 240,30 280,16 280,52 320,50 304,82 340,100 304,118 320,150 280,148 280,176 240,170 220,196 200,170 160,176 160,148 120,150 136,118 100,100 136,82 120,50 160,52 160,16 200,30"
            fill={C.yellow}
            stroke={C.ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <polygon
            points="220,4 240,30 280,16 280,52 320,50 304,82 340,100 304,118 320,150 280,148 280,176 240,170 220,196 200,170 160,176 160,148 120,150 136,118 100,100 136,82 120,50 160,52 160,16 200,30"
            fill="none"
            stroke={C.red}
            strokeWidth="1.5"
            transform="translate(4,4)"
            opacity="0.4"
          />
        </svg>
        <div style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 38, color: C.ink, fontWeight: 900, letterSpacing: 3, lineHeight: 0.95, textShadow: `2px 2px 0 ${C.red}` }}>SOGGY</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 38, color: C.ink, fontWeight: 900, letterSpacing: 3, lineHeight: 0.95, textShadow: `2px 2px 0 ${C.red}` }}>MOGGY</div>
          <div style={{ fontFamily: SKETCH_FONT, fontSize: 14, color: C.redDark, marginTop: 6 }}>* press start, get drenched *</div>
        </div>
      </div>

      {/* Cat with speech bubble */}
      <div style={{ position: "absolute", top: 240, left: 30, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <CatBlob size={56} />
        <div
          style={{
            background: C.cream,
            border: `2px solid ${C.ink}`,
            borderRadius: 14,
            padding: "8px 14px",
            fontFamily: PIXEL_FONT,
            fontSize: 16,
            color: C.ink,
            position: "relative",
            maxWidth: 280,
          }}
        >
          how wet do you want it?
          <div style={{ position: "absolute", left: -10, bottom: 8, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: `12px solid ${C.cream}` }} />
        </div>
      </div>

      {/* Difficulty as 3 bubble buttons */}
      <div style={{ position: "absolute", top: 320, left: 30, right: 30, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { name: "EXPLORER", sub: "🐾 dry shoes only", sel: false, c: "#7ab87a" },
          { name: "ADVENTURER", sub: "🌧 standard splash", sel: true, c: C.yellow },
          { name: "ENLIGHTENED", sub: "💧 totally soaked", sel: false, c: C.red },
        ].map((d) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 14px",
              background: d.sel ? d.c : C.cream,
              border: `2px solid ${C.ink}`,
              borderRadius: 999,
              boxShadow: d.sel ? `0 4px 0 ${C.ink}` : `0 2px 0 ${C.ink}`,
              transform: d.sel ? "translateX(8px)" : "none",
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: d.sel ? C.ink : "transparent", border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", color: d.c, fontSize: 14 }}>
              {d.sel && "✓"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: C.ink, letterSpacing: 1, fontWeight: 700 }}>{d.name}</div>
              <div style={{ fontFamily: SKETCH_FONT, fontSize: 13, color: C.ink, opacity: 0.7 }}>{d.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Start + Audio strip */}
      <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <PixelButton primary style={{ width: "100%", fontSize: 26 }}>▶ START GAME</PixelButton>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, padding: "6px 10px", background: C.cream, border: `2px solid ${C.ink}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: C.ink }}>♪</span>
            <PixelSlider value={6} color={C.red} />
          </div>
          <div style={{ flex: 1, padding: "6px 10px", background: C.cream, border: `2px solid ${C.ink}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: C.ink }}>✸</span>
            <PixelSlider value={8} color={C.red} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// C. ARCADE CABINET — paneled, retro arcade marquee
// ===================================================================
function ScreenC({ showBg }) {
  return (
    <div style={{ width: 480, height: 640, position: "relative", background: C.ink, overflow: "hidden", border: `4px solid ${C.navy}` }}>
      {/* Outer cabinet frame */}
      <div style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box" }}>
        {/* Marquee */}
        <div style={{ background: C.brick, border: `4px solid ${C.ink}`, padding: "16px 12px", textAlign: "center", boxShadow: `inset 0 0 0 2px ${C.yellow}` }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: C.cream, letterSpacing: 4, marginBottom: 4 }}>★ INSERT FUR ★</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 44, color: C.yellow, fontWeight: 900, letterSpacing: 4, textShadow: `3px 3px 0 ${C.red}, 6px 6px 0 ${C.ink}`, lineHeight: 1 }}>
            SOGGY MOGGY
          </div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: C.cream, letterSpacing: 4, marginTop: 4 }}>★ A VERTICAL DESCENT ★</div>
        </div>

        {/* Screen panel — preview */}
        <div style={{ background: showBg ? "transparent" : C.navy, border: `4px solid ${C.ink}`, height: 140, position: "relative", overflow: "hidden", boxShadow: `inset 0 0 0 2px ${C.dim}` }}>
          {showBg && <img src="assets/bg-tumble.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} />}
          {!showBg && (
            <>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #6da5b8 0%, #6da5b8 60%, ${C.brick} 60%, ${C.brick} 100%)` }} />
              <div style={{ position: "absolute", left: 200, top: 50 }}><CatBlob size={40} /></div>
            </>
          )}
          <div style={{ position: "absolute", top: 4, left: 8, fontFamily: PIXEL_FONT, fontSize: 12, color: C.yellow }}>DEMO</div>
          <div style={{ position: "absolute", bottom: 4, right: 8, fontFamily: PIXEL_FONT, fontSize: 10, color: C.off, opacity: 0.6 }}>──────</div>
        </div>

        {/* Difficulty selector — 3 lit buttons */}
        <div style={{ background: C.brickDark, border: `4px solid ${C.ink}`, padding: "10px 12px" }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: C.off, letterSpacing: 3, marginBottom: 8 }}>SELECT MODE:</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { name: "EXPLORER", lit: false, c: "#7ab87a" },
              { name: "ADVENTURER", lit: true, c: C.yellow },
              { name: "ENLIGHT.", lit: false, c: C.red },
            ].map((d) => (
              <div
                key={d.name}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: d.lit ? d.c : C.mortar,
                  border: `3px solid ${C.ink}`,
                  textAlign: "center",
                  fontFamily: PIXEL_FONT,
                  fontSize: 14,
                  fontWeight: 900,
                  color: d.lit ? C.ink : C.dim,
                  letterSpacing: 1,
                  boxShadow: d.lit ? `inset 0 0 12px #fff8, 0 0 8px ${d.c}` : "none",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.lit ? C.ink : C.dim, margin: "0 auto 4px" }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Audio panel */}
        <div style={{ background: C.brickDark, border: `4px solid ${C.ink}`, padding: "10px 12px" }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: C.off, letterSpacing: 3, marginBottom: 8 }}>AUDIO:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: C.off, width: 60 }}>BGM</span>
              <PixelSlider value={6} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: C.yellow, marginLeft: "auto" }}>♪ ON</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: C.off, width: 60 }}>SFX</span>
              <PixelSlider value={8} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: C.dim, marginLeft: "auto", textDecoration: "line-through" }}>MUTE</span>
            </div>
          </div>
        </div>

        {/* Start */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}>
          <PixelButton primary style={{ fontSize: 22, padding: "12px 40px" }}>▶ PRESS START</PixelButton>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// D. POSTER — full-bleed background, big chunky title, slab options
// ===================================================================
function ScreenD({ showBg }) {
  return (
    <div style={{ width: 480, height: 640, position: "relative", background: C.navy, overflow: "hidden", border: `4px solid ${C.navy}` }}>
      {/* Full-bleed background — using the tumbling cat screenshot */}
      {showBg ? (
        <img src="assets/bg-tumble.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #6da5b8 0%, #6da5b8 50%, #4a3a4a 50%, ${C.brickDark} 100%)` }}>
          <div style={{ position: "absolute", left: "55%", top: "30%" }}><CatBlob size={56} /></div>
        </div>
      )}
      {/* Top fade */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: `linear-gradient(180deg, rgba(20,16,12,0.7) 0%, transparent 100%)` }} />
      {/* Bottom slab fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 320, background: `linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.85) 40%, rgba(20,16,12,0.95) 100%)` }} />

      {/* Title — top */}
      <div style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center" }}>
        <ChunkyTitle size={64}>SOGGY</ChunkyTitle>
        <div style={{ height: 8 }} />
        <ChunkyTitle size={64}>MOGGY</ChunkyTitle>
        <div style={{ fontFamily: PIXEL_FONT, color: C.cream, fontSize: 16, letterSpacing: 4, marginTop: 16, textShadow: `2px 2px 0 ${C.ink}` }}>
          A VERTICAL DESCENT
        </div>
      </div>

      {/* Bottom slab — controls */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px 24px" }}>
        {/* Difficulty as a row of pills */}
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: C.off, letterSpacing: 3, marginBottom: 8, opacity: 0.8 }}>DIFFICULTY</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[
            { name: "EXPLORER", sel: false },
            { name: "ADVENTURER", sel: true },
            { name: "ENLIGHTENED", sel: false },
          ].map((d) => (
            <div
              key={d.name}
              style={{
                flex: 1,
                padding: "8px 4px",
                background: d.sel ? C.yellow : "rgba(232,228,216,0.1)",
                border: `2px solid ${d.sel ? C.ink : C.dim}`,
                textAlign: "center",
                fontFamily: PIXEL_FONT,
                fontSize: 13,
                fontWeight: 900,
                color: d.sel ? C.ink : C.off,
                letterSpacing: 1,
                boxShadow: d.sel ? `0 4px 0 ${C.red}` : "none",
              }}
            >
              {d.name}
            </div>
          ))}
        </div>

        {/* Audio inline — compact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 13, color: C.off, width: 50, letterSpacing: 1 }}>♪ MUSIC</span>
            <PixelSlider value={7} />
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: C.yellow, marginLeft: "auto" }}>[MUTE]</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 13, color: C.off, width: 50, letterSpacing: 1 }}>✸ SFX</span>
            <PixelSlider value={9} />
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: C.yellow, marginLeft: "auto" }}>[MUTE]</span>
          </div>
        </div>

        {/* Big start */}
        <PixelButton primary style={{ width: "100%", fontSize: 28, padding: "14px 0" }}>
          ▶ CONTINUE
        </PixelButton>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: C.dim, textAlign: "center", marginTop: 8, letterSpacing: 2 }}>
          [SPACE] OR CLICK · LAST RUN: FLOOR 4
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// Mount
// ===================================================================
Object.assign(window, { ScreenA, ScreenB, ScreenC, ScreenD });
