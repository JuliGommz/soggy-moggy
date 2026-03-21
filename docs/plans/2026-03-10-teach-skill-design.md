# Design: `/teach` Private Teacher Skill

**Date:** 2026-03-10
**Status:** Approved

---

## Problem

Julian needs to understand the Soggy Moggy codebase file by file. Reading code alone is inefficient for ADHD learners. An adaptive teacher that persists knowledge across sessions removes the overhead of re-briefing and prevents losing continuity.

---

## Architecture

Three components:

```
/teach (skill — general, methodology only)
    ↕ reads + writes each session
memory/learning-profile.md  ←  persistent learner model
    ↕ reads on demand
src/*.js                    ←  codebase being taught
```

The skill contains **zero domain-specific knowledge**. It only knows HOW to teach. What to teach comes from the learning profile, which is project-specific and lives in the project's memory folder.

---

## Skill: `/teach`

**Type:** General (works for any project, any language)

**Invocation:** Explicit — only active when called

**Session flow:**

1. Read `memory/learning-profile.md`
2. Recap last session: 2-3 sentences max — what was covered, one key insight
3. Suggest next topic from curriculum OR ask what Julian wants to cover
4. Julian selects a file or concept
5. Skill reads the file, breaks it into chunks
6. For each chunk:
   - **CONTEXT** — one sentence: where this sits in the system, why it exists
   - **EXPLAIN** — concise, one concept at a time, no walls of text
   - **VERIFY** — "Does that land? Deeper on X or continue to Y?"
   - **CONNECT** — link back to something already understood
7. End of session: update `memory/learning-profile.md`

**Adaptation rules (built into methodology):**

| Signal | Response |
|--------|----------|
| "I'm lost" | Back up one step, switch to an analogy |
| "I get it, go on" | Skip obvious parts, increase pace |
| 3 confusions in a row | Full approach switch — try visual/metaphor explanation |
| Concept already in profile as mastered | Skip or reference briefly |

**Feedback style (from ITS research):**
- High-information: specific, actionable
- Forward-focused: "next you'll see how this connects to X" not "correct/wrong"

---

## Learner Model: `memory/learning-profile.md`

Project-specific file. The skill reads this to get context and writes to it after each session.

**Structure:**

```markdown
## Project Context
- Project: Soggy Moggy
- Language: JavaScript (Vanilla ES2022+, Canvas 2D)
- Goal: Understand codebase well enough to extend and present it

## Curriculum
- [x] main.js       — completed 2026-03-10
- [ ] game-state.js ← next
- [ ] input.js
- [ ] player.js
- [ ] platforms.js
- [ ] water.js
- [ ] background.js

## Concept Mastery
- game loop (requestAnimationFrame): understood
- delta time (dt/1000): understood
- state machine: partial — transitions unclear

## Confusion Points
- requestAnimationFrame callback timing
- how camera translate works with world coordinates

## What Works For Julian
- analogies before code (conveyor belt for game loop)
- explicit "why does this exist?" before the how
- chunks of max 10 lines
- connecting new concepts to something already mastered

## Preferred Depth
- high-level first, drill only on request
```

---

## What the Skill Does NOT Contain

- No file paths specific to any project
- No curriculum order for Soggy Moggy
- No JavaScript-specific knowledge baked in
- No assumptions about the codebase structure

All of that comes from the learning profile at runtime.

---

## Key Design Decisions

1. **General skill + specific profile** — skill is reusable for any future project; profile carries all project context
2. **Curriculum in the learner model** — matches ITS best practice: knowledge state and learning path are interdependent and must persist together
3. **Explicit invocation** — no always-on overhead; clean separation between building mode and learning mode
4. **Profile updated by the skill** — no manual effort from Julian; system tracks progress automatically (important for ADHD)

---

## References

- [ITS Learner Modeling Book — Design Recommendations](https://gifttutoring.org/attachments/download/645/Design%20Recommendations%20for%20ITS_Volume%201%20-%20Learner%20Modeling%20Book_errata%20addressed_web%20version.pdf)
- [The Path to Conversational AI Tutors](https://arxiv.org/html/2602.19303v1)
- [AI Agents for Education](https://sam-solutions.com/blog/ai-agents-for-education/)
