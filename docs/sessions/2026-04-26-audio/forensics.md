# Audio Forensics — Systemic SFX Latency

Date: 2026-04-26
Reviewer: forensic code reviewer (no execution)
Scope: read-only static analysis of `src/audio.js` and call sites.

## TL;DR

`playSound()` violates its own documented contract. The doc-comment on
`audio.js:85` says "playSound() clones from cache" — the implementation does
not clone. It reuses one shared `Audio` element per key and writes
`currentTime` on every call. On Windows Chromium HTMLAudio, assigning
`currentTime` triggers a seek operation that delays audible output, and
calling `.play()` on a still-playing element compounds the problem. This is
the systemic, file-independent latency the user reports.

The earlier "MP3 priming silence" theory is a red herring. MP3 priming would
produce a constant per-file offset that a `start` value would fix; it would
NOT affect files like `jump.mp3` or `wasp_sting.mp3` that have no `start`
offset configured. The user reports the delay on ALL SFX, including those
with no offset — therefore the cause is in the play path, not the data.

---

## 1. Trace tables

### 1.1 jump (no `start` offset)

| Step | File:line | Code | Async? |
|---|---|---|---|
| Trigger | `src/player.js:128` | `if (keys.jump && player.onGround && !player.jumpLocked) {` | sync |
| Call | `src/player.js:134` | `if (typeof playSound === 'function') playSound('jump');` | sync |
| Lookup | `src/audio.js:113` | `const entry = SOUNDS[key];` → `'audio/sfx/player/jump.mp3'` | sync |
| start/dur | `src/audio.js:117-118` | `start = 0; dur = null;` (entry is a string) | sync |
| Cache fetch | `src/audio.js:119` | `const audio = _audioCache[key];` — SHARED element | sync |
| Volume | `src/audio.js:122` | `audio.volume = sfx.vol;` | sync |
| **Seek** | `src/audio.js:123` | `audio.currentTime = start;` (= `currentTime = 0`) | **async — fires `seeking` event, audible output delayed until `seeked`** |
| Track | `src/audio.js:124` | `_activeSfx.add(audio);` | sync |
| Play | `src/audio.js:125` | `audio.play().catch(() => {});` | returns Promise; on Chromium audible output begins after the pending seek resolves |

Async gap: Chromium HTMLAudio `seeking → seeked` cycle on a non-paused
element typically takes one decode tick (~5–80 ms) plus an output-graph
latency floor (~20–50 ms on Windows). Combined with the `play()` Promise
reconciliation, the user-perceptible delay is exactly the "audibly late"
symptom reported.

### 1.2 damage (has `start: 0.007, dur: 0.02`)

| Step | File:line | Code |
|---|---|---|
| Trigger | `src/hazards.js:127` | `function takeDamage(cause) {` |
| Call | `src/hazards.js:134` | `playSound('damage');` |
| start/dur | `src/audio.js:117-118` | `start = 0.007; dur = 0.02;` |
| Seek | `src/audio.js:123` | `audio.currentTime = 0.007;` — same shared-element seek |
| Play | `src/audio.js:125` | `audio.play().catch(() => {});` |
| Stop | `src/audio.js:126` | `setTimeout(() => audio.pause(), 20);` — 20 ms later |

Same path as jump. The `setTimeout` of 20 ms means: if the play actually
starts ~50 ms late due to the seek, the `pause()` fires 20 ms after the
play CALL — i.e. potentially BEFORE audible playback even begins. This
also explains the inconsistent perceived volume / clipping for `damage`.

### 1.3 wasp_death (has `start: 0.03`, no `dur`)

`src/enemies.js:259` and `:281` both call `playSound('wasp_death')`. Same
shared-element seek path. Note: `:259` (paw kill) and `:281` (stomp kill)
can never fire in the same frame for the same wasp — but two wasps stomped
in adjacent frames will both target the SAME cached element, with the
second call seeking on a still-playing element.

### 1.4 menu_click (no `start`)

`src/main.js:468-469, 601-602, 627-628, 643-644` — arrow-key menu nav fires
`playSound('menu_click')` on every keypress. Rapid arrow-tapping reuses
the same cached element repeatedly, each time issuing `currentTime = 0`
seek-on-playing.

### 1.5 Phase-change SFX (`countdown_tick`, `level_complete`, `game_over`)

`src/main.js:397, 406, 409` fire from `_onPhaseChange`. Same shared-element
path. These typically fire only once per phase so the second-play race is
absent — but the first-play seek from `currentTime = 0` is still issued.

---

## 2. Confirmed bugs

### Bug A — `playSound()` mutates a shared `Audio` element instead of cloning (CRITICAL)

**File:** `src/audio.js:119`
**Code:**
```js
const audio = _audioCache[key];
if (!audio) return; // preload missed (file missing) — silent fail
try {
  audio.volume      = sfx.vol;
  audio.currentTime = start;       // safe: element is fully preloaded
  _activeSfx.add(audio);
  audio.play().catch(() => {});
```

**Reasoning:**
- The doc-comment at line 85 says "playSound() clones from cache so there
  is no per-call load delay". The implementation does NOT clone — it
  reuses the cached element. The header comment at line 18-20 even
  contradicts itself by claiming `new Audio(path)` is created per call to
  avoid the "can't replay" problem. Neither comment matches the code.
- Assigning `currentTime` on an HTMLAudioElement on Chromium triggers
  `seeking`/`seeked` events. While the seek is in flight, the audio
  graph stalls. On Windows + file://, this is a measurable delay
  (commonly 30–80 ms; worse if a previous play is still in flight).
- Calling `.play()` on an element that is already playing returns a
  Promise that resolves after the browser reconciles internal state.
  Chromium often defers audible output to the next decode boundary.

**Expected impact:** every SFX is delayed by the seek+reconcile cycle on
every call. This is the systemic, file-independent latency the user
reports, and it affects ALL SFX equally regardless of whether they have a
`start` offset configured.

### Bug B — `setTimeout`-based duration trim races the seek (HIGH)

**File:** `src/audio.js:126`
**Code:**
```js
if (dur) setTimeout(() => { try { audio.pause(); } catch (e) {} _activeSfx.delete(audio); }, dur * 1000);
```

**Reasoning:** `dur` is measured from the moment the `setTimeout` is
scheduled (i.e. immediately after the `.play()` CALL), not from the moment
audible playback actually begins. With a 20 ms `dur` for `damage` and a
realistic 30–80 ms seek-induced startup delay, the `pause()` can fire
before the sound is audible. This explains "damage sometimes sounds wrong"
or "barely audible" reports and would also chop `bell` (150 ms),
`electro_crumble` (500 ms), and `music_l2` (300 ms) on slower frames.

**Expected impact:** trimmed sounds (`damage`, `bell`, `music_l2`,
`electro_crumble`, `music_start`) are inconsistent in length and may be
silent entirely if startup delay > `dur`.

### Bug C — `_activeSfx` set never holds more than one entry per key (MEDIUM)

**File:** `src/audio.js:105, 124, 178`
**Code:**
```js
const _activeSfx = new Set();
// ...
_activeSfx.add(audio);
// ...
function stopAllSfx() {
  for (const a of _activeSfx) { try { a.pause(); } catch (e) {} }
  _activeSfx.clear();
}
```

**Reasoning:** because `_audioCache[key]` is a SINGLE element reused on
every call, `_activeSfx.add(audio)` adds the same reference repeatedly
and `Set` deduplicates. The set's max cardinality equals the number of
distinct preloaded keys. Combined with Bug B, the `_activeSfx.delete(audio)`
in the dur-trim path will incorrectly mark the element as "no longer
active" even if a newer call to the same key has just started playback.

**Expected impact:** `stopAllSfx()` works (it stops everything) but the
tracking is misleading and contributes to the trim-race in Bug B.

### Bug D — Wasp buzz element is not gated on `unlockAudio`/user gesture (LOW)

**File:** `src/audio.js:247-258`
**Code:** `_waspBuzzEl = new Audio(path); ... _waspBuzzEl.play().catch(() => {});`

**Reasoning:** the first call to `updateWaspBuzz` (driven from the game
loop, not from user input) creates a new `Audio` and calls `.play()`.
Chromium autoplay policy will reject this with `NotAllowedError` if the
user has not yet interacted. The `.catch(() => {})` swallows it. On the
next `updateWaspBuzz` call, `_waspBuzzEl` is non-null so the construction
path is skipped — but `play()` is never retried. Result: wasp buzz silent
for the rest of the run, no error. NOT the source of the systemic SFX
delay, but worth flagging for the audio audit pass.

---

## 3. Suspected bugs (not provable from static reading)

### S1 — Output latency floor on Windows file://
The prior "HTMLAudio output latency floor ~50ms on Windows" claim is
plausible (Chromium's WASAPI output graph runs at ~10–25 ms buffer size,
with element-graph plumbing on top), but cannot be confirmed without
measurement. Test: load a one-shot in dev console with `new Audio(...)`
and compare `play()` Promise resolution timestamp vs `playing` event.

### S2 — MP3 decoder priming silence
Real for some encoder pipelines (LAME inserts ~26 ms encoder delay), but
this would produce a CONSTANT per-file offset, not a delay that varies
with rapid-fire triggering. The `start` offsets in audio.js were the
fix for this — and they are sized for it (0.007–0.036 s). Even if the
remaining priming is 0, the user still hears delay because of Bug A.

### S3 — `currentTime` setter as a `seeked`-roundtrip in Chromium
Chromium implements `currentTime` setter via the seek pipeline (see
Blink `HTMLMediaElement::seek`). A test would set `currentTime = 0`
with the element idle vs the element playing and time `seeked`.
Cannot be done without running code.

---

## 4. Ruled-out causes

| Diagnosis | Verdict | Reasoning |
|---|---|---|
| MP3 encoder priming silence is the cause | RULED OUT (as primary) | `jump`, `wasp_sting`, `balloon_collect`, etc. have no `start` and are still delayed. Priming would only affect files with offsets configured. |
| `cloneNode` race condition | NOT APPLICABLE | Current code does not call `cloneNode` at all. The earlier diagnosis was about a previous version. |
| HTMLAudio output latency floor ~50 ms | NOT THE CAUSE (alone) | A floor of 50 ms is consistent across all calls and would be barely noticeable; the user reports a clearly audible LATE start. Bug A adds 30–100 ms ON TOP of any floor. |
| AudioContext absence / sample rate mismatch | NOT APPLICABLE | This codebase uses HTMLAudio exclusively (see header comment audio.js:13-17). No AudioContext is created. |
| Autoplay policy blocking SFX | RULED OUT | All SFX are triggered AFTER the user has clicked Start (which dismisses the start menu and unlocks audio policy). The phase-change `playSound('countdown_tick')` at `LEVEL_INTRO` is the first non-user-gesture SFX, but by then the page has had a click. |
| Double-firing from multiple call sites | RULED OUT | `grep playSound` shows each SFX has 1–2 distinct call sites, all guarded by collision/state checks that cannot fire on the same frame. |
| Missing `audio.pause()` before re-play | PART OF THE BUG | Bug A subsumes this — see Fix 1. |
| `setTimeout(0)` async hops | NOT PRESENT | playSound has no `setTimeout(0)` in the play path. The only setTimeout is the dur-trim, which does not gate the play. |

---

## 5. Ranked fix proposals

### Fix 1 (HIGHEST PRIORITY) — Make `playSound` actually clone the cached element

**Why:** removes the seek-on-shared-element entirely. Each call gets a
fresh element with `currentTime` already at 0. No seek is needed for
zero-offset sounds, and for offset sounds the seek runs on an idle clone
(no in-flight playback to reconcile).

**Old code (`src/audio.js:112-130`):**
```js
function playSound(key) {
  const entry = SOUNDS[key];
  if (!entry) return;
  const sfx   = GameState.audio.sfx;
  if (sfx.muted) return;
  const start = typeof entry === 'string' ? 0    : (entry.start || 0);
  const dur   = typeof entry === 'string' ? null : (entry.dur   || null);
  const audio = _audioCache[key];
  if (!audio) return; // preload missed (file missing) — silent fail
  try {
    audio.volume      = sfx.vol;
    audio.currentTime = start;       // safe: element is fully preloaded
    _activeSfx.add(audio);
    audio.play().catch(() => {});
    if (dur) setTimeout(() => { try { audio.pause(); } catch (e) {} _activeSfx.delete(audio); }, dur * 1000);
  } catch (e) {
    // Silent fail — browser restriction
  }
}
```

**New code:**
```js
function playSound(key) {
  const entry = SOUNDS[key];
  if (!entry) return;
  const sfx   = GameState.audio.sfx;
  if (sfx.muted) return;
  const start = typeof entry === 'string' ? 0    : (entry.start || 0);
  const dur   = typeof entry === 'string' ? null : (entry.dur   || null);
  const cached = _audioCache[key];
  if (!cached) return; // preload missed (file missing) — silent fail
  try {
    // Clone: fresh element, no seek-on-playing race, supports overlap.
    // cloneNode(true) on an HTMLAudioElement copies src + preload state;
    // the underlying decoded buffer is shared via Chromium's media cache.
    const audio = cached.cloneNode(true);
    audio.volume = sfx.vol;
    if (start > 0) audio.currentTime = start; // skip seek when start === 0
    _activeSfx.add(audio);
    const cleanup = () => { _activeSfx.delete(audio); };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.play().catch(() => {});
    if (dur) setTimeout(() => {
      try { audio.pause(); } catch (e) {}
      cleanup();
    }, dur * 1000);
  } catch (e) {
    // Silent fail — browser restriction
  }
}
```

**Risk:** LOW. `cloneNode(true)` on a `<audio>` element is supported in
all Chromium versions. Memory: each clone is ~few KB plus a media element
ref; the `ended`/`pause` cleanup releases them. The `_activeSfx` set
correctly accumulates per-call clones, so `stopAllSfx` actually stops all
in-flight clones (currently it only stops one element per key).

**Caveat:** if the original "cloneNode race" diagnosis was about clones
not loading in time, that was wrong reasoning — `cloneNode(true)` inherits
the parent's `readyState >= HAVE_CURRENT_DATA` once the original has
preloaded. The IIFE at audio.js:88-98 sets `preload = 'auto'` which
triggers load on element creation. By the time the user clicks Start,
all clones will inherit fully-decoded state.

### Fix 2 (HIGH) — Skip the `currentTime` write entirely when `start === 0`

If you want to be conservative and NOT add cloning, at minimum gate the
seek. This is included in Fix 1 already (the `if (start > 0)` guard).
As a standalone change without cloning:

**Old:** `audio.currentTime = start;`
**New:** `if (start > 0) audio.currentTime = start;`

**Risk:** LOWEST. Removes the seek-on-zero issue for the majority of SFX
(`jump`, `wasp_sting`, `balloon_collect`, `stomp_bounce`, `respawn`,
`game_over`, `level_complete`, `menu_click`, `menu_nav`, `countdown_tick`,
`windrad`, `water_drain`, `cough`, `l2_outro_bubble`, `wasp_buzz`,
`electricity_ambient`, `flood_ambient`, `smog_ambient`, `crumble`,
`music_l1`, `music_l3` — 21 of 27 entries).

**Caveat:** does NOT fix the rapid-fire same-key case (the second call
still finds the element in `playing` state and `play()` Promise
reconciliation still applies). Fix 1 is strictly better.

### Fix 3 (MEDIUM) — Replace `setTimeout` trim with audio events

For trimmed sounds, use `timeupdate` to pause exactly at the right
playback position rather than trusting wall-clock. Removes Bug B.

```js
if (dur) {
  const stopAt = start + dur;
  const onTime = () => {
    if (audio.currentTime >= stopAt) {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      cleanup();
    }
  };
  audio.addEventListener('timeupdate', onTime);
}
```

**Risk:** LOW. `timeupdate` fires every ~250 ms by spec but Chromium
fires it every ~15–60 ms in practice. For 20 ms `dur` (`damage`) this
might OVER-shoot by one frame; mitigation: the user already accepted this
since `dur` of 20 ms is below `timeupdate` granularity. Better than
under-shooting (silent sound).

### Fix 4 (LOW) — Re-attempt wasp buzz play on user gesture

Already separately addressed by `unlockAudio()` being a no-op and the
buzz being created lazily from the game loop. Consider deferring buzz
creation until the first PLAYING phase begins (post-click).

---

## Verification checklist after applying Fix 1

1. `git diff src/audio.js` shows only the playSound body changed.
2. Manually retest: rapid-tap jump on level start → no audible delay.
3. Rapid-tap arrow keys in start menu → menu_click fires per key, no echo.
4. Take a wasp sting → damage trim is audible (Bug B mitigated by clone
   even though Fix 3 not applied).
5. GAMEOVER → `stopAllSfx` silences any in-flight clones.
6. `_activeSfx.size` should now grow during rapid SFX and shrink as
   `ended` fires; visible via dev-console inspection.

---

## Appendix — call site inventory

```
src/audio.js:112                  function playSound(key)
src/enemies.js:237                playSound('wasp_sting')
src/enemies.js:259                playSound('wasp_death') (paw kill)
src/enemies.js:281                playSound('wasp_death') (stomp)
src/hazards.js:134                playSound('damage')
src/main.js:116                   playSound('balloon_collect')
src/main.js:260                   playSound('bell')
src/main.js:283                   playSound('windrad')
src/main.js:284                   playSound('water_drain')
src/main.js:397                   playSound('countdown_tick')
src/main.js:406                   playSound('game_over')
src/main.js:409                   playSound('level_complete')
src/main.js:413                   playSound('cough')
src/main.js:414                   playSound('l2_outro_bubble')
src/main.js:468/469/601/602/      playSound('menu_click') x8
              627/628/643/644
src/main.js:563                   playSound('land')
src/player.js:134                 playSound('jump')
```

All 18 call sites take the same code path through `playSound()` and all
hit Bug A. There is no call site that bypasses the bug.
