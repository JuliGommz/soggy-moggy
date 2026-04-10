# L2 Cloud Platforms Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the L2 sea-green placeholder platforms with three cloud types: stable (normal), sinking (new weight-based mechanic), and disappearing (existing crumble reskin).

**Architecture:** Extends the existing platform type system in `src/platforms.js`. Adds `type: 'cloud-sink'` with a `baseY` rest position and a `catOnTop` flag. The collision system sets `catOnTop` each frame; the update loop moves `p.y` based on it. Disappearing clouds reuse `'crumble'` with no logic changes — only their L2 render branch changes. All changes are in one file.

**Tech Stack:** Vanilla JS, HTML Canvas 2D. No build tools. Test by opening `index.html` in browser with `GameState.level = 2`.

---

### Task 1: Add sink/rise constants

**Files:**
- Modify: `src/platforms.js` — top of file, alongside existing constants

**Step 1: Open the file and find the constants block**

Look at `src/platforms.js` around line 103–110. You will see:

```javascript
const PLATFORM_H       = 12;
const PLATFORM_MIN_W   = 80;
...
const CRUMBLE_HOLD_MS  = 300;
```

**Step 2: Add two new constants directly after `CRUMBLE_HOLD_MS`**

```javascript
const CLOUD_SINK_SPEED  = 40;  // px/s — sinks while cat stands on it
const CLOUD_RISE_SPEED  = 20;  // px/s — floats back to rest when cat leaves
```

**Step 3: Verify**

No runtime test needed — this is just constants. Save and confirm no syntax errors by opening `index.html` in browser; console must show zero errors.

**Step 4: Commit**

```bash
git add src/platforms.js
git commit -m "feat(l2-clouds): add CLOUD_SINK_SPEED and CLOUD_RISE_SPEED constants"
```

---

### Task 2: Update L2 generation — type mix and baseY

**Files:**
- Modify: `src/platforms.js` — `generateLevelPlatforms()`, the main slot loop

**Step 1: Find the slot loop type assignment**

In `generateLevelPlatforms()`, around line 257, you will see:

```javascript
const type = Math.random() < CRUMBLE_CHANCE ? 'crumble' : 'normal';
```

This line applies to ALL levels. You need to make L2 use a different mix.

**Step 2: Replace that line with a level-aware branch**

```javascript
let type;
if (level === 2) {
  const roll = Math.random();
  type = roll < 0.25 ? 'crumble'
       : roll < 0.50 ? 'cloud-sink'
       : 'normal';
} else {
  type = Math.random() < CRUMBLE_CHANCE ? 'crumble' : 'normal';
}
```

**Step 3: Find the `platforms.push({...})` call inside the loop (around line 275)**

It currently looks like:

```javascript
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
});
```

**Step 4: Add `baseY` and `catOnTop` for cloud-sink platforms**

```javascript
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
```

**Step 5: Manual verification**

Open `index.html`. `GameState.level` is already set to `2` in `game-state.js` (temporary test value). Start the game. Open DevTools console and run:

```javascript
platforms.filter(p => p.type === 'cloud-sink').length
platforms.filter(p => p.type === 'crumble').length
platforms.filter(p => p.type === 'normal').length
```

Expected: roughly 25% / 25% / 50% distribution. Exact numbers vary (random), but all three types must be present. Also verify that cloud-sink platforms have a `baseY` value equal to their `y`.

**Step 6: Commit**

```bash
git add src/platforms.js
git commit -m "feat(l2-clouds): L2 generation — 3-type mix, baseY on cloud-sink"
```

---

### Task 3: Collision — set catOnTop on cloud-sink contact

**Files:**
- Modify: `src/platforms.js` — `checkPlatformCollisions()`

**Step 1: Find the collision detection inner block**

In `checkPlatformCollisions()`, around line 305, inside the `if (overlapX && wasAbove && nowBelow && movingDown)` block:

```javascript
if (overlapX && wasAbove && nowBelow && movingDown) {
  player.y        = p.y - player.h;
  player.vy       = 0;
  player.onGround = true;

  // Crumble state machine...
  if (p.type === 'crumble') {
    ...
  }
}
```

**Step 2: Add catOnTop tracking directly after the crumble block**

```javascript
if (overlapX && wasAbove && nowBelow && movingDown) {
  player.y        = p.y - player.h;
  player.vy       = 0;
  player.onGround = true;

  if (p.type === 'crumble') {
    if      (p.state === 'intact')  { p.state = 'cracked';   p.crumbleTimer = 0; }
    else if (p.state === 'cracked') { p.state = 'crumbling'; p.crumbleTimer = 0; }
  }

  // Cloud-sink: mark as loaded this frame
  if (p.type === 'cloud-sink') p.catOnTop = true;
}
```

**Important:** `catOnTop` is reset to `false` in `updatePlatforms` each frame (Task 4). The collision loop runs after update, so the sequence is: reset → collision sets true → render reads true. This is intentional.

**Step 3: Manual verification**

Cannot visually verify yet — rendering is still the green placeholder. Defer visual test to Task 4 + 5.

**Step 4: Commit**

```bash
git add src/platforms.js
git commit -m "feat(l2-clouds): collision sets catOnTop on cloud-sink contact"
```

---

### Task 4: Update loop — sink and rise logic

**Files:**
- Modify: `src/platforms.js` — `updatePlatforms(dt)`

**Step 1: Find `updatePlatforms`**

Around line 319. It currently only handles `type === 'crumble'` logic.

**Step 2: Add cloud-sink logic at the START of the per-platform loop, before the crumble block**

```javascript
function updatePlatforms(dt) {
  for (let i = platforms.length - 1; i >= 0; i--) {
    const p = platforms[i];

    // Cloud-sink: move platform based on cat contact this frame
    if (p.type === 'cloud-sink') {
      if (p.catOnTop) {
        p.y += CLOUD_SINK_SPEED * dt;  // sink downward (increasing y = moving down in canvas)
      } else {
        p.y = Math.max(p.baseY, p.y - CLOUD_RISE_SPEED * dt);  // float back, clamp at rest
      }
      p.catOnTop = false;  // reset — collision system sets it true again next frame if still contact
    }

    // Existing crumble logic below — unchanged
    if (p.type === 'crumble') {
      ...
    }
  }
}
```

**Step 3: Manual verification**

Open `index.html`, play L2. Land on a platform. The cat should currently auto-bounce (Phase 5 manual jump not yet implemented), so the sinking effect will be subtle. To verify:

1. Open DevTools console.
2. Find a cloud-sink platform: `const p = platforms.find(p => p.type === 'cloud-sink')`
3. Watch `p.y` and `p.baseY` in the console while playing. They should match at rest, diverge while cat is on it, and converge again after the cat leaves.

You can also add a temporary `console.log(p.y, p.baseY)` inside the sink block to confirm motion.

**Step 4: Commit**

```bash
git add src/platforms.js
git commit -m "feat(l2-clouds): cloud-sink sink/rise update logic"
```

---

### Task 5: Render — placeholder colors for L2 cloud types

**Files:**
- Modify: `src/platforms.js` — `_renderPlatformSprite()`, the L2 branch

**Step 1: Find the L2 render placeholder (around line 379)**

```javascript
// Level 2: placeholder — no platform sprite yet
if (GameState.level === 2) {
  ctx.fillStyle = '#3a6a50'; // placeholder: sea-green plank
  ctx.fillRect(dx, dy, p.w, PLATFORM_H);
  ctx.fillStyle = '#254d39'; // darker top edge
  ctx.fillRect(dx, dy, p.w, 2);
  return;
}
```

**Step 2: Replace with type-aware placeholder colors**

```javascript
// Level 2: cloud placeholders — distinct colors per type until cloud_sheet.png is ready
if (GameState.level === 2) {
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
```

**Step 3: Manual verification — full behavior test**

Open `index.html`, play L2. Confirm:

1. Three distinct platform colors are visible (grey-white / sky-blue / lavender)
2. Landing on a sky-blue (sinking) platform: the platform visibly moves downward while the cat is on it
3. After jumping off a sinking platform: it floats back up toward its original position
4. Landing twice on a lavender (crumble) platform: it disappears on the second landing (existing behavior)
5. No console errors

**Step 4: Commit**

```bash
git add src/platforms.js
git commit -m "feat(l2-clouds): placeholder render colors for L2 cloud types"
```

---

## After Art is Ready (deferred)

When `PixelArt/platforms/level2_see/cloud_sheet.png` is drawn and exported:

1. Run PIL alpha-scan to measure row Y positions and cap/mid/capR x-positions
2. Add `_cloudSheet` Image object at top of `platforms.js`
3. Add `_CS` constants object (mirroring `_PS` for jalousie)
4. Replace the L2 placeholder block in `_renderPlatformSprite` with the 3-part sprite tiling (same pattern as jalousie)

Sheet row mapping:
- Row 1: `'normal'` stable cloud
- Row 2: `'cloud-sink'` (rest state)
- Row 3: `'crumble'` intact
- Row 4: `'crumble'` cracked
- Row 5: `'crumble'` crumbling

---

## Summary of Changes

All changes are in **`src/platforms.js`** only.

| Task | What changes |
|---|---|
| 1 | Two new constants at top of file |
| 2 | Generation loop: L2 type mix + `baseY`/`catOnTop` fields |
| 3 | Collision: `p.catOnTop = true` on cloud-sink contact |
| 4 | Update: sink/rise logic per frame |
| 5 | Render: placeholder colors per type |
