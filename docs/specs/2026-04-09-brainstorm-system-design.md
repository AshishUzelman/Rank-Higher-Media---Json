# Brainstorm System — Design Spec
**Date:** 2026-04-09
**Project:** ARES Platform
**Status:** Approved
**Author:** Ashish Uzelman + Claude

---

## 1. Overview

A local multi-agent brainstorm system that lets agents debate ideas, fact-check each other, and persist decisions to a project-tagged knowledge base. Zero Claude API cost for debates — fully local via Ollama (qwen3 + gemma3) with Gemini as an optional free-tier tie-breaker.

Invokable two ways:
- **CLI:** `node scripts/brainstorm.js "topic" --project ares`
- **Claude Code skill:** `/brainstorm "topic" ares`

Every debate is permanently saved to `knowledge/debates/{project}/` and feeds back into `load_context.js` via existing Obsidian KB retrieval.

---

## 2. Agent Roles

### Strategist (qwen3:30b-a3b)
- **Persona:** Big-picture thinker. Opportunity-focused. Recommends direction.
- **Round 1:** Reads project expert profile + topic → proposes position with reasoning
- **Round 2:** Reads DA challenge → revises or defends position with updated reasoning
- **Temperature:** 0.4 (grounded but exploratory)
- **System prompt:** WORKER_SYSTEM_PROMPT + project expert profile

### Devil's Advocate (qwen3:30b-a3b, research persona)
- **Persona:** Evidence-driven skeptic. Research-first. Finds gaps and improvements.
- **Process (always in this order):**
  1. **Research pass** — reads `knowledge/debates/{project}/*.md` and `knowledge/{project}/*.md` for relevant prior decisions and evidence
  2. **Fact-check** — identifies where Strategist's position conflicts with or lacks evidence from the KB
  3. **Challenge** — argues against weak points using evidence
  4. **Improvement suggestions** — concrete ways to strengthen the proposal based on what research shows
- **Temperature:** 0.6 (more aggressive, surfaces non-obvious angles)
- **System prompt:** Custom DA persona — "You are a research-first Devil's Advocate. Before challenging, always read the knowledge base. Never challenge without evidence."

### Synthesizer (gemma3:12b)
- **Persona:** Arbitrator. Reads full transcript. Produces consensus decision.
- **Input:** Full debate transcript (all rounds)
- **Output:** Structured JSON + markdown decision
- **Temperature:** 0.1 (deterministic judgment)

### Gemini Tie-Breaker (Gemini 1.5 Flash, free tier)
- **Triggered when:** Synthesizer confidence < 0.7 OR debate rounds produce no convergence
- **Role:** Independent outside perspective — different model, different training
- **Input:** Debate summary (not full transcript — conserves tokens)
- **Cost:** Free tier (15 RPM, 1M tokens/day)

---

## 3. Debate Flow

```
INPUT: topic + project tag
        │
        ▼
Load project expert profile
→ knowledge/projects/{project}-context.md (auto-generated, <800 tokens)
        │
        ▼
[ROUND 1]
Strategist → Position A
        │
        ▼
DA Research Pass
→ searches knowledge/debates/{project}/*.md
→ searches knowledge/{project}/*.md
→ fact-checks Position A vs evidence
→ DA Challenge + Improvements
        │
        ▼
[ROUND 2]
Strategist → Revised Position B (responds to DA challenge)
        │
        ▼
DA Final Word
→ brief: "still contested" OR "satisfied with revision"
        │
        ▼
Synthesizer (gemma3)
→ reads full transcript
→ outputs: { status, decision, confidence, reasoning, open_questions }
        │
        ├── confidence >= 0.7 → DONE
        │
        └── confidence < 0.7 → Gemini Tie-Breaker
                                → summary only (not full transcript)
                                → final decision appended
        │
        ▼
Save to knowledge/debates/{project}/YYYY-MM-DD-{slug}.md
Update knowledge/projects/{project}-context.md
```

---

## 4. Output File Format

```markdown
---
project: ares
date: 2026-04-09
topic: "should we add multi-phase worker loop"
slug: multi-phase-worker-loop
tags: [architecture, routing, agents]
status: resolved
confidence: 0.85
decision: "yes — implement phase 1 as research → draft only, defer full loop"
---

## Strategist — Round 1
[Position A content]

## Devil's Advocate — Round 1
### Research findings
[What KB actually says]
### Fact-check
[Where Position A conflicts with evidence]
### Suggested improvements
[Concrete improvements based on evidence]

## Strategist — Round 2
[Revised position]

## Devil's Advocate — Final Word
[Satisfied / still contested + why]

## Synthesis (gemma3)
[Consensus reasoning]

## Final Decision
**Decision:** yes — implement phase 1 as research → draft only
**Confidence:** 0.85
**Open questions:** [any unresolved items for follow-up]
```

---

## 5. Project Expert Profiles

**Location:** `knowledge/projects/{project}-context.md`

**What it contains (max 800 tokens):**
- Stack summary (copied from SOUL_ARES/SOUL_BASE relevant section)
- Last 3 architectural decisions (auto-pulled from recent debates)
- Current build order / active priorities
- Key conventions (JS only, Tailwind, Firebase 12 guards, etc.)

**Auto-regeneration:** qwen3 regenerates this file when a new debate is saved, using the memory compiler pattern. Never hand-authored — always derived from source files.

**Projects:** `ares`, `ad-creator`, `rhm`, `skill-factory`, `ash-code`

---

## 6. Structured Output Contract

Every agent output includes a JSON header block that the orchestrator parses for routing decisions:

```json
{
  "agent": "strategist|devil-advocate|synthesizer",
  "round": 1,
  "status": "complete|needs-revision|contested",
  "confidence": 0.85,
  "next_action": "continue|synthesize|tie-breaker",
  "word_count": 420
}
```

Followed by a `---` separator, then the full markdown content.

This enables the orchestrator (brainstorm.js) to make routing decisions without parsing free-form text.

---

## 7. Claude Code Skill Layer

**File:** `~/.claude/skills/brainstorm/SKILL.md`

```yaml
---
name: brainstorm
description: "Multi-agent local brainstorm debate. Use when exploring ideas, planning features, or making architectural decisions. Runs debate locally via Ollama — zero Claude API cost."
disable-model-invocation: true
allowed-tools: Bash(node *)
argument-hint: "[topic] [project]"
---
```

**Dynamic context injection (fires before Claude sees anything):**
```
## Project: $1 — Expert Context
!`cat ~/rank-higher-media/knowledge/projects/$1-context.md 2>/dev/null || echo "No expert profile yet — will be generated after first debate"`

## Recent Debates ($1)
!`ls ~/rank-higher-media/knowledge/debates/$1/ 2>/dev/null | sort -r | head -5 || echo "No debates yet"`
```

**Execution:**
```bash
node ~/rank-higher-media/ares/scripts/brainstorm.js "$0" --project "$1"
```

**Result presentation:** Reads output file, presents decision + confidence + open questions to user.

---

## 8. knowledge_retrieval.js Enhancement

Add project-scoped filtering so agents load only relevant knowledge:

```javascript
// New signature
getRelevantKnowledge(query, options = {})
// options.project: 'ares' | 'ad-creator' | 'rhm' | null (null = all)
// options.type: 'debates' | 'youtube' | 'rss' | null (null = all)
// options.limit: max chunks to return (default: 5)
```

When project is specified, searches only:
- `knowledge/debates/{project}/*.md`
- `knowledge/{project}/*.md`
- `knowledge/projects/{project}-context.md`

---

## 9. agent_connector.js Integration

Add `**TaskType**: debate` support to processTask():

```javascript
if (taskType === 'debate') {
  // Run brainstorm.js instead of Actor-Critic loop
  const topic = extractDebateTopic(taskContent)
  const project = parseTaskField(taskContent, 'Project') || 'ares'
  spawnSync('node', [
    path.join(__dirname, 'brainstorm.js'),
    topic,
    '--project', project
  ], { stdio: 'inherit' })
  workerSuccess = true
}
```

---

## 10. Hooks Improvements (from best practices research)

Implement these hooks alongside the brainstorm system (same session, high leverage):

| Hook | Trigger | Action |
|---|---|---|
| `SessionStart` | Every session | Load `knowledge/projects/{active-project}-context.md` as additionalContext |
| `SubagentStart` | Every subagent spawn | Inject project expert profile automatically |
| `Stop` | Session end | Run memory compiler if >3 files changed in session |
| `PostToolUse` | After Write/Edit | Run ESLint if .js file changed |

**Why:** Hooks are deterministic (unlike CLAUDE.md which is advisory). These four hooks give Ash Code persistent project context across sessions, auto-enforced quality, and automatic memory compilation — without any manual steps.

---

## 11. Ash Code: Brainstorm Process Checklist

The `superpowers:brainstorming` skill enforces a 9-step checklist via TodoWrite. This exact process must be built into Ash Code as a native skill so it applies to ALL creative work — not just when superpowers is loaded.

**File:** `~/.claude/skills/ash-brainstorm/SKILL.md`

The Ash Code brainstorm skill mirrors superpowers:brainstorming with these additions:
1. **Steps 1-9 tracked via TodoWrite** (same as superpowers)
2. **HARD-GATE enforced** — no code before design approval
3. **Local debate engine** — for steps 3-4 (approaches + design), calls `brainstorm.js` to get qwen3+gemma3 perspectives, not just Claude's single view
4. **Project-aware** — auto-loads expert profile for the relevant project
5. **Spec saved** to `ares/docs/specs/YYYY-MM-DD-{topic}-design.md` (ARES) or project-appropriate location

**Checklist (9 steps, enforced by TodoWrite):**
1. Explore project context (files, docs, recent commits, recent debates from KB)
2. [Visual companion if needed]
3. Ask clarifying questions (one at a time, DA-style: research first)
4. Run local debate if topic is complex (calls brainstorm.js)
5. Propose 2-3 approaches with trade-offs
6. Present design sections → get approval
7. Write spec to `docs/specs/YYYY-MM-DD-{topic}-design.md`
8. Spec self-review (placeholder scan, consistency, scope, ambiguity)
9. User reviews spec → invoke writing-plans

---

## 12. File Map — What Gets Created

```
ares/
  scripts/
    brainstorm.js                    ← NEW: debate engine (Ollama orchestrator)
  docs/
    specs/
      2026-04-09-brainstorm-system-design.md  ← THIS FILE

knowledge/                           ← exists from Obsidian KB work
  debates/
    ares/                            ← NEW: per-project debate archive
    ad-creator/
    rhm/
    skill-factory/
    ash-code/
  projects/
    ares-context.md                  ← NEW: auto-generated expert profiles
    ad-creator-context.md
    rhm-context.md

~/.claude/skills/
  brainstorm/                        ← NEW: Claude Code entry point
    SKILL.md
  ash-brainstorm/                    ← NEW: Ash Code process checklist skill
    SKILL.md
```

---

## 13. Out of Scope (This Iteration)

- Claude Code Agent Teams (paid, multi-Claude) — future option for high-stakes strategic decisions only
- Vector database / embeddings — overkill at current KB size; file-based retrieval is sufficient
- Real-time streaming debate output to ARES dashboard — future nice-to-have
- Debate between more than 2 agents — diminishing returns on M1 RAM (qwen3 = 18GB)

---

## 14. Success Criteria

- [ ] `/brainstorm "topic" project` runs end-to-end with no manual steps
- [ ] DA always cites specific KB files in its challenge (not just opinion)
- [ ] Every output file has project frontmatter + structured JSON header
- [ ] `knowledge_retrieval.js` filters by project (no cross-contamination)
- [ ] `ash-brainstorm` skill enforces 9-step checklist via TodoWrite
- [ ] SessionStart hook loads project expert profile automatically
- [ ] Expert profiles auto-regenerate when new debate is saved
