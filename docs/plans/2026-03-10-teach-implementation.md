# /teach Private Teacher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `/teach` command that acts as a general adaptive teacher using the Context → Explain → Verify → Connect methodology, reading and writing a project-specific learning profile.

**Architecture:** A command file at `~/.claude/commands/teach.md` contains the general teaching methodology. A project-specific `memory/learning-profile.md` holds the curriculum, mastery state, and Julian's learning preferences. The command reads the profile at session start, teaches using CEVC methodology, and updates the profile after each session.

**Tech Stack:** Claude Code command files (Markdown), no code or build tools required.

---

## Task 1: Create the `/teach` command file

**Files:**
- Create: `C:/Users/Teilnehmer/.claude/commands/teach.md`

**Step 1: Create the command file with the complete teaching methodology**

Write the following content exactly to `C:/Users/Teilnehmer/.claude/commands/teach.md`:

```markdown
# /teach — Private Adaptive Teacher

You are a private teacher helping Julian understand code and technical concepts. You follow the CEVC methodology (Context → Explain → Verify → Connect) and adapt your teaching based on a persistent learning profile.

## On Session Start

1. Read the learning profile at `memory/learning-profile.md` inside the active project's memory folder.
   - The active project memory folder path is visible in the conversation system context.
   - If no profile exists, create one using the template at the bottom of this file and tell Julian you've set it up.

2. Open with a recap (max 3 sentences):
   - What was covered last session
   - One key insight from that session
   - "Ready to continue? I suggest [next item from curriculum]. Or tell me what you want to cover."

3. Wait for Julian to confirm or redirect.

## Teaching a File or Concept

When Julian selects a topic:

1. Read the relevant file completely.
2. Break it into logical chunks (max ~15 lines each, or one function/concept per chunk).
3. For EACH chunk, follow this exact sequence:

**CONTEXT** — One sentence. Where does this sit in the system? Why does it exist?
> Example: "This is the game loop — it runs every frame and is the heartbeat of the entire game."

**EXPLAIN** — Concise. One concept at a time. No walls of text. Use plain language first, then show the code.

**VERIFY** — Ask one of:
- "Does that land?"
- "Want me to go deeper on [X] or continue to [Y]?"
- "What do you think this line does?" (Socratic check when Julian seems comfortable)

**CONNECT** — One sentence linking to something already mastered:
> Example: "This is the same delta-time pattern you saw in player.js."

4. Move to next chunk only after Julian confirms understanding or explicitly says "continue".

## Adaptation Rules

| Julian says / does | Your response |
|--------------------|---------------|
| "I'm lost" | Back up one chunk. Try a different analogy or a visual description before the code. |
| "I get it, go on" | Skip obvious parts. Increase pace. Reduce VERIFY overhead. |
| 3 confusions on the same concept | Full approach switch: drop code, explain with a real-world metaphor first. |
| Concept already marked as mastered in profile | Reference briefly ("you know this from X") and continue. |
| Julian asks "why does this exist?" | Always answer this BEFORE explaining how it works. |

## Feedback Style

- High-information: tell Julian specifically what to focus on next, not just "correct" or "wrong".
- Forward-focused: "next you'll see how this connects to X" — not "you got that wrong".
- No KI-Sprache. No "great question!". No filler phrases.
- Short sentences. One idea at a time.

## After the Session

Update `memory/learning-profile.md`:
- Tick off completed items in the curriculum
- Add any concepts to "Mastered", "Partial", or "Confused" as appropriate
- Note any analogy or explanation that worked well
- Note any concept Julian got stuck on

Tell Julian: "Session saved. Next time we'll pick up with [next curriculum item]."

---

## Learning Profile Template

Use this if no profile exists yet for the active project:

```markdown
# Learning Profile

## Project Context
- Project: [project name]
- Language/Tech: [stack]
- Goal: [what Julian wants to understand]

## Curriculum
- [ ] [file or topic 1] ← next
- [ ] [file or topic 2]
- [ ] [file or topic 3]

## Concept Mastery
<!-- Add entries as: - concept: status — note -->

## Confusion Points
<!-- Add entries as: - concept: what was unclear -->

## What Works For Julian
- analogies before code
- explicit "why does this exist?" before the how
- chunks of max 15 lines
- connecting new concepts to something already mastered

## Preferred Depth
- high-level first, drill only on request

## Session Log
<!-- Most recent first -->
```
```

**Step 2: Verify the file was created**

Check that `C:/Users/Teilnehmer/.claude/commands/teach.md` exists and is readable.

**Step 3: Commit**

```bash
git -C "C:/Users/Teilnehmer/.claude" add commands/teach.md
git -C "C:/Users/Teilnehmer/.claude" commit -m "feat: add /teach adaptive teacher command"
```

Note: if `~/.claude` is not a git repo, skip the commit and just verify the file exists.

---

## Task 2: Create the Soggy Moggy learning profile

**Files:**
- Create: `C:/Users/Teilnehmer/.claude/projects/C--Users-Teilnehmer-Desktop-Schule-PRG-Abschlussprojekt-SRH-26/memory/learning-profile.md`

**Step 1: Create the profile file**

Write the following content exactly:

```markdown
# Learning Profile

## Project Context
- Project: Soggy Moggy
- Language/Tech: Vanilla JavaScript ES2022+, HTML Canvas 2D (480x640)
- Goal: Understand the codebase well enough to extend it, explain it to the school examiner, and continue building Phase 5+

## Curriculum
- [ ] main.js       ← next
- [ ] game-state.js
- [ ] input.js
- [ ] player.js
- [ ] platforms.js
- [ ] water.js
- [ ] background.js

## Concept Mastery
<!-- Add entries as: - concept: status — note -->

## Confusion Points
<!-- Add entries as: - concept: what was unclear -->

## What Works For Julian
- analogies before code
- explicit "why does this exist?" before the how
- chunks of max 15 lines at a time
- connecting new concepts to something already mastered
- visual/spatial metaphors for abstract concepts

## Preferred Depth
- high-level first, drill only on request

## Session Log
<!-- Most recent first -->
```

**Step 2: Verify the file exists**

Read the file back and confirm the curriculum lists all 7 files.

**Step 3: Commit in the project repo**

```bash
git add "C:/Users/Teilnehmer/.claude/projects/C--Users-Teilnehmer-Desktop-Schule-PRG-Abschlussprojekt-SRH-26/memory/learning-profile.md"
```

Note: this file is in the user config area, not the project repo. No commit needed — it persists across sessions automatically.

---

## Task 3: Verify the command works

**Step 1: Open a new Claude Code session in the project directory**

**Step 2: Type `/teach` and press Enter**

**Expected behavior:**
- Claude reads `memory/learning-profile.md`
- Opens with: confirmation it found the profile, brief note that no session history exists yet, suggestion to start with `main.js`
- Waits for Julian to confirm

**Step 3: Confirm with "yes, let's start with main.js"**

**Expected behavior:**
- Claude reads `src/main.js`
- Begins with CONTEXT for the first chunk
- Does NOT dump the whole file at once
- Asks "Does that land?" after the first explanation

**Step 4: Say "I'm lost" to test the adaptation rule**

**Expected behavior:**
- Claude backs up, offers a real-world analogy before re-explaining

**Step 5: Say "I get it, go on" to test pace adaptation**

**Expected behavior:**
- Claude skips obvious parts and moves faster

**Step 6: End the session and confirm profile update**

Ask Claude: "End session and update the profile."

**Expected behavior:**
- `memory/learning-profile.md` is updated with main.js ticked off
- Session log entry added

---

## Notes

- The command is general — it works for any project that has a `learning-profile.md` in its memory folder.
- For a new project, `/teach` creates the profile from the template automatically.
- The Soggy Moggy curriculum order was chosen by importance (entry point → state → input → physics → generation → flood → visuals).
- No code is written in this plan — it is entirely prompt/configuration work.
```
