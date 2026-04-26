/* global React */
const { useState, useEffect } = React;

// ============================================================
// Game palette
// ============================================================
const PAL = {
  navy: "#1a2030",
  brickDark: "#4a221e",
  brick: "#7a3a32",
  brickLite: "#9c4a3a",
  mortar: "#2a1410",
  yellow: "#ffd83d",
  yellowHi: "#fff3a8",
  yellowDeep: "#e0a020",
  red: "#c83020",
  redDark: "#8a1a14",
  cream: "#e8d8b8",
  couchDark: "#2a3a2a",
  couch: "#3a5a3a",
  paper: "#f4ead0",
  ink: "#1a1410",
  off: "#e8e4d8",
  dim: "#8a8478",
  shadow: "rgba(20,16,12,0.8)",
};

const PIXEL = `'VT323', 'Courier New', monospace`;
const PIXEL_BLOCK = `'Press Start 2P', 'VT323', monospace`;

// ============================================================
// Brick wall (SVG, layered + textured to feel like the screenshot)
// ============================================================
function BrickWall() {
  const rows = 26;
  const colsPerRow = 6;
  const brickW = 80;
  const brickH = 26;
  // Use a deterministic pseudo-random for reproducibility across renders
  const seed = (i) => {
    const x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  return (
    <svg
      width="480"
      height="640"
      viewBox="0 0 480 640"
      style={{ position: "absolute", inset: 0, imageRendering: "pixelated" }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="brickShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PAL.brick} />
          <stop offset="100%" stopColor={PAL.brickDark} />
        </linearGradient>
      </defs>
      <rect width="480" height="640" fill="url(#brickShade)" />
      {Array.from({ length: rows }).map((_, r) => {
        const y = r * brickH;
        const offset = r % 2 ? brickW / 2 : 0;
        return (
          <g key={r}>
            {Array.from({ length: colsPerRow + 1 }).map((_, c) => {
              const x = c * brickW - offset;
              const idx = r * 10 + c;
              const variant = seed(idx);
              let fill = PAL.brick;
              if (variant < 0.18) fill = PAL.brickDark;
              else if (variant < 0.35) fill = PAL.brickLite;
              else if (variant < 0.5) fill = "#6a302a";
              return (
                <g key={c}>
                  <rect x={x} y={y} width={brickW - 2} height={brickH - 2} fill={fill} />
                  {/* Highlight on top edge */}
                  <rect x={x} y={y} width={brickW - 2} height="1.5" fill={PAL.brickLite} opacity="0.4" />
                  {/* Shadow on bottom */}
                  <rect x={x} y={y + brickH - 3.5} width={brickW - 2} height="1.5" fill={PAL.mortar} opacity="0.5" />
                  {/* Random speckles */}
                  {seed(idx + 1) > 0.7 && (
                    <rect x={x + (seed(idx + 2) * 60)} y={y + (seed(idx + 3) * 18)} width="2" height="2" fill={PAL.mortar} opacity="0.5" />
                  )}
                </g>
              );
            })}
            {/* Mortar lines */}
            <rect x="0" y={y + brickH - 2} width="480" height="2" fill={PAL.mortar} />
          </g>
        );
      })}
    </svg>
  );
}

// Boarded windows like the screenshot
function BoardedWindow({ x, y, scale = 1, broken = false }) {
  const w = 60 * scale;
  const h = 70 * scale;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Frame */}
      <rect x="0" y="0" width={w} height={h} fill={PAL.ink} />
      {/* Glass */}
      <rect x="3" y="3" width={w - 6} height={h - 6} fill="#3a4858" />
      {/* Reflections */}
      <rect x="5" y="5" width={(w - 10) * 0.4} height={(h - 10) * 0.5} fill="#4a5868" opacity="0.5" />
      {broken && (
        <>
          <polygon
            points={`${w * 0.3},${h * 0.2} ${w * 0.7},${h * 0.4} ${w * 0.5},${h * 0.7} ${w * 0.3},${h * 0.5}`}
            fill={PAL.ink}
          />
          <line x1={w * 0.3} y1={h * 0.2} x2={w * 0.7} y2={h * 0.6} stroke={PAL.ink} strokeWidth="1.5" />
        </>
      )}
      {/* Sill */}
      <rect x="-3" y={h - 4} width={w + 6} height="5" fill={PAL.brickDark} />
      <rect x="-3" y={h - 4} width={w + 6} height="2" fill={PAL.brickLite} />
    </g>
  );
}

// ============================================================
// CITY ALERT-style chunky title
// Letters are pixel-block faux-3D: yellow face, red shadow, black outline
// ============================================================
function MoggyTitle() {
  // We want this very large, two lines
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, lineHeight: 1, userSelect: "none" }}>
      <ChunkyWord text="SOGGY" />
      <ChunkyWord text="MOGGY" />
    </div>
  );
}

function ChunkyWord({ text }) {
  // Build a thick pixel-style word using stacked text shadows
  // The trick: lots of 1px black outlines + a downward red drop + black backstop
  const outlineSteps = [];
  const r = 4; // outline radius (px)
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) + Math.abs(dy) > r) continue;
      outlineSteps.push(`${dx}px ${dy}px 0 ${PAL.ink}`);
    }
  }
  // Red drop shadow stack
  for (let i = 1; i <= 8; i++) {
    outlineSteps.push(`${i + r}px ${i + r}px 0 ${PAL.red}`);
  }
  // Final black backstop behind the red shadow
  outlineSteps.push(`${8 + r + 3}px ${8 + r + 3}px 0 ${PAL.ink}`);

  return (
    <div
      style={{
        fontFamily: PIXEL_BLOCK,
        fontSize: 64,
        fontWeight: 400,
        color: PAL.yellow,
        letterSpacing: 2,
        textShadow: outlineSteps.join(", "),
        WebkitTextStroke: "0",
        position: "relative",
      }}
    >
      {/* Inner highlight: a slightly offset bright yellow layer for the bevel */}
      <span style={{ position: "absolute", inset: 0, color: PAL.yellowHi, transform: "translate(-2px, -2px)", textShadow: "none", clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)", pointerEvents: "none" }}>
        {text}
      </span>
      {text}
    </div>
  );
}

// ============================================================
// Pixel button — chunky beveled
// ============================================================
function PixelBtn({ children, primary, big, huge, full, onClick, style = {} }) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const bg = primary ? PAL.yellow : "rgba(20,20,30,0.7)";
  const txt = primary ? PAL.ink : PAL.off;
  const size = huge ? "huge" : big ? "big" : "default";
  const dims = {
    huge:    { fontSize: 22, letterSpacing: 3, padding: "20px 60px" },
    big:     { fontSize: 18, letterSpacing: 2, padding: "16px 24px" },
    default: { fontSize: 13, letterSpacing: 1.5, padding: "10px 16px" },
  }[size];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        fontFamily: PIXEL_BLOCK,
        fontSize: dims.fontSize,
        letterSpacing: dims.letterSpacing,
        padding: dims.padding,
        background: bg,
        color: txt,
        border: `3px solid ${PAL.ink}`,
        boxShadow: active
          ? `inset 3px 3px 0 ${primary ? PAL.yellowDeep : "rgba(0,0,0,0.6)"}, 0 0 0 2px ${PAL.ink}`
          : `inset -3px -3px 0 ${primary ? PAL.yellowDeep : "rgba(0,0,0,0.6)"}, inset 3px 3px 0 ${primary ? PAL.yellowHi : "rgba(255,255,255,0.1)"}, 0 4px 0 ${PAL.ink}, 0 6px 0 rgba(0,0,0,0.4)`,
        cursor: "pointer",
        textTransform: "uppercase",
        fontWeight: 900,
        width: full ? "100%" : "auto",
        transform: active ? "translateY(4px)" : (hover ? "translateY(-1px)" : "translateY(0)"),
        transition: "transform 0.05s",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// Pixel volume slider — 10 chunks
// ============================================================
// Intensity color: bars 1-3 green, 4-7 yellow, 8-10 red — like an audio level meter
const INTENSITY = {
  green: "#7ad04a",
  greenHi: "#a8e87a",
  yellow: PAL.yellow,
  yellowHi: PAL.yellowHi,
  red: "#e84030",
  redHi: "#ff8070",
};
function barColor(idx) {
  if (idx < 3) return { fill: INTENSITY.green, hi: INTENSITY.greenHi };
  if (idx < 7) return { fill: INTENSITY.yellow, hi: INTENSITY.yellowHi };
  return { fill: INTENSITY.red, hi: INTENSITY.redHi };
}

function VolumeSlider({ value, onChange, muted, max = 10 }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value && !muted;
        const c = barColor(i);
        return (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            style={{
              width: 14,
              height: 18,
              padding: 0,
              background: filled ? c.fill : "rgba(0,0,0,0.5)",
              border: `2px solid ${PAL.ink}`,
              cursor: "pointer",
              boxShadow: filled ? `inset 1px 1px 0 ${c.hi}` : "none",
              opacity: muted ? 0.4 : 1,
            }}
            aria-label={`Set volume to ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// Difficulty list — vertical with descriptions (recommended pattern)
// Variant: 'list' (default — best for 3 options w/ descriptions)
//          'segmented' (compact alternative)
// ============================================================
function DifficultyList({ value, onChange, variant = "list" }) {
  const options = [
    { id: "explorer", name: "EXPLORER", sub: "More platforms · Forgiving fall" },
    { id: "adventurer", name: "ADVENTURER", sub: "The intended descent" },
    { id: "enlightened", name: "ENLIGHTENED", sub: "One life · Nine, actually" },
  ];

  if (variant === "segmented") {
    const current = options.find((o) => o.id === value);
    return (
      <div>
        {/* Centered, prominent DIFFICULTY title */}
        <div style={{
          fontFamily: PIXEL_BLOCK,
          fontSize: 16,
          color: PAL.yellow,
          letterSpacing: 5,
          marginBottom: 10,
          textAlign: "center",
          textShadow: `2px 2px 0 ${PAL.red}, 4px 4px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}, 1px 1px 0 ${PAL.ink}`,
        }}>
          DIFFICULTY
        </div>
        {/* Levels — secondary weight, but selection is clear */}
        <div style={{ display: "flex", border: `3px solid ${PAL.ink}`, background: "rgba(20,16,12,0.7)", boxShadow: `0 4px 0 ${PAL.ink}` }}>
          {options.map((o) => {
            const sel = value === o.id;
            return (
              <button
                key={o.id}
                onClick={() => onChange(o.id)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  background: sel ? PAL.yellow : "transparent",
                  color: sel ? PAL.ink : PAL.cream,
                  border: "none",
                  borderRight: o.id !== "enlightened" ? `2px solid ${PAL.ink}` : "none",
                  fontFamily: PIXEL,
                  fontSize: 18,
                  letterSpacing: 2,
                  cursor: "pointer",
                  fontWeight: sel ? 700 : 400,
                  textTransform: "uppercase",
                  textShadow: sel ? "none" : `1px 1px 0 ${PAL.ink}`,
                  opacity: sel ? 1 : 0.85,
                  boxShadow: sel ? `inset 0 -3px 0 ${PAL.yellowDeep}, inset 0 3px 0 ${PAL.yellowHi}` : "none",
                }}
              >
                {o.name}
              </button>
            );
          })}
        </div>
        {/* Description tied to current choice — animates on change via key */}
        <div
          key={value}
          style={{
            fontFamily: PIXEL,
            fontSize: 17,
            color: PAL.yellow,
            marginTop: 8,
            textAlign: "center",
            minHeight: 20,
            letterSpacing: 1,
            textShadow: `1px 1px 0 ${PAL.ink}`,
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          → {current?.sub}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: PIXEL, fontSize: 16, color: PAL.cream, letterSpacing: 4, marginBottom: 6, textShadow: `2px 2px 0 ${PAL.ink}` }}>
        DIFFICULTY
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "rgba(20,16,12,0.65)", border: `3px solid ${PAL.ink}`, padding: 4, boxShadow: `0 4px 0 ${PAL.ink}` }}>
        {options.map((o) => {
          const sel = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: sel ? "rgba(255,216,61,0.18)" : "transparent",
                border: "none",
                borderLeft: sel ? `4px solid ${PAL.yellow}` : `4px solid transparent`,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                color: sel ? PAL.yellow : PAL.off,
              }}
            >
              <span style={{ fontFamily: PIXEL_BLOCK, fontSize: 12, color: sel ? PAL.yellow : "transparent", width: 14, textShadow: sel ? `1px 1px 0 ${PAL.ink}` : "none" }}>
                ▶
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ fontFamily: PIXEL_BLOCK, fontSize: 14, letterSpacing: 1.5, display: "block", lineHeight: 1.2, textShadow: `2px 2px 0 ${PAL.ink}` }}>
                  {o.name}
                </span>
                <span style={{ fontFamily: PIXEL, fontSize: 15, color: sel ? PAL.cream : PAL.dim, letterSpacing: 1, lineHeight: 1.1 }}>
                  {o.sub}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Audio panel — music + SFX with volume sliders + mute toggle
// ============================================================
function AudioPanel({ music, setMusic, musicMute, setMusicMute, sfx, setSfx, sfxMute, setSfxMute, collapsed, onToggle }) {
  return (
    <div style={{ background: "rgba(20,16,12,0.85)", border: `3px solid ${PAL.ink}`, boxShadow: `0 4px 0 ${PAL.ink}` }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          borderBottom: collapsed ? "none" : `2px solid ${PAL.ink}`,
          color: PAL.cream,
          fontFamily: PIXEL,
          fontSize: 16,
          letterSpacing: 3,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textShadow: `2px 2px 0 ${PAL.ink}`,
        }}
      >
        <span>♪ AUDIO</span>
        <span style={{ fontSize: 14, color: PAL.dim }}>{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && (
        <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
          <AudioRow
            label="MUSIC"
            icon="♪"
            value={music}
            onChange={setMusic}
            muted={musicMute}
            onMuteToggle={() => setMusicMute(!musicMute)}
          />
          <AudioRow
            label="SFX"
            icon="✸"
            value={sfx}
            onChange={setSfx}
            muted={sfxMute}
            onMuteToggle={() => setSfxMute(!sfxMute)}
          />
        </div>
      )}
    </div>
  );
}

function AudioRow({ label, icon, value, onChange, muted, onMuteToggle }) {
  // Mute icon picks up the current intensity color so the row reads at a glance
  const c = barColor(Math.max(0, value - 1));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onMuteToggle}
        style={{
          width: 28,
          height: 22,
          background: muted ? PAL.mortar : "rgba(0,0,0,0.4)",
          border: `2px solid ${PAL.ink}`,
          color: muted ? "#e84030" : c.fill,
          fontFamily: PIXEL_BLOCK,
          fontSize: 11,
          cursor: "pointer",
          padding: 0,
          textShadow: `1px 1px 0 ${PAL.ink}`,
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "✕" : icon}
      </button>
      <span style={{ fontFamily: PIXEL, fontSize: 16, color: muted ? PAL.dim : PAL.off, width: 50, letterSpacing: 1.5 }}>
        {label}
      </span>
      <VolumeSlider value={value} onChange={onChange} muted={muted} />
      <span style={{ fontFamily: PIXEL, fontSize: 14, color: PAL.dim, marginLeft: "auto", minWidth: 30, textAlign: "right" }}>
        {muted ? "OFF" : `${value * 10}%`}
      </span>
    </div>
  );
}

// ============================================================
// Main start screen
// ============================================================
function StartScreen({ tweaks }) {
  const [difficulty, setDifficulty] = useState("adventurer");
  const [music, setMusic] = useState(7);
  const [musicMute, setMusicMute] = useState(false);
  const [sfx, setSfx] = useState(8);
  const [sfxMute, setSfxMute] = useState(false);
  const [audioCollapsed, setAudioCollapsed] = useState(false);
  const [hasSave] = useState(true); // could be true/false; toggle with tweak

  // If parent locks dev panel open via tweak, default to that. Otherwise it opens on click.
  const [devOpen, setDevOpen] = useState(!!tweaks.devOpen);
  React.useEffect(() => { setDevOpen(!!tweaks.devOpen); }, [tweaks.devOpen]);

  // Paused mode: button reads CONTINUE; otherwise it's a fresh START.
  const showPaused = tweaks.paused ?? false;

  return (
    <div style={{ width: 480, height: 640, position: "relative", overflow: "hidden", background: PAL.navy, border: `4px solid ${PAL.navy}`, boxShadow: `0 0 0 1px ${PAL.ink}` }}>
      {/* BACKGROUND */}
      {tweaks.useScreenshotBg ? (
        <img
          src="assets/bg-tumble.png"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            imageRendering: "pixelated",
            filter: "brightness(0.85)",
          }}
        />
      ) : (
        <>
          <BrickWall />
          {/* Decorative boarded windows behind UI */}
          <svg width="480" height="640" viewBox="0 0 480 640" style={{ position: "absolute", inset: 0 }}>
            <BoardedWindow x={32} y={40} broken />
            <BoardedWindow x={210} y={20} broken />
            <BoardedWindow x={388} y={50} />
            <BoardedWindow x={32} y={555} scale={0.7} />
            <BoardedWindow x={388} y={555} scale={0.7} broken />
          </svg>
        </>
      )}

      {/* Layout-specific overlays + content */}
      {renderLayout({
        layout: tweaks.layout || "default",
        showPaused,
        difficulty, setDifficulty,
        music, setMusic, musicMute, setMusicMute,
        sfx, setSfx, sfxMute, setSfxMute,
        audioCollapsed, setAudioCollapsed,
        difficultyVariant: tweaks.difficultyVariant,
        openDev: () => setDevOpen(true),
        devPosition: tweaks.devPosition,
      })}

      {/* Dev-Tools overlay */}
      {devOpen && (
        <DevToolsOverlay
          variant={tweaks.devVariant || "list"}
          onClose={() => setDevOpen(false)}
        />
      )}

      {/* Scanline overlay for retro feel */}
      {tweaks.scanlines && (
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }} />
      )}
    </div>
  );
}

// ============================================================
// Layout variants — all keep the center band (y 240-410) clear
// so the falling cat in the screenshot stays visible.
// ============================================================
function renderLayout(p) {
  const { layout, showPaused } = p;

  const StartButton = ({ huge: useHuge = false }) => (
    <PixelBtn primary big={!useHuge} huge={useHuge} onClick={() => alert(showPaused ? "▶ Continuing!" : "▶ Starting!")}>
      {showPaused ? "▶ CONTINUE" : "▶ START"}
    </PixelBtn>
  );
  const HintLine = ({ style }) => (
    <div style={{
      textAlign: "center",
      fontFamily: PIXEL, fontSize: 14, color: PAL.cream, opacity: 0.75,
      letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}`, ...style,
    }}>
      {showPaused ? "[SPACE] · PAUSED ON FLOOR 4" : "[SPACE] OR CLICK"}
    </div>
  );
  const Difficulty = () => (
    <DifficultyList value={p.difficulty} onChange={p.setDifficulty} variant={p.difficultyVariant} />
  );
  const Audio = () => (
    <AudioPanel
      music={p.music} setMusic={p.setMusic}
      musicMute={p.musicMute} setMusicMute={p.setMusicMute}
      sfx={p.sfx} setSfx={p.setSfx}
      sfxMute={p.sfxMute} setSfxMute={p.setSfxMute}
      collapsed={p.audioCollapsed} onToggle={() => p.setAudioCollapsed(!p.audioCollapsed)}
    />
  );

  // ---- 1. SPLIT — title top; START deep; difficulty + audio side-by-side at bottom
  if (layout === "split") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: "linear-gradient(180deg, rgba(20,16,12,0.85) 0%, rgba(20,16,12,0.4) 70%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 280, background: "linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.7) 30%, rgba(20,16,12,0.92) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 24, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
          <MoggyTitle />
        </div>
        {/* START — deep, centered, above the side-by-side blocks */}
        <div style={{ position: "absolute", bottom: 240, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2 }}>
          <StartButton />
          <HintLine />
        </div>
        {/* Difficulty (LEFT) + Audio (RIGHT) — vertical columns, side-by-side */}
        <div style={{ position: "absolute", bottom: 18, left: 14, right: 14, display: "flex", gap: 10, alignItems: "flex-start", zIndex: 2 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DifficultyVertical value={p.difficulty} onChange={p.setDifficulty} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AudioVertical
              music={p.music} setMusic={p.setMusic}
              musicMute={p.musicMute} setMusicMute={p.setMusicMute}
              sfx={p.sfx} setSfx={p.setSfx}
              sfxMute={p.sfxMute} setSfxMute={p.setSfxMute}
            />
          </div>
        </div>
      </>
    );
  }

  // ---- 2. FRAMED — title top, START + difficulty in narrow side rails, audio bottom strip
  if (layout === "framed") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(180deg, rgba(20,16,12,0.9) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 130, background: "linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.92) 100%)", pointerEvents: "none" }} />
        {/* Title */}
        <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
          <MoggyTitle />
        </div>
        {/* START — pinned in middle band on the LEFT edge so cat stays clear */}
        <div style={{ position: "absolute", top: 250, left: 18, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <StartButton />
          <HintLine style={{ textAlign: "left" }} />
        </div>
        {/* Difficulty bottom-left, Audio bottom-right */}
        <div style={{ position: "absolute", bottom: 18, left: 18, right: 18, display: "flex", flexDirection: "column", gap: 8, zIndex: 2 }}>
          <Difficulty />
          <Audio />
        </div>
      </>
    );
  }

  // ---- 3. SIDE-RAIL — title top; controls all in a narrow LEFT rail (cat owns right 60%)
  if (layout === "rail") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: "linear-gradient(180deg, rgba(20,16,12,0.8) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 200, left: 0, width: 230, bottom: 0, background: "linear-gradient(90deg, rgba(20,16,12,0.88) 0%, rgba(20,16,12,0.85) 70%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
          <MoggyTitle />
        </div>
        <div style={{ position: "absolute", top: 230, left: 16, width: 230, display: "flex", flexDirection: "column", gap: 14, zIndex: 2 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <StartButton />
            <HintLine />
          </div>
          <Difficulty />
          <Audio />
        </div>
      </>
    );
  }

  // ---- 4. FLOATING — title top; Single translucent CARD at bottom holds all controls,
  //       hovering above the floor of the screenshot so the cat tumbles freely above it
  if (layout === "card") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(180deg, rgba(20,16,12,0.85) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
          <MoggyTitle />
        </div>
        {/* Floating controls card */}
        <div style={{
          position: "absolute", left: 18, right: 18, bottom: 18,
          background: "rgba(20,16,12,0.85)",
          border: `4px solid ${PAL.ink}`,
          boxShadow: `0 6px 0 ${PAL.ink}, inset 0 0 0 2px rgba(255,255,255,0.06)`,
          padding: 14, zIndex: 2,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "center" }}><StartButton /></div>
          <HintLine style={{ marginTop: -2 }} />
          <div style={{ height: 1, background: PAL.ink, opacity: 0.6 }} />
          <Difficulty />
          <Audio />
        </div>
      </>
    );
  }

  // ---- 5. SIDES — difficulty on LEFT rail, audio on RIGHT rail, both vertical
  //       Title top, START deep in center, cat owns the vertical center axis.
  if (layout === "sides") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(180deg, rgba(20,16,12,0.85) 0%, transparent 100%)", pointerEvents: "none" }} />
        {/* Left rail shade */}
        <div style={{ position: "absolute", top: 200, left: 0, width: 150, bottom: 0, background: "linear-gradient(90deg, rgba(20,16,12,0.85) 0%, rgba(20,16,12,0.7) 70%, transparent 100%)", pointerEvents: "none" }} />
        {/* Right rail shade */}
        <div style={{ position: "absolute", top: 200, right: 0, width: 150, bottom: 0, background: "linear-gradient(270deg, rgba(20,16,12,0.85) 0%, rgba(20,16,12,0.7) 70%, transparent 100%)", pointerEvents: "none" }} />

        {/* Title */}
        <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
          <MoggyTitle />
        </div>

        {/* LEFT rail — Difficulty stacked vertically */}
        <div style={{ position: "absolute", top: 220, left: 12, width: 145, zIndex: 2 }}>
          <DifficultyVertical value={p.difficulty} onChange={p.setDifficulty} />
        </div>

        {/* RIGHT rail — Audio stacked vertically */}
        <div style={{ position: "absolute", top: 220, right: 12, width: 145, zIndex: 2 }}>
          <AudioVertical
            music={p.music} setMusic={p.setMusic}
            musicMute={p.musicMute} setMusicMute={p.setMusicMute}
            sfx={p.sfx} setSfx={p.setSfx}
            sfxMute={p.sfxMute} setSfxMute={p.setSfxMute}
          />
        </div>

        {/* START deep in center */}
        <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2 }}>
          <StartButton />
          <HintLine />
        </div>
      </>
    );
  }

  // ---- 6/7/8. FLAT variants — flatter, ~1/3 thinner controls placed deeper
  if (layout === "flat-stack") return <FlatLayoutA {...p} StartButton={StartButton} HintLine={HintLine} />;
  if (layout === "flat-grid")  return <FlatLayoutB {...p} StartButton={StartButton} HintLine={HintLine} />;
  if (layout === "flat-ribbon") return <FlatLayoutC {...p} StartButton={StartButton} HintLine={HintLine} />;

  // default = split
  return renderLayout({ ...p, layout: "split" });
}

// Vertical-rail Difficulty: stacked buttons (no segmented control)
function DifficultyVertical({ value, onChange }) {
  const options = [
    { id: "explorer", name: "EXPLORER", sub: "Forgiving" },
    { id: "adventurer", name: "ADVENTURER", sub: "Standard" },
    { id: "enlightened", name: "ENLIGHTENED", sub: "Brutal" },
  ];
  return (
    <div>
      <div style={{
        fontFamily: PIXEL_BLOCK, fontSize: 12, color: PAL.yellow,
        letterSpacing: 3, textAlign: "center", marginBottom: 8,
        textShadow: `2px 2px 0 ${PAL.red}, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}, 1px 1px 0 ${PAL.ink}`,
      }}>
        DIFFICULTY
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((o) => {
          const sel = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              style={{
                padding: "8px 6px",
                background: sel ? PAL.yellow : "rgba(20,16,12,0.7)",
                color: sel ? PAL.ink : PAL.cream,
                border: `3px solid ${PAL.ink}`,
                fontFamily: PIXEL, fontSize: 16, letterSpacing: 1,
                cursor: "pointer", textAlign: "center",
                boxShadow: sel
                  ? `inset 0 -3px 0 ${PAL.yellowDeep}, inset 0 3px 0 ${PAL.yellowHi}, 0 3px 0 ${PAL.ink}`
                  : `0 3px 0 ${PAL.ink}`,
                textShadow: sel ? "none" : `1px 1px 0 ${PAL.ink}`,
                lineHeight: 1.05,
              }}
            >
              <div style={{ fontWeight: sel ? 700 : 400 }}>{o.name}</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 1 }}>{o.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Vertical-rail Audio: label + mute icon row, slider below, percent — for MUSIC and SFX
function AudioVertical({ music, setMusic, musicMute, setMusicMute, sfx, setSfx, sfxMute, setSfxMute }) {
  return (
    <div>
      <div style={{
        fontFamily: PIXEL_BLOCK, fontSize: 12, color: PAL.yellow,
        letterSpacing: 3, textAlign: "center", marginBottom: 8,
        textShadow: `2px 2px 0 ${PAL.red}, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}, 1px 1px 0 ${PAL.ink}`,
      }}>
        AUDIO
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <AudioVerticalRow label="MUSIC" icon="♪" value={music} onChange={setMusic} muted={musicMute} onMuteToggle={() => setMusicMute(!musicMute)} />
        <AudioVerticalRow label="SFX" icon="✸" value={sfx} onChange={setSfx} muted={sfxMute} onMuteToggle={() => setSfxMute(!sfxMute)} />
      </div>
    </div>
  );
}

function AudioVerticalRow({ label, icon, value, onChange, muted, onMuteToggle }) {
  const c = barColor(Math.max(0, value - 1));
  return (
    <div style={{ background: "rgba(20,16,12,0.75)", border: `3px solid ${PAL.ink}`, padding: "6px 8px", boxShadow: `0 3px 0 ${PAL.ink}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <button
          onClick={onMuteToggle}
          style={{
            width: 22, height: 20, padding: 0,
            background: muted ? PAL.mortar : "rgba(0,0,0,0.4)",
            border: `2px solid ${PAL.ink}`,
            color: muted ? "#e84030" : c.fill,
            fontFamily: PIXEL_BLOCK, fontSize: 10, cursor: "pointer",
            textShadow: `1px 1px 0 ${PAL.ink}`,
          }}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "✕" : icon}
        </button>
        <span style={{ fontFamily: PIXEL, fontSize: 16, color: muted ? PAL.dim : PAL.off, letterSpacing: 1.5, flex: 1 }}>{label}</span>
        <span style={{ fontFamily: PIXEL, fontSize: 13, color: PAL.dim, minWidth: 28, textAlign: "right" }}>
          {muted ? "OFF" : `${value * 10}%`}
        </span>
      </div>
      <VolumeSlider value={value} onChange={onChange} muted={muted} max={10} />
    </div>
  );
}

// ============================================================
// FLAT components — horizontal, ~1/3 thinner, designed to sit DEEP at the bottom
// ============================================================

// Flat difficulty: label + 3 inline chips on one row (option to show desc beneath)
function DifficultyFlat({ value, onChange, showDesc = true, compact = false }) {
  const options = [
    { id: "explorer", name: "EXPLORER", sub: "Forgiving" },
    { id: "adventurer", name: "ADVENTURER", sub: "Standard" },
    { id: "enlightened", name: "ENLIGHTENED", sub: "Brutal" },
  ];
  const current = options.find((o) => o.id === value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: PIXEL_BLOCK, fontSize: compact ? 10 : 11, color: PAL.yellow,
          letterSpacing: 2, minWidth: compact ? 56 : 70,
          textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        }}>
          DIFFICULTY
        </span>
        <div style={{ display: "flex", flex: 1, border: `3px solid ${PAL.ink}`, boxShadow: `0 3px 0 ${PAL.ink}` }}>
          {options.map((o, i) => {
            const sel = value === o.id;
            return (
              <button
                key={o.id}
                onClick={() => onChange(o.id)}
                style={{
                  flex: 1,
                  padding: compact ? "5px 2px" : "6px 2px",
                  background: sel ? PAL.yellow : "rgba(20,16,12,0.75)",
                  color: sel ? PAL.ink : PAL.cream,
                  border: "none",
                  borderRight: i < options.length - 1 ? `2px solid ${PAL.ink}` : "none",
                  fontFamily: PIXEL,
                  fontSize: compact ? 12 : 13,
                  letterSpacing: 1,
                  cursor: "pointer",
                  fontWeight: sel ? 700 : 400,
                  textShadow: sel ? "none" : `1px 1px 0 ${PAL.ink}`,
                  boxShadow: sel ? `inset 0 -3px 0 ${PAL.yellowDeep}, inset 0 3px 0 ${PAL.yellowHi}` : "none",
                }}
              >
                {o.name}
              </button>
            );
          })}
        </div>
      </div>
      {showDesc && (
        <div key={value} style={{
          fontFamily: PIXEL, fontSize: 12, color: PAL.yellow,
          textAlign: "center", letterSpacing: 1,
          textShadow: `1px 1px 0 ${PAL.ink}`,
          animation: "fadeIn 0.25s ease-out",
          opacity: 0.95,
        }}>
          → {current?.sub}
        </div>
      )}
    </div>
  );
}

// Flat audio row — single horizontal line: mute, label, slider, percent
function AudioFlatRow({ label, icon, value, onChange, muted, onMuteToggle, labelWidth = 56 }) {
  const c = barColor(Math.max(0, value - 1));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={onMuteToggle}
        style={{
          width: 22, height: 18, padding: 0,
          background: muted ? PAL.mortar : "rgba(0,0,0,0.4)",
          border: `2px solid ${PAL.ink}`,
          color: muted ? "#e84030" : c.fill,
          fontFamily: PIXEL_BLOCK, fontSize: 10, cursor: "pointer",
          textShadow: `1px 1px 0 ${PAL.ink}`,
          flexShrink: 0,
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "✕" : icon}
      </button>
      <span style={{ fontFamily: PIXEL, fontSize: 13, color: muted ? PAL.dim : PAL.off, letterSpacing: 1.5, width: labelWidth, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <VolumeSlider value={value} onChange={onChange} muted={muted} max={10} />
      </div>
      <span style={{ fontFamily: PIXEL, fontSize: 12, color: PAL.dim, minWidth: 26, textAlign: "right", flexShrink: 0 }}>
        {muted ? "OFF" : `${value * 10}%`}
      </span>
    </div>
  );
}

// Flat audio panel — heading + 2 horizontal rows
function AudioFlat({ music, setMusic, musicMute, setMusicMute, sfx, setSfx, sfxMute, setSfxMute, headingInline = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {!headingInline && (
        <div style={{
          fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
          letterSpacing: 3,
          textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        }}>
          AUDIO
        </div>
      )}
      <AudioFlatRow label="MUSIC" icon="♪" value={music} onChange={setMusic} muted={musicMute} onMuteToggle={() => setMusicMute(!musicMute)} />
      <AudioFlatRow label="SFX"   icon="✸" value={sfx}   onChange={setSfx}   muted={sfxMute}   onMuteToggle={() => setSfxMute(!sfxMute)} />
    </div>
  );
}

// ============================================================
// FLAT LAYOUTS — three variants of "flatter, thinner, deeper"
// ============================================================

// Stacked-column difficulty for narrow side-by-side use:
// label on top, then 3 thin buttons stacked vertically. Used inside a half-width column.
function DifficultyColumn({ value, onChange }) {
  const options = [
    { id: "explorer", name: "EXPLORER", sub: "Just lookin'" },
    { id: "adventurer", name: "ADVENTURER", sub: "The sweet spot" },
    { id: "enlightened", name: "ENLIGHTENED", sub: "Ommm..." },
  ];
  const current = options.find((o) => o.id === value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
        letterSpacing: 2, textAlign: "center",
        textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
      }}>
        DIFFICULTY
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, border: `3px solid ${PAL.ink}`, boxShadow: `0 3px 0 ${PAL.ink}` }}>
        {options.map((o, i) => {
          const sel = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              style={{
                padding: "5px 4px",
                background: sel ? PAL.yellow : "rgba(20,16,12,0.75)",
                color: sel ? PAL.ink : PAL.cream,
                border: "none",
                borderBottom: i < options.length - 1 ? `2px solid ${PAL.ink}` : "none",
                fontFamily: PIXEL,
                fontSize: 12,
                letterSpacing: 1,
                cursor: "pointer",
                fontWeight: sel ? 700 : 400,
                textShadow: sel ? "none" : `1px 1px 0 ${PAL.ink}`,
                boxShadow: sel ? `inset 0 -2px 0 ${PAL.yellowDeep}, inset 0 2px 0 ${PAL.yellowHi}` : "none",
              }}
            >
              {o.name}
            </button>
          );
        })}
      </div>
      {/* Description tied to current choice — re-mounts on change for fade-in */}
      <div
        key={value}
        style={{
          fontFamily: PIXEL,
          fontSize: 12,
          marginTop: 2,
          textAlign: "center",
          minHeight: 14,
          letterSpacing: 0.5,
          textShadow: `1px 1px 0 ${PAL.ink}`,
          animation: "fadeIn 0.25s ease-out",
          lineHeight: 1.1,
        }}
      >
        <span style={{ color: "#7ad04a" }}>→ </span>
        <span style={{ color: "#7ad04a" }}>{current?.sub}</span>
      </div>
    </div>
  );
}

// All three flat layouts now use DIFFICULTY (left) + AUDIO (right) SIDE-BY-SIDE,
// flatter than v1, placed deeper. Each variant tries a different proportion.

function FlatLayoutA(p) {
  // SIDE-BY-SIDE A: equal halves, single combined panel, divider down the middle
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: "linear-gradient(180deg, rgba(20,16,12,0.88) 0%, rgba(20,16,12,0.4) 70%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180, background: "linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.65) 35%, rgba(20,16,12,0.95) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 24, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
        <MoggyTitle />
      </div>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 2 }}>
        <p.StartButton />
        <p.HintLine />
      </div>
      <div style={{
        position: "absolute", left: 14, right: 14, bottom: 14,
        background: "rgba(20,16,12,0.88)",
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 4px 0 ${PAL.ink}`,
        padding: "10px 12px",
        display: "flex", alignItems: "stretch", gap: 12,
        zIndex: 2,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <DifficultyColumn value={p.difficulty} onChange={p.setDifficulty} />
        </div>
        <div style={{ width: 2, background: PAL.ink, opacity: 0.6, alignSelf: "stretch" }} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{
            fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
            letterSpacing: 2, textAlign: "center",
            textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
          }}>
            AUDIO
          </div>
          <AudioFlatRow label="MUSIC" icon="♪" value={p.music} onChange={p.setMusic} muted={p.musicMute} onMuteToggle={() => p.setMusicMute(!p.musicMute)} labelWidth={48} />
          <AudioFlatRow label="SFX" icon="✸" value={p.sfx} onChange={p.setSfx} muted={p.sfxMute} onMuteToggle={() => p.setSfxMute(!p.sfxMute)} labelWidth={48} />
        </div>
      </div>
    </>
  );
}

function FlatLayoutB(p) {
  // SIDE-BY-SIDE B: two SEPARATE panels, equal halves, with a small gap between them
  // LOCKED layout — bigger START, DEV TOOLS chip (locked bottom-LEFT), HIGHSCORE chip (bottom-RIGHT)
  const highscore = p.highscore != null ? p.highscore : 12480;
  const devChipStyle = {
    position: "absolute", bottom: 4, left: 14, zIndex: 3,
    fontFamily: PIXEL, fontSize: 14, letterSpacing: 2,
    color: PAL.cream, opacity: 0.9,
    background: "rgba(20,16,12,0.8)",
    border: `2px solid ${PAL.ink}`,
    padding: "5px 10px",
    cursor: "pointer",
    textShadow: `1px 1px 0 ${PAL.ink}`,
    boxShadow: `0 3px 0 ${PAL.ink}`,
  };

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: "linear-gradient(180deg, rgba(20,16,12,0.88) 0%, rgba(20,16,12,0.4) 70%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180, background: "linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.65) 35%, rgba(20,16,12,0.95) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 24, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
        <MoggyTitle />
      </div>
      {/* DEV TOOLS chip — locked bottom-LEFT */}
      <button
        onClick={() => p.openDev && p.openDev()}
        style={devChipStyle}
        onMouseEnter={(e) => { e.currentTarget.style.color = PAL.yellow; e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = PAL.cream; e.currentTarget.style.opacity = "0.9"; }}
        title="Open developer tools"
      >
        ⚙ DEV TOOLS
      </button>
      {/* HIGHSCORE chip — bottom-RIGHT, bold/present */}
      <div style={{
        position: "absolute", bottom: 4, right: 14, zIndex: 3,
        background: "rgba(20,16,12,0.92)",
        border: `2px solid ${PAL.ink}`,
        padding: "4px 10px 5px",
        boxShadow: `0 3px 0 ${PAL.ink}`,
        display: "flex", alignItems: "baseline", gap: 8,
      }}>
        <span style={{
          fontFamily: PIXEL_BLOCK, fontSize: 9, color: PAL.yellow,
          letterSpacing: 2,
          textShadow: `1px 1px 0 ${PAL.ink}`,
        }}>
          HI-SCORE
        </span>
        <span style={{
          fontFamily: PIXEL_BLOCK, fontSize: 14, color: PAL.cream,
          letterSpacing: 1,
          textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
        }}>
          {highscore.toLocaleString()}
        </span>
      </div>
      {/* START — 15px higher than before (was top:355, now 340) */}
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 2 }}>
        <p.StartButton huge />
        <p.HintLine />
      </div>
      {/* Difficulty + Audio — 15px deeper than before (was bottom:49, now 34); stretched to equal heights */}
      <div style={{
        position: "absolute", left: 14, right: 14, bottom: 34,
        display: "flex", alignItems: "stretch", gap: 10,
        zIndex: 2,
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          background: "rgba(20,16,12,0.88)",
          border: `3px solid ${PAL.ink}`,
          boxShadow: `0 4px 0 ${PAL.ink}`,
          padding: "13px 10px 8px",
        }}>
          <DifficultyColumn value={p.difficulty} onChange={p.setDifficulty} />
        </div>
        <div style={{
          flex: 1, minWidth: 0,
          background: "rgba(20,16,12,0.88)",
          border: `3px solid ${PAL.ink}`,
          boxShadow: `0 4px 0 ${PAL.ink}`,
          padding: "13px 10px 8px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{
            fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
            letterSpacing: 2, textAlign: "center",
            textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
          }}>
            AUDIO
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", flex: 1 }}>
            <AudioFlatRow label="MUSIC" icon="♪" value={p.music} onChange={p.setMusic} muted={p.musicMute} onMuteToggle={() => p.setMusicMute(!p.musicMute)} labelWidth={44} />
            <AudioFlatRow label="SFX" icon="✸" value={p.sfx} onChange={p.setSfx} muted={p.sfxMute} onMuteToggle={() => p.setSfxMute(!p.sfxMute)} labelWidth={44} />
          </div>
        </div>
      </div>
    </>
  );
}

function FlatLayoutC(p) {
  // SIDE-BY-SIDE C: difficulty as a wide horizontal segmented control (gets the larger half),
  // audio compressed into the right half — both sit in a single thin ribbon, no nested panels
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: "linear-gradient(180deg, rgba(20,16,12,0.88) 0%, rgba(20,16,12,0.4) 70%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160, background: "linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.6) 30%, rgba(20,16,12,0.95) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 24, left: 28, right: 28, display: "flex", justifyContent: "center", zIndex: 2 }}>
        <MoggyTitle />
      </div>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 2 }}>
        <p.StartButton />
        <p.HintLine />
      </div>
      {/* Two slim ribbons side-by-side, no enclosing panel */}
      <div style={{
        position: "absolute", left: 14, right: 14, bottom: 14,
        display: "flex", alignItems: "stretch", gap: 10,
        zIndex: 2,
      }}>
        {/* LEFT — difficulty as label-on-top + 3 inline chips */}
        <div style={{ flex: 1.1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{
            fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
            letterSpacing: 2, textAlign: "center",
            textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
          }}>
            DIFFICULTY
          </div>
          <DifficultyFlat value={p.difficulty} onChange={p.setDifficulty} showDesc={false} compact />
        </div>
        {/* RIGHT — audio: label on top + 2 mini ribbons */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{
            fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
            letterSpacing: 2, textAlign: "center",
            textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
          }}>
            AUDIO
          </div>
          <AudioFlatRow label="MUSIC" icon="♪" value={p.music} onChange={p.setMusic} muted={p.musicMute} onMuteToggle={() => p.setMusicMute(!p.musicMute)} labelWidth={42} />
          <AudioFlatRow label="SFX" icon="✸" value={p.sfx} onChange={p.setSfx} muted={p.sfxMute} onMuteToggle={() => p.setSfxMute(!p.sfxMute)} labelWidth={42} />
        </div>
      </div>
    </>
  );
}

// ============================================================
// DEV TOOLS overlay — same brick bg, "DEV TOOLS" yellow title.
// 3 variants: list (full vertical scroll), tabs (categorized), cards (2-col grid).
// Options curated for Soggy Moggy (vertical platformer about a falling stuffed cat):
//   START AT FLOOR — scrubber to skip to any level
//   START Y — drop the cat from any altitude on chosen level
//   GOD MODE — invincibility
//   INFINITE LIVES — toggle
//   SHOW HITBOXES — visualize collision boxes
//   SHOW FPS — frame counter overlay
//   SLOW-MO — speed multiplier slider
//   GRAVITY x — signature falling-cat physics knob
//   RNG SEED — reproducible runs
//   RESET SAVE — destructive
// ============================================================
function DevToolsOverlay({ variant, onClose }) {
  const [floor, setFloor] = useState(1);
  const [startY, setStartY] = useState(0);
  const [god, setGod] = useState(false);
  const [infLives, setInfLives] = useState(false);
  const [hitboxes, setHitboxes] = useState(false);
  const [fps, setFps] = useState(true);
  const [slowMo, setSlowMo] = useState(1);
  const [gravity, setGravity] = useState(1);
  const [seed, setSeed] = useState("MOGGY-7421");

  const TOTAL_LEVELS = 3;

  const allOptions = {
    start: [
      { kind: "scrubber", label: "START AT LEVEL", value: floor, set: setFloor, min: 1, max: TOTAL_LEVELS, format: (v) => `${v} / ${TOTAL_LEVELS}` },
      { kind: "slider", label: "DROP HEIGHT (Y)", value: startY, set: setStartY, min: 0, max: 100, format: (v) => `${v}%`, sub: "Where the cat spawns on the level" },
      { kind: "text", label: "RNG SEED", value: seed, set: setSeed, sub: "Reproduce the same run for testing" },
    ],
    player: [
      { kind: "toggle", label: "GOD MODE", value: god, set: setGod, sub: "No fall damage · No hazards" },
      { kind: "toggle", label: "INFINITE LIVES", value: infLives, set: setInfLives, sub: "Lives don't decrement" },
      { kind: "slider", label: "GRAVITY", value: Math.round(gravity * 10), set: (v) => setGravity(v / 10), min: 0, max: 30, format: () => `${gravity.toFixed(1)}×` },
      { kind: "slider", label: "TIME SCALE", value: Math.round(slowMo * 10), set: (v) => setSlowMo(v / 10), min: 1, max: 20, format: () => `${slowMo.toFixed(1)}×` },
      { kind: "button", label: "RESET HIGHSCORE", danger: true, sub: "Clears the saved best score" },
    ],
    visual: [
      { kind: "toggle", label: "SHOW HITBOXES", value: hitboxes, set: setHitboxes, sub: "Render collision shapes" },
      { kind: "toggle", label: "SHOW FPS", value: fps, set: setFps, sub: "Frame counter top-left" },
    ],
  };

  const Title = () => (
    <div style={{
      fontFamily: PIXEL_BLOCK, fontSize: 18, color: PAL.yellow,
      letterSpacing: 4, textAlign: "center",
      lineHeight: 1.2, padding: "0 8px",
      textShadow: `2px 2px 0 ${PAL.red}, 3px 3px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}, 1px 1px 0 ${PAL.ink}`,
    }}>
      DEV TOOLS
    </div>
  );

  const CloseBtn = () => (
    <button
      onClick={onClose}
      style={{
        position: "absolute", top: 14, right: 14,
        width: 35, height: 35, padding: 0,
        background: "rgba(20,16,12,0.85)",
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 3px 0 ${PAL.ink}`,
        color: PAL.cream,
        fontFamily: PIXEL_BLOCK, fontSize: 16,
        cursor: "pointer",
        zIndex: 4,
        textShadow: `1px 1px 0 ${PAL.ink}`,
      }}
      title="Close"
    >
      ✕
    </button>
  );

  const CloseTextBtn = () => (
    <button
      onClick={onClose}
      style={{
        position: "absolute", bottom: 14, right: 14,
        padding: "6px 14px",
        background: "rgba(20,16,12,0.85)",
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 3px 0 ${PAL.ink}`,
        color: PAL.cream,
        fontFamily: PIXEL_BLOCK, fontSize: 12, letterSpacing: 2,
        cursor: "pointer",
        zIndex: 4,
        textShadow: `1px 1px 0 ${PAL.ink}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = PAL.yellow; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = PAL.cream; }}
      title="Close dev tools"
    >
      CLOSE
    </button>
  );

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(20,16,12,0.55)",
      zIndex: 5,
      display: "flex", flexDirection: "column",
    }}>
      <CloseBtn />
      <CloseTextBtn />
      {/* SOGGY MOGGY title stays in same position as the start screen */}
      <div style={{ paddingTop: 24, paddingBottom: 6, display: "flex", justifyContent: "center" }}>
        <MoggyTitle />
      </div>
      {/* DEV TOOLS sub-heading — pushed 45px deeper, content follows */}
      <div style={{ paddingTop: 59, paddingBottom: 10 }}>
        <Title />
      </div>
      <div style={{
        flex: 1, minHeight: 0, overflow: "hidden",
        margin: "0 14px 14px",
        background: "rgba(20,16,12,0.92)",
        border: `3px solid ${PAL.ink}`,
        boxShadow: `0 4px 0 ${PAL.ink}`,
        display: "flex", flexDirection: "column",
      }}>
        {variant === "list"  && <DevList options={allOptions} />}
        {variant === "tabs"  && <DevTabs options={allOptions} />}
        {variant === "cards" && <DevCards options={allOptions} />}
      </div>
    </div>
  );
}

// ----- shared dev-row controls
function DevToggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 22, padding: 0,
        background: value ? PAL.yellow : "rgba(20,16,12,0.7)",
        color: value ? PAL.ink : PAL.dim,
        border: `2px solid ${PAL.ink}`,
        fontFamily: PIXEL_BLOCK, fontSize: 10, letterSpacing: 1,
        cursor: "pointer",
        boxShadow: value ? `inset 0 -2px 0 ${PAL.yellowDeep}, inset 0 2px 0 ${PAL.yellowHi}` : "none",
        textShadow: value ? "none" : `1px 1px 0 ${PAL.ink}`,
        flexShrink: 0,
      }}
    >
      {value ? "ON" : "OFF"}
    </button>
  );
}

function DevSlider({ value, min, max, onChange }) {
  return (
    <input
      type="range" min={min} max={max} value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      style={{ flex: 1, minWidth: 60, accentColor: PAL.yellow, cursor: "pointer" }}
    />
  );
}

function DevScrubber({ value, min, max, onChange }) {
  // Pixel-art floor scrubber — segmented bar, click to jump
  const cells = [];
  for (let i = min; i <= max; i++) {
    const sel = i === value;
    const passed = i < value;
    cells.push(
      <button
        key={i}
        onClick={() => onChange(i)}
        style={{
          flex: 1, minWidth: 0, height: 22, padding: 0,
          background: sel ? PAL.yellow : passed ? "rgba(255,216,61,0.35)" : "rgba(20,16,12,0.7)",
          color: sel ? PAL.ink : PAL.cream,
          border: "none",
          borderRight: i < max ? `1px solid ${PAL.ink}` : "none",
          fontFamily: PIXEL, fontSize: 11,
          cursor: "pointer",
          fontWeight: sel ? 700 : 400,
          boxShadow: sel ? `inset 0 -2px 0 ${PAL.yellowDeep}, inset 0 2px 0 ${PAL.yellowHi}` : "none",
        }}
        title={`Floor ${i}`}
      >
        {sel ? i : ""}
      </button>
    );
  }
  return (
    <div style={{ display: "flex", flex: 1, minWidth: 0, border: `2px solid ${PAL.ink}`, boxShadow: `0 2px 0 ${PAL.ink}` }}>
      {cells}
    </div>
  );
}

function DevTextInput({ value, onChange }) {
  return (
    <input
      type="text" value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1, minWidth: 0,
        background: "rgba(0,0,0,0.45)",
        border: `2px solid ${PAL.ink}`,
        color: PAL.cream,
        fontFamily: PIXEL, fontSize: 14, letterSpacing: 2,
        padding: "4px 8px",
        outline: "none",
        textShadow: `1px 1px 0 ${PAL.ink}`,
      }}
    />
  );
}

function DevButton({ label, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: danger ? (hover ? "#e84030" : "rgba(232,64,48,0.25)") : "rgba(20,16,12,0.7)",
        color: danger ? PAL.cream : PAL.cream,
        border: `2px solid ${danger ? "#e84030" : PAL.ink}`,
        fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
        padding: "6px 10px",
        cursor: "pointer",
        boxShadow: `0 2px 0 ${PAL.ink}`,
        textShadow: `1px 1px 0 ${PAL.ink}`,
      }}
    >
      {label}
    </button>
  );
}

function DevRow({ opt, layout = "row" }) {
  // layout=row: label left, control right (inline). layout=stack: label on top, control below.
  const labelEl = (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span style={{
        fontFamily: PIXEL, fontSize: 14, color: PAL.cream, letterSpacing: 2,
        textShadow: `1px 1px 0 ${PAL.ink}`, lineHeight: 1.1,
      }}>
        {opt.label}
      </span>
      {opt.sub && (
        <span style={{ fontFamily: PIXEL, fontSize: 12, color: PAL.dim, letterSpacing: 1, lineHeight: 1.1 }}>
          {opt.sub}
        </span>
      )}
    </div>
  );

  let control;
  if (opt.kind === "toggle") {
    control = <DevToggle value={opt.value} onChange={opt.set} />;
  } else if (opt.kind === "slider") {
    control = (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <DevSlider value={opt.value} min={opt.min} max={opt.max} onChange={opt.set} />
        <span style={{ fontFamily: PIXEL, fontSize: 13, color: PAL.yellow, minWidth: 44, textAlign: "right", textShadow: `1px 1px 0 ${PAL.ink}` }}>
          {opt.format ? opt.format(opt.value) : opt.value}
        </span>
      </div>
    );
  } else if (opt.kind === "scrubber") {
    control = (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <DevScrubber value={opt.value} min={opt.min} max={opt.max} onChange={opt.set} />
        <span style={{ fontFamily: PIXEL, fontSize: 13, color: PAL.yellow, minWidth: 50, textAlign: "right", textShadow: `1px 1px 0 ${PAL.ink}` }}>
          {opt.format ? opt.format(opt.value) : opt.value}
        </span>
      </div>
    );
  } else if (opt.kind === "text") {
    control = <DevTextInput value={opt.value} onChange={opt.set} />;
  } else if (opt.kind === "button") {
    control = <DevButton label={opt.label.includes("RESET") ? "WIPE" : "RUN"} danger={opt.danger} />;
  }

  if (layout === "stack") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {labelEl}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>{control}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", minWidth: 0 }}>
      <div style={{ width: 130, flexShrink: 0 }}>{labelEl}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>{control}</div>
    </div>
  );
}

// ----- VARIANT 1: LIST — single scrolling column with section headers
function DevList({ options }) {
  const sectionTitle = (txt) => (
    <div style={{
      fontFamily: PIXEL_BLOCK, fontSize: 11, color: PAL.yellow,
      letterSpacing: 3, padding: "10px 14px 4px",
      borderBottom: `2px solid ${PAL.ink}`,
      textShadow: `1px 1px 0 ${PAL.red}, 2px 2px 0 ${PAL.ink}, -1px -1px 0 ${PAL.ink}, 1px -1px 0 ${PAL.ink}, -1px 1px 0 ${PAL.ink}`,
    }}>
      {txt}
    </div>
  );
  const sectionContent = (rows) => (
    <div style={{ padding: "4px 14px" }}>
      {rows.map((opt, i) => <DevRow key={i} opt={opt} />)}
    </div>
  );
  return (
    <div style={{ overflow: "auto", flex: 1 }}>
      {sectionTitle("» START")}
      {sectionContent(options.start)}
      {sectionTitle("» PLAYER")}
      {sectionContent(options.player)}
      {sectionTitle("» VISUAL DEBUG")}
      {sectionContent(options.visual)}
      {sectionTitle("» DANGER ZONE")}
      <div style={{ padding: "8px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {(options.danger || []).map((opt, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: PIXEL, fontSize: 14, color: PAL.cream, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}` }}>{opt.label}</div>
              {opt.sub && <div style={{ fontFamily: PIXEL, fontSize: 12, color: PAL.dim }}>{opt.sub}</div>}
            </div>
            <DevButton label={opt.label.includes("RESET") ? "WIPE" : "RUN"} danger={opt.danger} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- VARIANT 2: TABS — top-tab nav, content per tab
function DevTabs({ options }) {
  const [tab, setTab] = useState("start");
  const tabs = [
    { id: "start", label: "START" },
    { id: "player", label: "PLAYER" },
    { id: "visual", label: "VISUAL" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", borderBottom: `3px solid ${PAL.ink}`, marginTop: 20 }}>
        {tabs.map((t) => {
          const sel = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "8px 4px",
                background: sel ? PAL.yellow : "rgba(140,135,125,0.45)",
                color: sel ? PAL.ink : PAL.cream,
                border: "none",
                borderRight: t.id !== "visual" ? `2px solid ${PAL.ink}` : "none",
                fontFamily: PIXEL_BLOCK, fontSize: 11, letterSpacing: 2,
                cursor: "pointer",
                textShadow: sel ? "none" : `1px 1px 0 ${PAL.ink}`,
                boxShadow: sel ? `inset 0 -3px 0 ${PAL.yellowDeep}, inset 0 3px 0 ${PAL.yellowHi}` : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "33px 14px 8px", overflow: "auto", flex: 1 }}>
        {options[tab].map((opt, i) => <DevRow key={i} opt={opt} />)}
      </div>
    </div>
  );
}

// ----- VARIANT 3: CARDS — 2-col grid of compact cards
function DevCards({ options }) {
  const all = [
    ...options.start.map((o) => ({ ...o, group: "START" })),
    ...options.player.map((o) => ({ ...o, group: "PLAYER" })),
    ...options.visual.map((o) => ({ ...o, group: "VISUAL" })),
  ];
  // Scrubber and slider are wider — give them full row, keep toggles as half-cards
  return (
    <div style={{ overflow: "auto", flex: 1, padding: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {all.map((opt, i) => {
          const isWide = opt.kind === "scrubber" || opt.kind === "slider" || opt.kind === "text";
          return (
            <div
              key={i}
              style={{
                gridColumn: isWide ? "span 2" : "span 1",
                background: "rgba(20,16,12,0.7)",
                border: `2px solid ${PAL.ink}`,
                boxShadow: `0 2px 0 ${PAL.ink}`,
                padding: "8px 10px",
                display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontFamily: PIXEL_BLOCK, fontSize: 9, color: PAL.yellow, letterSpacing: 1.5,
                  textShadow: `1px 1px 0 ${PAL.ink}` }}>
                  {opt.group}
                </span>
                {opt.kind === "toggle" && <DevToggle value={opt.value} onChange={opt.set} />}
              </div>
              <div style={{ fontFamily: PIXEL, fontSize: 14, color: PAL.cream, letterSpacing: 2, lineHeight: 1.05, textShadow: `1px 1px 0 ${PAL.ink}` }}>
                {opt.label}
              </div>
              {opt.sub && (
                <div style={{ fontFamily: PIXEL, fontSize: 12, color: PAL.dim, letterSpacing: 1, lineHeight: 1.1 }}>
                  {opt.sub}
                </div>
              )}
              {opt.kind === "scrubber" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DevScrubber value={opt.value} min={opt.min} max={opt.max} onChange={opt.set} />
                  <span style={{ fontFamily: PIXEL, fontSize: 13, color: PAL.yellow, minWidth: 50, textAlign: "right", textShadow: `1px 1px 0 ${PAL.ink}` }}>
                    {opt.format ? opt.format(opt.value) : opt.value}
                  </span>
                </div>
              )}
              {opt.kind === "slider" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DevSlider value={opt.value} min={opt.min} max={opt.max} onChange={opt.set} />
                  <span style={{ fontFamily: PIXEL, fontSize: 13, color: PAL.yellow, minWidth: 44, textAlign: "right", textShadow: `1px 1px 0 ${PAL.ink}` }}>
                    {opt.format ? opt.format(opt.value) : opt.value}
                  </span>
                </div>
              )}
              {opt.kind === "text" && <DevTextInput value={opt.value} onChange={opt.set} />}
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 12, padding: "8px 10px",
        background: "rgba(232,64,48,0.12)",
        border: `2px solid #e84030`,
        boxShadow: `0 2px 0 ${PAL.ink}`,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ fontFamily: PIXEL_BLOCK, fontSize: 9, color: "#e84030", letterSpacing: 1.5, textShadow: `1px 1px 0 ${PAL.ink}` }}>
          ⚠ DANGER ZONE
        </div>
        {(options.danger || []).map((opt, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: PIXEL, fontSize: 14, color: PAL.cream, letterSpacing: 2, textShadow: `1px 1px 0 ${PAL.ink}` }}>{opt.label}</div>
              {opt.sub && <div style={{ fontFamily: PIXEL, fontSize: 12, color: PAL.dim }}>{opt.sub}</div>}
            </div>
            <DevButton label={opt.label.includes("RESET") ? "WIPE" : "RUN"} danger={opt.danger} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.StartScreen = StartScreen;
