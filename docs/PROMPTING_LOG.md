# Prompting Log — Soggy Moggy

> Auto-maintained by Claude throughout the project. Updated after each major session or phase milestone.
> **Julian's effort: review only — no required input.**

---

## Pre-Phase — Project Setup & Planning

**Date:** 2026-03-03 → 2026-03-05

### Commands Used (in order)
- `/gsd:new-project` — initialized project, gathered requirements, created roadmap
- `/gsd:progress` — checked project state at session start
- `/gsd:check-todos` — reviewed pending items
- `/gsd:list-phase-assumptions 1` — surfaced Claude's assumptions about Phase 1 before planning

### Key Directions Julian Gave
- "Soggy Moggy is the working title" (renamed from "Cat Flood Jumper")
- "We are working with placeholders until I have the sprites"
- "Most important point is to get a functioning MVP"
- "Good separation of MVP features and all else"
- "We need a side project planning for a feature the teacher wants: documenting my prompting strategy"
- Preferred format for prompting strategy: **capture now, analyze + present at project end**
- Tracking effort preference: **minimal — mostly automatic**

- "Player character is a stuffed cat (not a real/live cat)"

### What Julian Changed or Rejected
- Rejected per-session manual journaling (too high effort)
- Rejected committing to a fixed presentation format before seeing what was captured
- Chose "auto-assembled per phase" → refined to "live log + end-of-project analysis" based on clarifying questions
- Clarified that "prompts" = commands + chat directions + overrides (not just GSD commands)

### What GSD Produced
- Goal: Project initialized with 34 requirements, 6-phase roadmap
- Key decisions captured in STATE.md: canvas sizing, delta time, state machine, one-way collision, world coordinates
- Prompting strategy design: two-stage capture-then-present system

### MVP Boundary Established
| MVP — must work | Later / polish |
|---|---|
| Canvas, loop, delta time, input, state machine | — |
| Cat physics + auto-jump | — |
| Basic platforms (rectangles) | Crumbling platforms |
| Camera follows up | — |
| Rising water (flat rectangle) | Animated sine-wave surface |
| 3 lives, damage on contact | — |
| Level complete + game over screens | Polished UI |
| Hosted URL | — |
| Score display | LocalStorage high score |
| Basic throw (box downward) | Cat sprite, throw VFX, sound |

---

- "We need a visual concept phase: style, color, mood, contrasts — done with expert agents. Place it where expert deems fitting."
- Expert placement decision: **between Phase 4 and Phase 5** — after MVP is mechanically proven, before sprite implementation begins

- Git workflow decision: **branch-per-phase** (not per-feature) — recommended as sinnvoll for solo school project; phase branches merge into master via PR when GSD verify-work passes

<!-- New phase entries will be appended here by Claude after each phase milestone -->
