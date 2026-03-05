# Prompting Strategy — Design Document

**Project:** Soggy Moggy (Abschlussprojekt SRH 2026)
**Created:** 2026-03-05
**Purpose:** Document how Julian directed the AI throughout the project, producing evidence for the teacher of agency, understanding, and evaluation.

---

## What This Is

A two-stage system for capturing and presenting Julian's prompting strategy:

1. **Stage 1 — Capture** (throughout the project): A live log updated automatically after each major session or phase milestone. No effort required from Julian.

2. **Stage 2 — Analyze + Present** (after Phase 6): The log and all GSD artifacts are analyzed to produce a final readable explanation with concrete examples. Format (document, per-phase cards, or presentation) is decided then based on what was captured.

---

## What "Prompts" Means Here

All of the following together form Julian's prompting strategy:
- **GSD commands** used and in what order (e.g. `/gsd:list-phase-assumptions`, `/gsd:plan-phase`)
- **Chat directions** Julian gave Claude (e.g. "MVP first", "use placeholders", "Soggy Moggy is the working title")
- **Decisions Julian overrode** — where AI output didn't match intent and Julian corrected it
- **GSD artifacts** — PLAN.md goals, SUMMARY.md outcomes, STATE.md decisions

---

## Stage 1: Capture

**File:** `docs/PROMPTING_LOG.md`

Updated by Claude after each major moment (phase plan, phase execution, key decision). Julian reviews if he wants — no mandatory input required.

### Log Entry Structure (per phase)

```markdown
## Phase N — [Name]

**Date:** YYYY-MM-DD

### Commands Used (in order)
- /gsd:command-1
- /gsd:command-2

### Key Directions Julian Gave
- "[exact direction 1]"
- "[exact direction 2]"

### What Julian Changed or Rejected
- [what AI proposed that was corrected or overridden]

### What GSD Produced
- Goal: [from PLAN.md]
- Outcome: [from SUMMARY.md]
- Key decisions: [from STATE.md]
```

---

## Stage 2: Analyze + Present

**When:** After Phase 6 is complete.

**Process:**
1. Claude reads the full `PROMPTING_LOG.md` + all GSD PLAN.md and SUMMARY.md files
2. Extracts: Julian's strategy patterns, best examples, decision moments
3. Drafts final document in the format that makes most sense for submission
4. Julian edits and approves → committed to `docs/prompting-strategy/`

**Teacher will see:**
- Real prompts and commands as concrete examples
- Explanation of the strategy behind them
- Evidence of **agency** (Julian directed the AI)
- Evidence of **understanding** (Julian knew the why)
- Evidence of **evaluation** (Julian changed what didn't fit)

---

## Repo Structure

```
docs/
├── PROMPTING_LOG.md           ← live log, updated throughout all phases
└── prompting-strategy/
    ├── DESIGN.md              ← this file
    └── [final-output].md      ← created at project end (Stage 2)
```

---

## What Julian Does Not Need to Do

- Remember to update the log → Claude does this
- Write detailed reflections per session → optional, not required
- Decide the final format now → deferred to Stage 2

---
*Design approved: 2026-03-05*
