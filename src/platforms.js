/*
====================================================================
* platforms.js - Platform system: generation, collision, rendering
====================================================================
* Project: Soggy Moggy
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
_platSheet.src = 'PixelArt/platforms/level_1_city/jalousie_sheet.png';

// ── Window sprite sheet (Level 1 only) ───────────────────────────────────────
// windows.png: 2×2 grid of window variants (clean A/B, dirty A/B)
// Coordinates measured via PIL alpha-scan:
const _winSheet = new Image();
_winSheet.src = 'PixelArt/backgrounds/level_1_city/windows.png';

// ── Level 2 shaft platform sprites ───────────────────────────────────────────
// Atlas coords measured via PIL connected-component scan on 2026-04-20.
// Sheet: jump_plattforms.png, 480 × 258 px. 9 opaque regions found, all sh=24.
const _l2PlatSheet = new Image();
_l2PlatSheet.src = 'PixelArt/platforms/level_2_lift/jump_plattforms.png';

// 9-variant atlas: 3 positions (l/c/r) × 3 sizes (L/M/S).
//   l = left   (anchored to left shaft wall, depth faces right)
//   c = center (symmetric, floats in shaft centre)
//   r = right  (anchored to right shaft wall, depth faces left)
//   L / M / S  = large / medium / small  (within each position group, sorted by measured sw)
//
// Anchoring rule used to derive gameX, measured from pipes_mid.png (tubes):
//   left  tube occupies x=  0..61  → shaft interior starts at x= 62
//   right tube occupies x=418..479 → shaft interior ends   at x=417
//   l* → gameX = 62                       (flush with inner edge of left tube)
//   c* → gameX = 240 − floor(gameW / 2)  (centred on shaft mid-line x=240)
//   r* → gameX = 418 − gameW              (right edge flush with right tube)
//
// gameW == sw (no horizontal scale). sh is both source-sample AND render height
// (no vertical scale) so nothing can stretch-bleed at sprite edges.
const _L2_VARIANTS = {
  cL: { sx: 179, sy:  13, sw: 115, sh: 24, gameX: 182, gameW: 115 },
  cM: { sx: 186, sy:  53, sw: 100, sh: 24, gameX: 190, gameW: 100 },
  cS: { sx: 194, sy:  91, sw:  87, sh: 24, gameX: 196, gameW:  87 },
  lL: { sx:  72, sy: 144, sw: 124, sh: 24, gameX:  62, gameW: 124 },
  lM: { sx:  72, sy: 183, sw: 107, sh: 24, gameX:  62, gameW: 107 },
  lS: { sx:  72, sy: 222, sw:  87, sh: 24, gameX:  62, gameW:  87 },
  rL: { sx: 274, sy: 144, sw: 124, sh: 24, gameX: 294, gameW: 124 },
  rM: { sx: 291, sy: 183, sw: 107, sh: 24, gameX: 311, gameW: 107 },
  rS: { sx: 311, sy: 222, sw:  87, sh: 24, gameX: 331, gameW:  87 },
};

// ── Level 2 cycle pool ───────────────────────────────────────────────────────
// 4 verified 6-slot cycles, randomized per cycle (not per slot). Each cycle
// has 4 platforms + 2 SKIPs. Within a cycle, all transitions are L↔C or C↔R
// (120 px direct, 240 px with 1 SKIP). Between cycles, a wrap transition can
// repeat (l→l, r→r, c→c, all 240 px / 0 lateral) or cross via C, but L↔R
// directly is forbidden — vertical 240 + horizontal ~270 px exceeds jump
// budget. `_l2WrapReachable` enforces this at cycle boundaries.
//
//   slots[]: 6 entries, each 'l' | 'c' | 'r' | null (SKIP)
//   start:   slots[0]                         (for next-cycle wrap check)
//   end:     last non-null position in slots  (for next-cycle wrap check)
const _L2_CYCLES = [
  { slots: ['l','c',null,'r','c',null], start: 'l', end: 'c' },
  { slots: ['r','c',null,'l','c',null], start: 'r', end: 'c' },
  { slots: ['c','l',null,'c','r',null], start: 'c', end: 'r' },
  { slots: ['c','r',null,'c','l',null], start: 'c', end: 'l' },
];

function _l2WrapReachable(prevEnd, nextStart) {
  if (prevEnd === null) return true;                   // first cycle of run
  if (prevEnd === 'c' || nextStart === 'c') return true;
  return prevEnd === nextStart;                        // l→l / r→r OK; l↔r forbidden
}

// ── Level 3 cloud spritesheet ────────────────────────────────────────────────
// 6 motifs (3 shapes × horizontal mirror), stacked vertically, transparent gaps.
// Fill _CLOUD_VARIANTS by running `python scripts/measure_clouds.py` and pasting
// the printed lines. Renderer falls back to a colored rect until the array is
// populated AND the image has loaded.
//
// Each entry:
//   sx, sy, sw, sh — atlas source rect
//   landingY      — sprite-local Y of the cat's foot-line. The collider's top
//                   edge (platform.y) aligns with this row, so the visible
//                   cloud extends both above and below the collider → the cat
//                   appears nestled in the cloud instead of floating above a
//                   hard rectangle.
const _cloudSheet = new Image();
_cloudSheet.src = 'PixelArt/platforms/level_3_sea/clouds_spritesheet.png';
const _CLOUD_VARIANTS = [
  { sx:  22, sy:  23, sw: 208, sh:  62, landingY:  27 }, // cloud #1
  { sx:  22, sy: 115, sw: 208, sh:  64, landingY:  28 }, // cloud #2
  { sx:  22, sy: 235, sw: 252, sh:  75, landingY:  33 }, // cloud #3
  { sx:  21, sy: 338, sw: 252, sh:  75, landingY:  33 }, // cloud #4
  { sx:  21, sy: 461, sw: 281, sh:  72, landingY:  32 }, // cloud #5
  { sx:  21, sy: 553, sw: 281, sh:  72, landingY:  32 }, // cloud #6
];

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
const _WIN_POS = [40, 190, 340];                // left-edge x of each of the 3 window columns
//   column centers: 90, 240, 390  (= _WIN_POS[i] + _WIN_W/2)
//   outer columns shifted 25px outward from center

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
// L3 cloud-crumble uses longer timers: the lightning tell needs time to read, and
// the cat is already coping with continuous sinking — rushing it feels unfair.
const L3_CRUMBLE_DELAY_MS = 1000;
const L3_CRUMBLE_HOLD_MS  =  500;
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

  // Level 1 + 2 + 3: invisible ground platform — cat stands here at game start.
  // y=628 = canvas height (640) - PLATFORM_H (12). L1/L3 spawn y=596 (628 - player.h=32).
  // L3 needs this because LH-G (y=566) is above the spawn point; without it the cat
  // falls straight past the stone ground into nothingness at level start.
  if (level === 1 || level === 2 || level === 3) {
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

    // LH-Bridge 1–4: fixed cloud-platform chain bridging the gap between the procedural
    // cloud field and the lighthouse balcony (LH-C1). Rendered as cloud sprites for
    // visual consistency, but NON-sinking (no baseY) so the jump chain to the balcony
    // stays predictable — the last procedural cloud to bridge1 is already 140px.
    // Balcony at −4445: 4 × 120px bridges close the 533px gap exactly.
    // x positions alternate left/right of the cap body (x≈150–330) to avoid clipping the art.
    const _bridgeVariant = () =>
      (_CLOUD_VARIANTS.length > 0) ? Math.floor(Math.random() * _CLOUD_VARIANTS.length) : 0;
    platforms.push({ x: 330, y: -4032, w: 100, h: PLATFORM_H, type: 'cloud-sink', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false, cloudVariant: _bridgeVariant() });
    platforms.push({ x:  50, y: -4152, w: 100, h: PLATFORM_H, type: 'cloud-sink', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false, cloudVariant: _bridgeVariant() });
    platforms.push({ x: 320, y: -4272, w: 100, h: PLATFORM_H, type: 'cloud-sink', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false, cloudVariant: _bridgeVariant() });
    platforms.push({ x:  60, y: -4392, w: 100, h: PLATFORM_H, type: 'cloud-sink', state: 'intact', crumbleTimer: 0, row: activeRows[0], winVariants: undefined, invisible: false, cloudVariant: _bridgeVariant() });

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
  // Per-level vertical gap. L3 spaces clouds 30% further apart so the sky reads
  // less cluttered. 170 stays safely under the 200px jump ceiling.
  const gap       = (level === 3) ? 170 : GAP_PX;
  const slotCount = Math.floor(levelHeight / gap);
  let _l2SlotIdx   = 0;
  let _l2SlotInCycle  = 0;     // 0..5 — position within the active cycle
  let _l2CurrentSlots = null;  // active cycle's slots[] (selected from _L2_CYCLES)
  let _l2CyclePrevEnd = null;  // last cycle's `end` — used for wrap-reach filter
  let _l1LastColIdx = -1; // tracks previous L1 column for bridge insertion
  let _l3LastBand  = -1;  // 0=LEFT / 1=CENTER / 2=RIGHT — no band repeats back-to-back
  for (let i = 1; i <= slotCount; i++) {
    if (level === 1 && (i < 3 || i % 2 === 0)) continue; // only odd slots i≥3 get a platform — must match window condition exactly
    const worldY  = PLAYER_START_Y - i * gap;

    // ── Level 2 shaft platform generation ────────────────────────────────────
    if (level === 2) {
      if (worldY >= 24) continue; // elevator interior zone: handled by invisible colliders only

      // 6-slot cycle, randomized from `_L2_CYCLES` pool (4 verified shapes).
      // Each cycle: 4 platforms + 2 SKIPs. Within-cycle transitions are L↔C or
      // C↔R (120 px direct, 240 px with 1 SKIP) — both reach-validated by the
      // 3–4 px edge overlap built into `_L2_VARIANTS` gameX anchors. New cycle
      // is picked on slot 0 with `_l2WrapReachable` filtering out L↔R wraps.
      // Sizes (L/M/S) still derive from absolute slot index so altitude shapes
      // the difficulty curve regardless of which cycle is active.
      const shaftSlot  = _l2SlotIdx++;
      const shaftFrac  = shaftSlot / Math.max(1, slotCount - 5); // 0=shaft entry, 1=near roof
      const sizeKey    = shaftFrac < 0.40 ? 'L' : shaftFrac < 0.75 ? 'M' : 'S';

      if (_l2SlotInCycle === 0) {
        const compat = _L2_CYCLES.filter(c => _l2WrapReachable(_l2CyclePrevEnd, c.start));
        const pick   = compat[Math.floor(Math.random() * compat.length)];
        _l2CurrentSlots = pick.slots;
        _l2CyclePrevEnd = pick.end;
      }
      const posKey = _l2CurrentSlots[_l2SlotInCycle];
      _l2SlotInCycle = (_l2SlotInCycle + 1) % 6;

      const variantIds = (posKey === null) ? [] : [posKey + sizeKey];

      for (const vid of variantIds) {
        const v = _L2_VARIANTS[vid];
        platforms.push({
          x:            v.gameX,
          y:            Math.floor(worldY),
          w:            v.gameW,
          h:            PLATFORM_H,
          type:         'normal',
          state:        'intact',
          crumbleTimer: 0,
          row:          0,
          winVariants:  undefined,
          l2Variant:    vid,
        });
      }
      continue; // skip general generation below
    }
    // ─────────────────────────────────────────────────────────────────────────
    // L3 clouds need a wider minimum than other levels: they sink under the cat,
    // so a too-narrow collider leaves no margin for imperfect landings.
    const minW = (level === 3) ? 100 : PLATFORM_MIN_W;
    const maxW = PLATFORM_MAX_W;
    const w    = minW + Math.random() * (maxW - minW);
    let type;
    if (level === 3) {
      // L3 sea: every procedural platform is a cloud that sinks under the cat.
      // 25% also crumble after two landings (preceded by a lightning-flash tell).
      type = Math.random() < 0.25 ? 'crumble' : 'cloud-sink';
    } else {
      type = Math.random() < CRUMBLE_CHANCE ? 'crumble' : 'normal';
    }

    // Level 1: pick a random window column and center platform over it.
    // On a left↔right outer-column transition, insert a small bridge at center first.
    let x;
    if (level === 1) {
      const colIdx    = Math.floor(Math.random() * _WIN_POS.length);
      const winCenter = _WIN_POS[colIdx] + _WIN_W / 2;  // 90, 240, or 390

      const outerTransition = _l1LastColIdx !== -1
        && ((colIdx === 0 && _l1LastColIdx === 2) || (colIdx === 2 && _l1LastColIdx === 0));
      if (outerTransition) {
        const bw  = Math.floor(PLATFORM_MIN_W);
        const bCx = _WIN_POS[1] + _WIN_W / 2; // center column x
        const bx  = Math.max(0, Math.min(480 - bw, bCx - bw / 2));
        const by  = Math.floor(worldY + GAP_PX / 2);
        platforms.push({
          x: Math.floor(bx), y: by, w: bw, h: PLATFORM_H,
          type: 'normal', state: 'intact', crumbleTimer: 0,
          row: activeRows[Math.floor(Math.random() * activeRows.length)],
          winVariants: undefined,
          invisible: true, // bridge collider only — no backing window, no jalousie drawn
        });
        // Bridge platforms do NOT push to windowFloors — they sit mid-gap and have no
        // backing window column. Pushing here would create a second window row 60px
        // above the regular slot's row, producing the visible double-row stacking bug.
      }
      _l1LastColIdx = colIdx;

      x = Math.max(0, Math.min(480 - w, winCenter - w / 2));
    } else if (level === 3) {
      // L3: 3-band cycle (LEFT / CENTER / RIGHT) with no back-to-back repeats.
      // Guarantees horizontal spread so clouds cover the full canvas, not just the middle.
      // Each band gives the platform left-edge a ~80px randomised window inside its band,
      // with a small inset from the canvas edges so the widest clouds don't poke off-screen.
      let band;
      do {
        band = Math.floor(Math.random() * 3);
      } while (band === _l3LastBand);
      _l3LastBand = band;
      const inset = 4;
      if (band === 0)       x = inset + Math.random() * 80;               // LEFT
      else if (band === 2)  x = 480 - w - inset - Math.random() * 80;     // RIGHT
      else                  x = 240 - w / 2 + (Math.random() - 0.5) * 60; // CENTER
      x = Math.max(0, Math.min(480 - w, x));
    } else {
      x = 20 + Math.random() * (480 - w - 40); // other levels: free placement
    }

    const wv = (level === 1) ? [
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
    ] : undefined;
    const floorY = Math.floor(worldY);
    // At L3 every procedural platform (cloud-sink or crumble) sinks.
    // Elsewhere only explicit cloud-sink platforms do.
    const sinks = (type === 'cloud-sink') || (level === 3 && type === 'crumble');
    const cloudVariant = (level === 3 && _CLOUD_VARIANTS.length > 0)
      ? Math.floor(Math.random() * _CLOUD_VARIANTS.length)
      : 0;
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
      baseY:        sinks ? floorY : undefined,
      catOnTop:     sinks ? false  : undefined,
      cloudVariant: (level === 3) ? cloudVariant : undefined,
    });
    // Windows on every platform — loop only reaches here for i≥3 odd slots.
    if (level === 1) windowFloors.push({ y: floorY, winVariants: wv });
  }
}

// One-way collision: player lands on platform top only.
// Passing through from below and side contact are intentionally ignored.
function checkPlatformCollisions() {
  const prevOnPlatform = player.onPlatform; // remember last-frame platform BEFORE reset — needed to
                                            // distinguish a fresh landing from continuous contact
                                            // (gravity re-snaps every frame and would otherwise
                                            // auto-advance crumble state intact→cracked→crumbling
                                            // within 2 frames)
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

      // Crumble state machine: only advance on a FRESH landing (not continuous contact)
      if (p.type === 'crumble' && prevOnPlatform !== p) {
        if      (p.state === 'intact')  { p.state = 'cracked';   p.crumbleTimer = 0; }
        else if (p.state === 'cracked') { p.state = 'crumbling'; p.crumbleTimer = 0; }
      }

      // Sinking cloud (any type with a baseY): mark as loaded this frame
      if (p.baseY !== undefined) p.catOnTop = true;
    }
  }
}

function updatePlatforms(dt) {
  for (let i = platforms.length - 1; i >= 0; i--) {
    const p = platforms[i];

    // Cloud sink physics: move platform based on cat contact this frame.
    // Applies to any platform with baseY (cloud-sink, plus L3 crumble).
    if (p.baseY !== undefined) {
      if (p.catOnTop) {
        const oldY  = p.y;
        p.y = Math.min(p.baseY + CLOUD_SINK_MAX, p.y + CLOUD_SINK_SPEED * dt);
        const delta = p.y - oldY;  // how far platform sank this frame (>= 0)
        // Drag player with the platform — one-way collision can't track a moving surface,
        // so we explicitly keep the player riding the cloud rather than relying on re-snap.
        // prevY is pinned strictly below the cloud surface so the next collision's
        // wasAbove check (prevBot <= p.y) holds by construction. The 0.01 px margin
        // absorbs IEEE 754 binade-crossing drift: (p.y - 32) + 32 rounds ~1 ulp high
        // when the subtraction crosses a power-of-2 boundary (e.g. 512), which
        // otherwise flips wasAbove to false and drops the cat through a sinking cloud.
        if (delta > 0) {
          player.y     += delta;
          player.prevY  = p.y - player.h - 0.01;
        }
      } else {
        p.y = Math.max(p.baseY, p.y - CLOUD_RISE_SPEED * dt);  // float back, clamp at rest
      }
      p.catOnTop = false;  // reset — collision system sets it true again next frame if still contact
    }

    if (p.type === 'crumble') {
      const crackedLimit   = (GameState.level === 3) ? L3_CRUMBLE_DELAY_MS : CRUMBLE_DELAY_MS;
      const crumblingLimit = (GameState.level === 3) ? L3_CRUMBLE_HOLD_MS  : CRUMBLE_HOLD_MS;
      if (p.state === 'cracked') {
        p.crumbleTimer += dt * 1000;
        if (p.crumbleTimer >= crackedLimit) {
          platforms.splice(i, 1);  // auto-disappear if player never lands again
        }
      } else if (p.state === 'crumbling') {
        p.crumbleTimer += dt * 1000;
        if (p.crumbleTimer >= crumblingLimit) {
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

  // Level 2 shaft platforms: fixed-position sprites from jump_plattforms.png
  if (p.l2Variant) {
    const v  = _L2_VARIANTS[p.l2Variant];
    const dx = Math.floor(p.x);
    const dy = Math.floor(p.y);
    if (!_l2PlatSheet.complete || _l2PlatSheet.naturalWidth === 0) {
      ctx.fillStyle = '#4a4455'; // dark grey-purple fallback while image loads
      ctx.fillRect(dx, dy, p.w, PLATFORM_H);
      return;
    }
    // Source sh == destination sh → no vertical stretch; prevents any edge bleed on scale.
    ctx.drawImage(_l2PlatSheet, v.sx, v.sy, v.sw, v.sh, dx, dy, v.gameW, v.sh);
    return;
  }

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

  // Level 3: cloud platforms. Sprite from clouds_spritesheet.png drawn with the
  // cat's landing line aligned to p.y, so the cloud's puff extends above and
  // below the collider — cat appears nestled in the cloud, not floating above.
  // Crumble state gets a brief blue-white pre-lightning flash over the sprite.
  if (GameState.level === 3) {
    const isCloudType = (p.type === 'cloud-sink' || p.type === 'crumble');
    const sheetReady  = _cloudSheet.complete && _cloudSheet.naturalWidth > 0;
    const variant     = (isCloudType && _CLOUD_VARIANTS.length > 0)
      ? _CLOUD_VARIANTS[p.cloudVariant % _CLOUD_VARIANTS.length]
      : null;

    if (isCloudType && sheetReady && variant) {
      // Horizontal fit: scale sprite to platform.w so the cloud matches the collider width.
      const scale   = p.w / variant.sw;
      const drawW   = p.w;
      const drawH   = Math.round(variant.sh * scale);
      const draw_dx = dx;
      // Align variant.landingY (sprite-local foot-line) with p.y (collider top).
      const draw_dy = Math.round(p.y - variant.landingY * scale);
      ctx.drawImage(
        _cloudSheet,
        variant.sx, variant.sy, variant.sw, variant.sh,
        draw_dx, draw_dy, drawW, drawH,
      );

      // Lightning tell on crumble states: thin jagged bolts radiate from the cloud
      // center outward to the edges. Flickers on/off in short bursts so the cloud
      // keeps reading as a cloud rather than being masked by a solid overlay.
      if (p.type === 'crumble' && (p.state === 'cracked' || p.state === 'crumbling')) {
        const isFinal = (p.state === 'crumbling');
        const tSec    = p.crumbleTimer / 1000;
        // Burst gate: bolts visible only during the "on" half of a high-frequency pulse.
        // Cracked ~6 Hz shallow flicker; crumbling ~12 Hz urgent strobing.
        const burstHz   = isFinal ? 12 : 6;
        const burstPhase = Math.sin(tSec * burstHz * Math.PI * 2);
        if (burstPhase > (isFinal ? -0.2 : 0.3)) {
          const cx   = draw_dx + drawW / 2;
          const cy   = draw_dy + drawH / 2;
          const rx   = drawW / 2;
          const ry   = drawH / 2;
          const boltCount = isFinal ? 5 : 3;
          // Deterministic jitter seeded by platform x + integer time-step so bolts
          // look different between clouds and flicker between frames without Math.random noise.
          const seed = p.x * 13.37 + Math.floor(tSec * burstHz * 2) * 7.1;
          ctx.save();
          ctx.strokeStyle = '#f2faff';
          ctx.lineWidth   = isFinal ? 2 : 1;
          ctx.globalAlpha = isFinal ? 0.95 : 0.75;
          ctx.globalCompositeOperation = 'lighter';
          ctx.beginPath();
          for (let b = 0; b < boltCount; b++) {
            const angle = (b / boltCount) * Math.PI * 2 + seed * 0.017;
            const dxu   = Math.cos(angle);
            const dyu   = Math.sin(angle);
            // Target point on the cloud's elliptical edge (roughly) — not exact, just outward.
            const tx = cx + dxu * rx * 0.95;
            const ty = cy + dyu * ry * 0.95;
            // Two zigzag waypoints between center and edge.
            const j1 = (Math.sin(seed + b * 2.1) * 0.35);        // -0.35..0.35
            const j2 = (Math.sin(seed + b * 3.7 + 1.5) * 0.35);
            const p1x = cx + (tx - cx) * 0.35 + (-dyu) * rx * j1;
            const p1y = cy + (ty - cy) * 0.35 + ( dxu) * ry * j1;
            const p2x = cx + (tx - cx) * 0.70 + (-dyu) * rx * j2;
            const p2y = cy + (ty - cy) * 0.70 + ( dxu) * ry * j2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.lineTo(tx, ty);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }

    // Fallback rect (sheet not loaded yet, variants not measured, or non-cloud L3 platform).
    let cloudFill, cloudEdge;
    if (p.type === 'cloud-sink') {
      cloudFill = '#b0c8e8';
      cloudEdge = '#8aaac8';
    } else if (p.type === 'crumble') {
      if (p.state === 'cracked' || p.state === 'crumbling') {
        cloudFill = '#c8e6ff';  // blue-white flash tell
        cloudEdge = '#8aaac8';
      } else {
        cloudFill = '#d0d0e8';
        cloudEdge = '#a0a0c0';
      }
    } else {
      cloudFill = '#e8e8f0';
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
