# Memory Compiler — Design Spec
**Date:** 2026-04-06
**Status:** Approved for implementation

---

## Problem

Every Claude Code session produces decisions, patterns, corrections, and project state changes. Currently all of this is manually compiled by Ashish at session end into 6 files. This is friction that compounds across every session, and the quality of the memory depends on whether he remembers to do it.

---

## Solution

A Node.js script triggered by Claude Code's `Stop` hook. It reads the full session transcript, sends it to an LLM with targeted prompts for each memory file, and writes a staged draft. A separate approval script diffs and merges on confirmation.

---

## Architecture

```
Claude Code session ends
        ↓
  Stop hook fires (payload: full conversation JSON)
        ↓
  scripts/compile_memory.js
  ├── reads current state of all 6 memory files
  ├── sends transcript + current state to LLM
  │   (4 targeted prompts — one per output target)
  └── writes memory_draft.md
        ↓
  Ashish reviews memory_draft.md
        ↓
  scripts/approve_memory.js
  ├── shows git-diff-style preview per file
  ├── prompts: Apply? (y/n/edit)
  └── writes approved changes to live files
```

---

## File Structure

```
~/rank-higher-media/
  scripts/
    compile_memory.js     # hook trigger, LLM call, writes draft
    approve_memory.js     # diff, confirm, merge
    memory_config.js      # LLM provider, file paths, prompt templates
  memory_draft.md         # staging file (gitignored)
  docs/superpowers/specs/
    2026-04-06-memory-compiler-design.md
```

---

## Hook Registration

In `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      { "command": "node /Users/ashishuzelman/rank-higher-media/scripts/compile_memory.js" }
    ]
  }
}
```

---

## LLM Configuration

Defined in `memory_config.js`. Single line swap when Phase 1 local LLM system is ready:

```js
const LLM = process.env.MEMORY_LLM || 'claude'; // 'claude' | 'ollama'
// When switching to local: set MEMORY_LLM=ollama, model: qwen3.5:9b via http://localhost:4000
```

- **Now:** Anthropic SDK → `claude-sonnet-4-6`
- **Phase 2:** Ollama → `qwen3.5:9b` at `http://localhost:4000` (ash-proxy)

---

## Compilation Targets & Prompts

Four LLM calls, each with current file content + transcript as context:

| Target | Prompt Focus |
|--------|-------------|
| `rolling_summary.md` | Summarize session: what was worked on, decisions made, what's unfinished. ~200 words, match existing format. Rotate out oldest entry if > 3 sessions. |
| `CONTEXT.md` | Update live project state: what changed this session, current status of each active project. |
| `PROJECT_STATUS.md` | Add today's daily entry: completed, in-progress, open items. |
| Auto-memory files | Extract new user preferences, feedback corrections, project facts, reference links. Return frontmatter-structured updates per the existing memory file format. |

---

## Staging Format (`memory_draft.md`)

Fenced sections so `approve_memory.js` can parse unambiguously:

```
## [rolling_summary]
...proposed new entry...

## [CONTEXT]
...proposed full updated file content...

## [PROJECT_STATUS]
...proposed daily entry to prepend...

## [auto-memory: feedback_X.md]
...proposed file content (new or updated)...
```

---

## Approval Flow (`approve_memory.js`)

For each section in the draft:
1. Show diff vs live file (unified diff format)
2. Prompt: `Apply to rolling_summary.md? (y/n/edit)`
3. `edit` → opens draft section in `$EDITOR` before writing
4. `y` → writes to live file
5. `n` → skips this target, continues to next

---

## What Gets Skipped

- SOUL_BASE.md, SOUL_ARES.md, SOUL.md — never auto-modified (constitution files, human-only edits)
- permanent.json, client_override.json — never auto-modified (client data, human-only edits)

---

## Error Handling

- If LLM call fails → write error to `memory_draft.md`, do not touch live files
- If transcript payload is empty or too short (< 500 chars) → skip compilation, log reason
- If a live file is missing → create it with the draft content, log creation

---

## Testing

- Unit: mock LLM response, verify draft format is parseable by approve script
- Integration: run against a saved transcript fixture, inspect draft output manually
- No live file writes during tests

---

## Migration Path to ARES (Phase C)

When ARES auth is stable:
1. `compile_memory.js` writes task to `agent_inbox/` instead of `memory_draft.md`
2. ARES worker picks it up, runs compilation, writes draft to Firestore
3. ARES dashboard surfaces review card
4. Approval writes to live files via ARES worker

The Node.js scripts become thin wrappers — core compilation logic stays the same.
