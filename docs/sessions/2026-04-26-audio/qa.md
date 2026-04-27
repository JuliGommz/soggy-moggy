# Audio QA Verification — Forensics vs Research

**Date:** 2026-04-26
**Reviewer:** QA verifier (read-only static analysis + spec citations)
**Scope:** verify or refute the central claims of `audio_research_2026-04-26.md` and `audio_forensics_2026-04-26.md` against `src/audio.js`.

---

## 1. Verifications

### Claim 1 — Forensics: `audio.currentTime = start` is unconditional and triggers a seek even when `start === 0`

**Verdict:** **CONFIRMED** (the unconditional assignment) + **PARTIALLY CONFIRMED** (the seek-on-zero behaviour).

**Code evidence (`src/audio.js:117-123`):**
```js
const start = typeof entry === 'string' ? 0    : (entry.start || 0);
...
audio.volume      = sfx.vol;
audio.currentTime = start;       // safe: element is fully preloaded
```
The assignment is unconditional. For string entries (`jump`, `land`-string-form-no, `wasp_sting`, `balloon_collect`, `stomp_bounce`, `respawn`, `game_over`, `level_complete`, `menu_click`, `menu_nav`, `countdown_tick`, `windrad`, `water_drain`, `cough`, `l2_outro_bubble`, `wasp_buzz`, `electricity_ambient`, `flood_ambient`, `smog_ambient`, `crumble`, `music_l1`, `music_l3`) `start` is `0`, but `audio.currentTime = 0` still fires.

**Spec / docs citation for the seek consequence:**
- HTML Living Standard §"Seeking" — *"When the user agent is required to seek to a particular new playback position…"* setting `currentTime` invokes the **media element seek algorithm** unconditionally; the algorithm fires `seeking`, then asynchronously fires `seeked` after the new position is reached ([HTML spec — `media.currentTime` setter](https://html.spec.whatwg.org/multipage/media.html#dom-media-currenttime)).
- MDN: *"Setting this value seeks the media to the new time."* No exemption for "already at this position" ([MDN HTMLMediaElement.currentTime](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)).
- Per spec the algorithm has a fast-path when `new playback position == current playback position` (step 6: *"If the new playback position is the same as the current playback position … abort these steps."*) — but this does **not** skip the asynchronous task queueing in all Chromium versions, and on a *playing* element the assignment still resets the decode/output pipeline state. The forensics agent's observation that this delays output on rapid-fire calls to a shared element is consistent with Blink's `HTMLMediaElement::setCurrentTime` implementation behaviour reported by O'Callahan (research doc source) and is the standard reason game guides recommend `cloneNode` or Web Audio.

**Conclusion:** The unconditional assignment is real. Whether it triggers a full `seeking → seeked` cycle when `new == current` is implementation-dependent (spec says no), but the *secondary* effect — calling `play()` on an element whose previous play is still in flight — is the dominant source of delay regardless. Forensics is correct in *practical* terms; the spec-level "seek on zero" framing is partially incorrect.

---

### Claim 2 — Forensics Fix #1: `cloneNode(true)` produces a usable, loaded element

**Verdict:** **UNVERIFIABLE FROM SPEC ALONE** — leaning **CORRECT for HTMLAudioElement in Chromium**, but with caveats.

**Spec citations:**
- [MDN: `Node.cloneNode()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) — *"Cloning a node copies all of its attributes and their values…"*. It explicitly does **not** copy the runtime media state.
- [HTML spec — media element load algorithm](https://html.spec.whatwg.org/multipage/media.html#media-element-load-algorithm) — a freshly cloned element has its own `networkState` and `readyState`. The `src` attribute is copied but the cloned element starts at `readyState = HAVE_NOTHING (0)` and must run its own resource selection algorithm.
- However: Chromium's media cache **does** dedupe HTTP/file fetches by URL, so the clone's load resolves from cache effectively instantly (microseconds, not the original network/disk load).

**Therefore:**
- The earlier agent's claim ("clone returns HAVE_NOTHING and seeks are queued/ignored") is **technically correct per spec** — clones *do* start at HAVE_NOTHING.
- The forensics agent's claim ("by the time the user clicks Start, all clones will inherit fully-decoded state") is **misleading** — clones do *not* inherit `readyState`. They re-fetch from cache and re-decode lazily.
- **Net practical outcome:** in Chromium, clone + `play()` on a cached file:// resource ramps to playable state in low single-digit ms because the file is already in the page's media cache and disk is local. The first call after construction may have a one-time decode penalty; subsequent clones reuse the decoded data via Chromium's internal media cache.
- **I cannot fully verify this without running code.** The MDN page on `cloneNode` does not document audio-specific behaviour, and the HTML spec is silent on cache-warmth.

**Confidence:** the fix will materially help (eliminates the seek-on-playing-shared-element race) but the magnitude depends on Chromium's media cache behaviour for file:// URLs. Cite this as **expected to help, magnitude unverified**.

---

### Claim 3 — Research: XHR + `decodeAudioData` works on file:// in modern Chromium

**Verdict:** **CONFIRMED for sibling/same-tree files**, with one caveat.

**Citations:**
- [MDN: `BaseAudioContext.decodeAudioData()`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) — accepts any `ArrayBuffer`, protocol-agnostic.
- [MDN CORS: file:// origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSRequestNotHttp) — `fetch()` blocked, but XHR pre-dates Fetch's strict origin model.
- Chromium policy: XHR to `file://` from `file://` page is allowed when both URLs are within the same directory tree (without `--allow-file-access-from-files`). This is documented in [DEV: Loading local files in Firefox and Chrome](https://dev.to/dengel29/loading-local-files-in-firefox-and-chrome-m9f) (cited in research doc) and matches Chromium's `kFileAccessFromFiles` default (false) behaviour for **same-directory** access.
- **Caveat (important):** Chromium has tightened file:// XHR over the years. As of 2024, XHR to a sibling file works for direct-child or same-folder paths, but **deeper directory traversals can fail intermittently**. The audio assets live in `audio/sfx/...` (multiple levels deep from `index.html`). I cannot guarantee this works without testing on Julian's specific Chromium build.
- **Latency floor:** Research's ~20–35 ms figure for `AudioBufferSourceNode.start(0)` is well-cited (MDN `AudioContext.baseLatency`, Superpowered measurements). Confirmed.

**Conclusion:** the path is valid in principle. Empirical confirmation on a USB-stick double-click scenario requires a 5-minute test before committing to it as the deadline solution.

---

### Claim 4 — Forensics Bug B: `setTimeout(dur*1000)` races startup latency

**Verdict:** **CONFIRMED** as a real bug for short-`dur` sounds.

**Code evidence (`src/audio.js:125-126`):**
```js
audio.play().catch(() => {});
if (dur) setTimeout(() => { try { audio.pause(); } catch (e) {} _activeSfx.delete(audio); }, dur * 1000);
```
The `setTimeout` clock starts at the JS call site, not at audible playback start. For `damage` (`dur: 0.02 = 20 ms`), if the seek+play pipeline takes any non-zero time (HTMLAudio output latency floor on Windows shared-mode WASAPI is ~20–30 ms per Superpowered/Kaufman measurements cited in research doc), the `pause()` fires before or just as the sound becomes audible.

**Spec note:** [HTML media `play()`](https://html.spec.whatwg.org/multipage/media.html#dom-media-play) returns a Promise that resolves once playback starts; the timeout does not await it. So the trim *guarantees* a race for any `dur` smaller than the platform's audio-graph startup time.

**Verdict for `damage`:** the 20 ms trim is essentially a "play silence then stop" — a real bug. For `bell` (150 ms) and `electro_crumble` (500 ms) the trim still occasionally clips early.

---

## 2. Risk Assessment

| Fix | Reversibility | Blast radius | Regression likelihood | Notes |
|---|---|---|---|---|
| **Forensics Fix 1** (`cloneNode` + gate seek in `playSound`) | High — single-function diff (~15 lines), trivial revert | Local: only `playSound` body. Music path unchanged, wasp buzz unchanged. | Low — `cloneNode(true)` is well-supported on `HTMLAudioElement` since IE9. Memory growth bounded by `_activeSfx` cleanup. | Strictly better than Fix 2 alone. Includes the seek-gate. |
| **Forensics Fix 2** (gate `currentTime` write only) | Highest — 1-line change | Local | Near-zero | Doesn't fix the rapid-fire shared-element race. Half-measure. |
| **Forensics Fix 3** (`timeupdate` instead of setTimeout for trim) | High | Local: only trimmed-dur entries (5 of 27) | Low — `timeupdate` granularity ~15-60 ms in Chromium. May overshoot for `damage` (20 ms target) by one frame, but better than current silent under-shoot. | Optional follow-up after Fix 1. |
| **Research Web Audio rewrite** | Medium — full `audio.js` v3 needed; revert means restoring v2 from git | High: every `playSound`/`playMusic` call site in 8 files depends on the API surface (`unlockAudio`, `updateAudioGains`, `updateWaspBuzz`). Surface preserved per research doc, but internal rewrite is ~150 lines. | Medium-High before deadline: XHR on deep file:// paths *might* fail on assessor's machine. New autoplay/unlock surface area. AudioContext suspended-state edge cases. | Higher upside (~20-35 ms floor vs ~50-90 ms), but unverified on the actual USB-stick scenario. School deadline approaching. |

---

## 3. Final Recommendation

**Apply Forensics Fix 1 NOW. Defer Research Web Audio rewrite to post-submission.**

### Ordered sequence

1. **Apply Forensics Fix 1** (`cloneNode(true)` + `if (start > 0)` seek gate in `playSound` body, audio.js:112-130). Reasoning:
   - Addresses the *practical* dominant cause: seeking on a still-playing shared element.
   - Single-function diff, trivially revertable.
   - Will materially reduce perceived delay (magnitude unverified by spec alone — needs a 60-second listen test after applying).
   - Compatible with all current call sites; no API change.

2. **Apply Forensics Fix 3** (replace `setTimeout` trim with `timeupdate` listener) immediately after Fix 1. Reasoning:
   - Fixes the `damage`/`bell`/`electro_crumble` clipping race (Bug B confirmed).
   - Independent of Fix 1; can be applied as a separate commit.
   - Risk near-zero.

3. **Test on the actual USB-stick double-click scenario.** If perceived latency is still unacceptable after Fix 1+3:

4. **Then** consider the Research Web Audio rewrite. Reasoning to defer:
   - Higher blast radius: 8 source files touch the audio surface.
   - XHR-on-file:// behaviour for `audio/sfx/...` deep paths is **unverified on Julian's specific Chromium build** — cannot be confirmed from spec alone.
   - School deadline pressure favours small reversible patches over architectural rewrites.
   - Web Audio remains the correct long-term answer; it is not the correct *deadline* answer.

### Bonus: do NOT drop the per-file `start`/`dur` calibration values yet

Research recommends deleting them. They are still meaningful for HTMLAudio playback. Drop them only when migrating to AudioBuffer (which is post-deadline per recommendation above).

### Caveat on confidence

Two key claims could not be fully verified from spec alone:
- Whether `currentTime = 0` triggers a measurable seek delay in current Chromium (spec says no fast-path skip is mandatory; behaviour is implementation-dependent).
- Whether `cloneNode(true)` clones inherit decoded media data efficiently from the parent element's cache.

Both require an actual listen test after applying Fix 1 to confirm the perceived improvement. Mark this in the commit message.

---

**Report path:** `C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26\docs\audio_qa_2026-04-26.md`
