---
description: Resume Soggy Moggy — verified state recap, zero context loss, single next action
---

You are resuming work on Soggy Moggy. Follow these steps in order, then produce the session recap. No preamble, no "I'll now read…" — just execute and output.

## Step 1 — Read authoritative state
Read: `C:\Users\Teilnehmer\.claude\projects\C--Users-Teilnehmer-Desktop-Schule-PRG-Abschlussprojekt-SRH-26\memory\MEMORY.md`

## Step 2 — Verify (v-rule: check actual code against memory claims)
Run these four targeted reads:

1. Read `src/audio.js` lines 44–79 (SOUNDS map) — count entries, spot any plain string vs object mismatches
2. Read `src/dialogue.js` around line 342 — confirm `GameState.introTimer = 3` (not 0.274 or any other value)
3. Grep `_onPhaseChange` in `src/main.js`, read 40 lines around match — confirm hooks present: music_start, countdown_tick, music per level, game_over, level_complete, cough (L1 outro), stopWaspBuzz
4. Read `src/enemies.js` last 30 lines — confirm `getNearestWaspDist` function present

## Step 3 — Output session recap

Output exactly this block (fill in the bracketed fields, drop the brackets):

---
**Session Start — Soggy Moggy** · [today's date]

**Active phase**: [phase number and name from GSD Planning State]

**Last completed**: [one sentence from the most recent "Erledigt" entry in MEMORY]

**Verification results**:
- SOUNDS map: [N entries found; any issues?]
- introTimer: [value found — PASS if 3, FAIL + quote actual value if not]
- _onPhaseChange hooks: [list which triggers are confirmed present; flag any missing]
- getNearestWaspDist: [PRESENT or MISSING]

**Immediate next action** (Prio 1):
[Single sentence — what to do first based on MEMORY "Top-Prio Prio 1"]

**Prio 1 checklist**:
[Bullet list from MEMORY Prio 1 items, each prefixed DONE / PENDING based on verification]

**Needs download before testing audio**:
[List any files from "Files still to download" in MEMORY Phase 6 section]
---

Rules for this output:
- No em-dashes in prose
- No KI-Sprache (no "certainly", "I'd be happy to", etc.)
- One language (match the language Julian uses in this session)
- If any verification FAILS, put a bold WARNING above the checklist
