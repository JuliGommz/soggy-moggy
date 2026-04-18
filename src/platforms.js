/*
====================================================================
* platforms.js - Platform system: generation, collision, rendering
====================================================================
* Project: Soggy Moggy (in-game: Gato Sin Botas)
* Course: PRG Abschlussprojekt — SRH Fachschulen
* Developer: Julian Gomez
* Date: 2026-03-06
* Version: 2.0 - L1 colliders updated for separate element sprites (building_wall feature heights)
*
* AUTHORSHIP CLASSIFICATION:
*
* [AI-ASSISTED]
* - PIL alpha-scan approach for precise sprite sheet coordinate measurement
*   (capL/mid/capR x-positions and row y-positions)
* - Procedural generation algorithm: slot-based upward distribution
*   with horizontal margin constraints and CRUMBLE_CHANCE selection
* - 2-landing crumble state machine: intact → cracked → crumbling → removed
* - One-way AABB collision: 3-condition check (overlapX + wasAbove + movingDown)
* - 3-part sprite tiling: left cap + clipped middle tiles + right cap
*
* NOTES:
* - One-way collision reads player.prevY — updatePlayer() must run first each frame
* - levelGoalY stored in GameState so main.js can draw the finish line
* - GAP_PX must stay below 200px — otherwise jump cannot reach next platform
*
* VERSION HISTORY:
* - v1.0: Static platform array, one-way collision
* - v1.1: Procedural generation, crumble state machine
* - v1.2: Jalousie sprite sheet rendering (3-part tiling)
* - v1.3: Level 2 row restriction (blue-stripe only), LEVEL_BASE_HEIGHT scaling
* - v1.7: Per-window randomised variants, platforms snap to window column center
* - v1.8: windowFloors array (write-once) decouples windows from platform lifecycle;
*         renderWindowFloors() replaces per-platform window draw so crumble splice
*         no longer removes window sprites from the building
====================================================================
*/
// Depends on: player (player.js — must load before this file), JUMP_VELOCITY (player.js)
//             GameState (game-state.js — must load before this file)

// ── Platform sprite sheet ─────────────────────────────────────────────────────
// jalousie_sheet.png: 3 cols (A=left cap, B=middle, C=right cap) × 7 rows
// Coordinates measured via PIL alpha-scan on the PNG (480×640, RGBA):
//   Col A left cap:  sx=57,  w=29px  (x=57 to x=85,  non-transparent run)
//   Col B middle:    sx=93,  w=41px  (x=93 to x=133, tiled to fill gap)
//   Col C right cap: sx=144, w=28px  (x=144 to x=171, non-transparent run)
//   Row height: 17px (Row 7 is 15px but rendered at 17px — no visible issue)
//
// Row Y positions (all 7 jalousie styles):
//   Row 1 (y= 71): dark / shuttered
//   Row 2 (y= 97): hearts pattern
//   Row 3 (y=122): blue stripes
//   Row 4 (y=146): yellow + red text — crumble CRACKED  (warning)
//   Row 5 (y=176): brown slats
//   Row 6 (y=202): green  — used as normal fallback color
//   Row 7 (y=230): red    — crumble CRUMBLING (urgent)
// Normal + crumble-intact platforms pick a random row at generation time.
const _platSheet = new Image();
_platSheet.src = 'PixelArt/platforms/level1_city/jalousie_sheet.png';

// ── Window sprite sheet (Level 1 only) ───────────────────────────────────────
// windows.png: 2×2 grid of window variants (clean A/B, dirty A/B)
// Coordinates measured via PIL alpha-scan:
const _winSheet = new Image();
_winSheet.src = 'PixelArt/backgrounds/level1_city/windows.png';

const _WS = {
  // Coordinates from PIL alpha-scan (non-purple, non-transparent pixel bounds per quadrant):
  //   A-column scanned from x=79 onward — excludes row-label ("1","2") purple left border
  //   Row 1: y=83–192,  Row 2: y=266–375  (gap y=193–265 = inter-row spacing)
  //   Gray "window sprites" footer at y=448+ is fully excluded from all sh values
  variants: [
    { sx:  79, sy:  84, sw: 103, sh: 109 }, // 0: A1 clean — brown frame, blue glass top / dark bottom
    { sx: 264, sy:  83, sw: 119, sh: 110 }, // 1: B1 clean — wider variant, same style
    { sx:  79, sy: 266, sw: 116, sh: 110 }, // 2: A2 dirty — cracked / stained glass
    { sx: 264, sy: 266, sw: 119, sh: 110 }, // 3: B2 dirty — more cracks, partial pane
  ],
};

// Window display layout — shared by generation (x-snap) and rendering (draw positions)
const _WIN_W   = 100;                           // display width per window sprite (px)
const _WIN_H   = 100;                           // display height (approx square, all variants)
const _WIN_POS = [65, 190, 315];                // left-edge x of each of the 3 window columns
//   column centers: 115, 240, 365  (= _WIN_POS[i] + _WIN_W/2)
//   spacing: 65px outer margins, 25px gap between windows (65+100+25+100+25+100+65=480)

// Source region constants (px within the sprite sheet)
const _PS = {
  h:    17,                    // source row height
  capL: { x:  57, w: 29 },    // left  cap
  mid:  { x:  93, w: 41 },    // middle tile (tiled)
  capR: { x: 144, w: 28 },    // right cap
  rows:         [71, 97, 122, 176, 202], // rows for intact platforms (rows 1,2,3,5,6)
                                         // Row 4 (146) + Row 7 (230) reserved for crumble states
  rowCracked:   146,           // Row 4: yellow (crumble cracked  — overrides p.row)
  rowCrumbling: 146,           // Row 4: yellow (crumble crumbling — same warning color as cracked)
  // Fallback solid colors (used while sprite loads)
  colorNormal:    '#5a7a3a',
  colorCracked:   '#c0662a',
  colorCrumbling: '#e8a830',
};

const PLATFORM_H       = 12;   // platform height in pixels — collision hitbox height
const PLATFORM_MIN_W   = 80;   // minimum platform width — must be > capL.w + capR.w (57px)
const PLATFORM_MAX_W   = 130;  // maximum platform width in pixels
const GAP_PX           = 120;  // vertical slot height — DO NOT exceed 200px (jump limit from physics)
const CRUMBLE_CHANCE   = 0.25; // 25% of non-starter platforms are crumbling
const CRUMBLE_DELAY_MS = 500;  // ms between crack and disappear
const CRUMBLE_HOLD_MS  = 300;  // ms player has to react on second landing before platform disappears
const CLOUD_SINK_SPEED  = 40;  // px/s — sinks while cat stands on it
const CLOUD_RISE_SPEED  = 20;  // px/s — floats back to rest when cat leaves
const CLOUD_SINK_MAX    = 60;  // px  — max drop below baseY; must stay < GAP_PX − player.h − PLATFORM_H (76px)
const LEVEL_BASE_HEIGHT = 5000; // px for level 1; scales per level
const PLAYER_START_Y   = 528;  // must match resetPlayer() in player.js

// Phase 3: starts empty — generateLevelPlatforms() fills this on each reset
const platforms = [];

// windowFloors: write-once at level generation; never modified during gameplay.
// Decouples window rendering from platform lifecycle so windows persist
// after a crumble platform is spliced out.
// Each entry: { y: worldY, winVariants: [v0, v1, v2] }
const windowFloors = [];

function resetPlatforms() {
  generateLevelPlatforms(GameState.level);
}

function generateLevelPlatforms(level) {
  platforms.length    = 0;
  windowFloors.length = 0; // fresh each level — never modified after this point

  // L3: height aligned to lighthouse geometry so levelGoalY = lighthouse visual floor.
  // Formula: 7 × _LH_MID_H (577) tiles, offset by _LH_GROUND_OFFSET (31) from background.js.
  // → levelHeight = 4536 → levelGoalY = 528 − 4536 = −4008.
  // lastTileWy = −Math.ceil(4008/577)×577 = −7×577 = −4039; with GO=31 cap-floor is at −4008. ✓
  // _LH_MID_SEQ has exactly 7 entries — one per tile, no repeats.
  // Keep in sync with _LH_MID_H and _LH_GROUND_OFFSET constants in background.js.
  const levelHeight = (level === 3) ? 4536 : LEVEL_BASE_HEIGHT + (level - 1) * 500;

  // Level 3: only blue-stripe row (y=122) — sea dock / mast plank feel
  // Level 1: all normal rows (rows 1,2,3,5,6)
  const activeRows = (level === 3) ? [122] : _PS.rows;

  // Level 1 + 2: invisible ground platform — cat stands here at game start.
  // y=628 = canvas height (640) - PLATFORM_H (12). Player spawn y=596 (628 - player.h=32).
  if (level === 1 || level === 2) {
    platforms.push({
      x: 0, y: 628, w: 480, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });
  }

  // Level 1: invisible platforms on fixed decorative elements (separate sprites).
  // Positions match _drawL1Elements() in background.js (building_wall.png feature heights).
  // Wall drawn at camShift*1.0 — world Y = element Y directly.
  if (level === 1) {
    // Cornice band — PIL: content (28,60)-(449,78) in cornice.png; drawn at y=294-60=234
    // Collider at top of visible cornice: y=294, x=28, w=422
    platforms.push({
      x: 28, y: 294, w: 422, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });
    // Trash bins — PIL: content (6,5)-(176,101) in trash_bin.png; drawn at x=79, y=460
    // Collider at top of bins: y=465, x=85, w=171
    platforms.push({
      x: 85, y: 465, w: 171, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });
    // Building door — PIL: content (2,2)-(141,140) in building_door.png; drawn at x=278, y=421
    // Collider at top of door: y=423, x=280, w=140
    platforms.push({
      x: 280, y: 423, w: 140, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });
  }

  // Starter platform: Level 3 only — sea-green placeholder dock plank.
  // Level 1 + 2 use the invisible ground platform (y=628) instead — no jalousie at start.
  if (level === 3) {
    platforms.push({
      x:            190,
      y:            560,
      w:            100,
      h:            PLATFORM_H,
      type:         'normal',
      state:        'intact',
      crumbleTimer: 0,
      row:          activeRows[Math.floor(Math.random() * activeRows.length)],
      winVariants:  undefined,
    });
  }
  // Windows only start at the 4th row from bottom (i=3 in the generation loop below)

  // Store the level goal world Y in GameState so main.js can check and draw it
  GameState.levelGoalY = PLAYER_START_Y - levelHeight;

  // Level 3: invisible structural colliders on the lighthouse cap (background.js cap sprite).
  // Cap world-y formula: capRow − 4562  (derived from topScrY = cs − 4562 in background.js).
  // All positions PIL-verified from lighthouse_sheet.png cap strip (sx=3369, sw=217, drawX=132).
  if (level === 3) {
    // LH-G — Stone ground at lighthouse entrance (base sprite row 535, PIL-verified).
    // Base drawn at screen_y = cs + GO (GO=31); world_y = GO + row = 31 + 535 = 566.
    // Row 535 is 5px below the door-frame bottom (row 530, where sprite widens to 340px).
    // Full canvas width so the cat can stand anywhere on the stone foundation.
    platforms.push({
      x: 0, y: 566, w: 480, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });

    // LH-C1 — Balcony walkway ring (cap row 117, first row of 181px-wide section x=150–330).
    // Horizontal surface surrounding the lantern room base — wide enough to land on comfortably.
    platforms.push({
      x: 150, y: 117 - 4562, w: 181, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });

    // LH-Bridge 1–4: fixed visible platforms bridging the gap between the procedural ceiling
    // and the lighthouse balcony (LH-C1).
    // slotCount ceiling: slot 37 → world y = 528 − 37×120 = −3912.
    // Balcony at −4445: gap = 533 px. Four 120px steps close it exactly.
    // x positions alternate left/right of the cap body (x≈150–330) to avoid clipping the art.
    platforms.push({ x: 330, y: -4032, w: 100, h: PLATFORM_H, type: 'normal', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false });
    platforms.push({ x:  50, y: -4152, w: 100, h: PLATFORM_H, type: 'normal', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false });
    platforms.push({ x: 320, y: -4272, w: 100, h: PLATFORM_H, type: 'normal', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false });
    platforms.push({ x:  60, y: -4392, w: 100, h: PLATFORM_H, type: 'normal', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false });

    // LH-C2 / finish — Bell dome top (cap row 77, w=35, x=223–257, centred at 240).
    // Invisible surface at top of the dome cone; also the finish trigger for L3.
    // The bell finish object (rendered in main.js) sits here instead of a floating platform.
    // goalY stays at −4008 for hazard-cap / tile-count math; finish is deliberately above it.
  }

  // Finish platform — the interactive finish object (pinwheel / bell / lever) is rendered on top.
  // L1: sits on the roof surface (levelGoalY − 35), visible, right side.
  // L2: visible, at levelGoalY, right side (shaft roof).
  // L3: invisible, on the lighthouse dome top (cap row 77, PIL-derived), centred at x=240.
  //     goalY stays −4008 (hazard/tile math); finish is placed above it at the bell surface.
  const FIN_W  = (level === 3) ? 35  : 100;
  const finX   = (level === 3) ? 223 : 480 - 100 - 20;          // L3: dome centre; others: right side
  const finY   = (level === 1) ? Math.floor(GameState.levelGoalY) - 35
               : (level === 3) ? (77 - 4562)                     // cap row 77 world y (PIL)
               :                 Math.floor(GameState.levelGoalY);
  const finVis = (level !== 3);                                   // L3 finish is invisible — no floating platform
  platforms.push({
    x: finX, y: finY, w: FIN_W, h: PLATFORM_H,
    type: 'normal', state: 'intact', crumbleTimer: 0,
    row: activeRows[0], winVariants: undefined,
    invisible: !finVis, isFinish: true,
  });
  GameState.finishTrigger = { x: finX, y: finY, w: FIN_W, h: PLATFORM_H };

  // Level 1: invisible collider for the building roof top surface.
  // Roof drawn at levelGoalY - 56; building_roof.png content starts at y=21 (PIL scan)
  // → walkable surface at levelGoalY - 35. Full canvas width — cat can land anywhere on the roof.
  // IMPORTANT: Pushed AFTER the finish platform so that, when player lands in the finish X-range
  // (x=360..460), the finish-platform collision fires first (same Y) — sets vy=0, blocking this
  // roof collider from winning the identity check. Without this order, onPlatform would always
  // reference the roof (no isFinish flag) and the Z trigger would never fire. Same pattern L2 uses.
  if (level === 1) {
    platforms.push({
      x: 0, y: Math.floor(GameState.levelGoalY) - 35, w: 480, h: PLATFORM_H,
      type: 'normal', state: 'intact', crumbleTimer: 0,
      row: 0, winVariants: undefined, invisible: true,
    });
  }

  // Level 2: invisible structural colliders derived from PIL pixel analysis.
  // All use one-way collision (blocks from above only) — cat can jump up freely through any gap.
  if (level === 2) {
    const goalY = GameState.levelGoalY;

    // C1 — Elevator ceiling (world y=96): solid left + right flanking the hatch.
    // Hatch gap x=164–311 = passable (cat jumps up through); solid parts land cat back on ceiling.
    // PIL-derived from elevator.png row 96 (shaft→room transition); hatch bounds from row 126 scan.
    platforms.push({ x: 0,   y: 96, w: 164, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });
    platforms.push({ x: 311, y: 96, w: 169, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });

    // C2 — Shaft bottom floor (world y=24): walkable left + right flanking the death-hatch.
    // 72px above C1 ceiling — same gap as before; shaft_bg_bottom.png content unchanged.
    // Death-hatch gap x=172–300 = no platform → cat falls back into elevator → life lost.
    platforms.push({ x: 0,   y: 24, w: 172, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });
    platforms.push({ x: 300, y: 24, w: 180, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });

    // C404 — 404 floor-display top surface (world y=301): invisible platform over the clock display.
    // PIL bounds: y=301–320, x=210–262. Collider sits at the display's top edge.
    platforms.push({ x: 210, y: 301, w: 52,  h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });

    // CHR — Right elevator-wall handle top surface (yellow bar with red top edge).
    // PIL scan elevator.png: handle x=342..479, top_y=459. Invisible one-way platform.
    platforms.push({ x: 342, y: 459, w: 138, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });

    // C3 — Shaft exit ceiling (world y=goalY+80): flanking exit hatch (ShaftTop row 255).
    // Cat can only exit through center gap x=138–337.
    platforms.push({ x: 0,   y: goalY + 80, w: 138, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });
    platforms.push({ x: 337, y: goalY + 80, w: 143, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });

    // C4 — Roof surface (world y=goalY): full-width walkable roof.
    // Finish platform (x=360, w=100) also sits at goalY — both coexist without conflict.
    platforms.push({ x: 0, y: goalY, w: 480, h: 8, type: 'normal', state: 'intact', crumbleTimer: 0, row: 0, winVariants: undefined, invisible: true });
  }

  // Generate platforms in upward slots from the player start position.
  // Level 1: every platform must sit over a window — skip slots 1 and 2 from bottom
  // (those rows have no windows per design).  All remaining slots get a platform + window.
  const slotCount = Math.floor(levelHeight / GAP_PX);
  for (let i = 1; i <= slotCount; i++) {
    if (level === 1 && (i < 3 || i % 2 === 0)) continue; // only odd slots i≥3 get a platform — must match window condition exactly
    const worldY  = PLAYER_START_Y - i * GAP_PX;
    if (level === 2 && worldY >= 24) continue; // elevator interior: only invisible colliders (C1/C2/C404); shaft platforms start above C2 (y<24)
    const w       = PLATFORM_MIN_W + Math.random() * (PLATFORM_MAX_W - PLATFORM_MIN_W);
    let type;
    if (level === 3) {
      // L3 lighthouse / sea: mix of cloud-sink (bobbing sea clouds), crumble, and stable
      const roll = Math.random();
      type = roll < 0.25 ? 'crumble'
           : roll < 0.50 ? 'cloud-sink'
           : 'normal';
    } else {
      type = Math.random() < CRUMBLE_CHANCE ? 'crumble' : 'normal';
    }

    // Level 1: pick a random window column and center platform over it
    let x;
    if (level === 1) {
      const colIdx    = Math.floor(Math.random() * _WIN_POS.length);
      const winCenter = _WIN_POS[colIdx] + _WIN_W / 2;  // 115, 240, or 365
      x = Math.max(0, Math.min(480 - w, winCenter - w / 2));
    } else {
      x = 20 + Math.random() * (480 - w - 40); // other levels: free placement
    }

    const wv = (level === 1) ? [
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
    ] : undefined;
    const floorY = Math.floor(worldY);
    platforms.push({
      x:            Math.floor(x),
      y:            floorY,
      w:            Math.floor(w),
      h:            PLATFORM_H,
      type,
      state:        'intact',
      crumbleTimer: 0,
      row:          activeRows[Math.floor(Math.random() * activeRows.length)],
      winVariants:  wv,
      baseY:        (type === 'cloud-sink') ? floorY : undefined,
      catOnTop:     (type === 'cloud-sink') ? false   : undefined,
    });
    // Windows on every platform — loop only reaches here for i≥3 odd slots.
    if (level === 1) windowFloors.push({ y: floorY, winVariants: wv });
  }
}

// One-way collision: player lands on platform top only.
// Passing through from below and side contact are intentionally ignored.
function checkPlatformCollisions() {
  player.onGround   = false; // reset each frame — set true below if on a platform
  player.onPlatform = null;  // reset each frame — set to platform ref below on landing

  const prevBottom = player.prevY + player.h;
  const currBottom = player.y    + player.h;

  for (const p of platforms) {
    const overlapX   = player.x < p.x + p.w && player.x + player.w > p.x;
    const wasAbove   = prevBottom <= p.y;
    const nowBelow   = currBottom >= p.y;
    const movingDown = player.vy > 0;

    if (overlapX && wasAbove && nowBelow && movingDown) {
      player.y          = p.y - player.h;  // snap to surface
      player.vy         = 0;               // stop falling — wait for manual jump
      player.onGround   = true;
      player.onPlatform = p;               // track identity for finish-trigger + future push-box mechanics

      // Crumble state machine: each landing advances the state one step
      if (p.type === 'crumble') {
        if      (p.state === 'intact')  { p.state = 'cracked';   p.crumbleTimer = 0; }
        else if (p.state === 'cracked') { p.state = 'crumbling'; p.crumbleTimer = 0; }
      }

      // Cloud-sink: mark as loaded this frame
      if (p.type === 'cloud-sink') p.catOnTop = true;
    }
  }
}

function updatePlatforms(dt) {
  for (let i = platforms.length - 1; i >= 0; i--) {
    const p = platforms[i];

    // Cloud-sink: move platform based on cat contact this frame
    if (p.type === 'cloud-sink') {
      if (p.catOnTop) {
        const oldY  = p.y;
        p.y = Math.min(p.baseY + CLOUD_SINK_MAX, p.y + CLOUD_SINK_SPEED * dt);
        const delta = p.y - oldY;  // how far platform sank this frame (>= 0)
        // Drag player with the platform — one-way collision can't track a moving surface,
        // so we explicitly keep the player riding the cloud rather than relying on re-snap.
        if (delta > 0) {
          player.y     += delta;
          player.prevY += delta;
        }
      } else {
        p.y = Math.max(p.baseY, p.y - CLOUD_RISE_SPEED * dt);  // float back, clamp at rest
      }
      p.catOnTop = false;  // reset — collision system sets it true again next frame if still contact
    }

    if (p.type === 'crumble') {
      if (p.state === 'cracked') {
        p.crumbleTimer += dt * 1000;
        if (p.crumbleTimer >= CRUMBLE_DELAY_MS) {
          platforms.splice(i, 1);  // auto-disappear if player never lands again
        }
      } else if (p.state === 'crumbling') {
        p.crumbleTimer += dt * 1000;
        if (p.crumbleTimer >= CRUMBLE_HOLD_MS) {
          platforms.splice(i, 1);  // disappears after hold window expires
        }
      }
    }
  }
}

// Renders all window floors independently of the platforms array.
// Called before the platform loop so jalousies visually sit in front of windows.
function renderWindowFloors(ctx) {
  if (GameState.level !== 1) return;
  if (!_winSheet.complete || _winSheet.naturalWidth === 0) return;
  for (const f of windowFloors) {
    const dy = Math.floor(f.y);
    for (let i = 0; i < _WIN_POS.length; i++) {
      const v = _WS.variants[f.winVariants[i]];
      ctx.drawImage(_winSheet, v.sx, v.sy, v.sw, v.sh, _WIN_POS[i], dy, _WIN_W, _WIN_H);
    }
  }
}

function renderPlatforms(ctx) {
  renderWindowFloors(ctx);  // windows behind jalousies; persists even after crumble splice
  for (const p of platforms) {
    _renderPlatformSprite(ctx, p);
  }
}

// Builds each platform from 3 sprite parts: left cap + tiled middle + right cap.
// Sprite is drawn at native height (17px), top-aligned to platform.y (collision surface).
// Transparent slat gaps show the canvas/background through — no base fill added.
function _renderPlatformSprite(ctx, p) {
  if (p.invisible) return;  // decoration-backed platforms: visual is handled by the background asset

  // Finish platform: draw as a golden-highlighted slab to distinguish it visually
  // L1: roof sprite is the visual base — no slab drawn (pinwheel + [Z] prompt is enough)
  if (p.isFinish) {
    if (GameState.level === 1) return;
    const dx = Math.floor(p.x), dy = Math.floor(p.y);
    ctx.fillStyle = '#d4ac0d';
    ctx.fillRect(dx, dy, p.w, PLATFORM_H);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(dx, dy, p.w, 3); // bright top edge
    return;
  }
  const dx = Math.floor(p.x);
  const dy = Math.floor(p.y);

  // Level 3: cloud placeholders — distinct colors per type until cloud_sheet.png is ready
  if (GameState.level === 3) {
    let cloudFill, cloudEdge;
    if (p.type === 'cloud-sink') {
      cloudFill = '#b0c8e8';  // sky blue — sinking cloud
      cloudEdge = '#8aaac8';
    } else if (p.type === 'crumble') {
      if (p.state === 'cracked' || p.state === 'crumbling') {
        cloudFill = '#e8a830';  // reuse existing crumble warning color
        cloudEdge = '#c07010';
      } else {
        cloudFill = '#d0d0e8';  // muted lavender — disappearing cloud (intact)
        cloudEdge = '#a0a0c0';
      }
    } else {
      cloudFill = '#e8e8f0';  // light grey-white — stable cloud
      cloudEdge = '#c0c0d0';
    }
    ctx.fillStyle = cloudFill;
    ctx.fillRect(dx, dy, p.w, PLATFORM_H);
    ctx.fillStyle = cloudEdge;
    ctx.fillRect(dx, dy, p.w, 2);
    return;
  }

  // Pick base color for this platform state
  let baseColor;
  if (p.type === 'crumble') {
    if      (p.state === 'cracked')   baseColor = _PS.colorCracked;
    else if (p.state === 'crumbling') baseColor = _PS.colorCrumbling;
    else                              baseColor = _PS.colorNormal;
  } else {
    baseColor = _PS.colorNormal;
  }

  // Select sprite row based on platform state.
  // Intact (normal or crumble) → p.row (assigned randomly at generation).
  // Cracked / crumbling override to fixed warning/urgent rows.
  let rowY;
  if (p.type === 'crumble' && p.state === 'cracked')   rowY = _PS.rowCracked;
  else if (p.type === 'crumble' && p.state === 'crumbling') rowY = _PS.rowCrumbling;
  else rowY = p.row;

  // Fallback: solid color if sprite not yet loaded
  if (!_platSheet.complete || _platSheet.naturalWidth === 0) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(dx, dy, p.w, _PS.h);
    return;
  }

  // Left cap
  ctx.drawImage(_platSheet, _PS.capL.x, rowY, _PS.capL.w, _PS.h,
                             dx, dy, _PS.capL.w, _PS.h);

  // Right cap
  const capRx = dx + p.w - _PS.capR.w;
  ctx.drawImage(_platSheet, _PS.capR.x, rowY, _PS.capR.w, _PS.h,
                             capRx, dy, _PS.capR.w, _PS.h);

  // Middle tiles — tiled (last tile clipped to remaining space)
  const midStart = dx + _PS.capL.w;
  const midEnd   = dx + p.w - _PS.capR.w;
  let x = midStart;
  while (x < midEnd) {
    const drawW = Math.min(_PS.mid.w, midEnd - x);  // clip last tile
    ctx.drawImage(_platSheet, _PS.mid.x, rowY, drawW, _PS.h,
                               x, dy, drawW, _PS.h);
    x += drawW;
  }
}
