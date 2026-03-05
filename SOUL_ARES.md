# SOUL_ARES.md — ARES Platform Extension
> Version: 2.0 | Updated: 2026 | Author: Ash
> This file extends SOUL.md with ARES-specific orchestration rules.
> Always load SOUL.md first, then this file.

---

## 1. ARES IDENTITY

**Platform Name:** ARES — Agentic Resource & Execution System
**Purpose:** Multi-agent project management and orchestration platform
**Stack:** Firebase (Firestore + Auth) + React frontend + Hybrid LLM routing
**Status:** Active development — Ash is primary builder + operator

---

## 2. ARCHITECTURE OVERVIEW

```
ARES Platform
├── React Dashboard (agent status, token usage, task progress)
├── Firebase (Firestore — task queue, agent state, memory)
├── LLM Router
│   ├── Ollama/Gemma 3 → bulk tasks, research, formatting
│   └── Claude API → quality-critical decisions, client deliverables
├── Agent Tiers
│   ├── Director (1) — strategic decisions, escalation handler
│   ├── Manager (N) — project-level coordination
│   └── Worker (N) — task execution
└── Memory Stack (this file set)
    ├── soul.md → base constitution
    ├── soul_ares.md → platform extension (this file)
    ├── permanent.json → client + agency facts
    ├── client_override.json → per-client rule exceptions
    └── rolling_summary.md → session context buffer
```

---

## 3. AGENT TIER RULES

### Director Agent
- Only agent allowed to escalate to human operator
- Makes routing decisions (which Manager handles which project)
- Reviews loop guard failures before escalating
- Never executes tasks directly — delegates always

### Manager Agent
- Owns a single project or client at a time
- Coordinates Worker agents, reviews outputs before passing up
- Runs Scrutinizer protocol on Worker outputs
- Reports status to Director in structured format only

### Worker Agent
- Single-task focus — no scope creep
- Outputs must pass local validation before submission to Manager
- Must declare task type at start so routing rules apply correctly

---

## 4. FIREBASE DATA RULES

### Firestore Collections
| Collection | Purpose | Write Access |
|---|---|---|
| `tasks` | Task queue, status, assignments | Manager + Director |
| `agent_state` | Current agent status, active task | Each agent (own doc) |
| `memory` | Session summaries, learned rules | Director only |
| `clients` | Client facts (mirrors permanent.json) | Director only |
| `token_usage` | LLM cost tracking per agent/task | All agents (append) |

### Data Integrity Rules
- Never delete from `memory` — archive instead
- `token_usage` is append-only — never modify past records
- Client data in Firestore must stay in sync with `permanent.json`

---

## 5. REACT DASHBOARD REQUIREMENTS

The dashboard must display:
- [ ] Agent status (idle / active / error) — real-time
- [ ] Active task per agent
- [ ] Token usage by agent (current session + cumulative)
- [ ] Task queue (pending / in-progress / complete / escalated)
- [ ] Loop guard counter (warn at loop 2, halt at loop 3)
- [ ] Drive save status (last save timestamp — flag if > 24hr)

---

## 6. MEMORY PERSISTENCE RULES (CRITICAL)

**The cold-start problem is the #1 failure mode.**

Rules:
1. Every session MUST end with explicit save of all memory files to Google Drive (AI folder)
2. Drive folder ID: `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`
3. Files to save: `soul.md`, `soul_ares.md`, `permanent.json`, `rolling_summary.md`, `client_override.json`
4. If session ends without save → next session starts cold → context is lost
5. Dashboard must show last Drive save timestamp as a persistent warning if stale

**End-of-session save command (Claude Code):**
```bash
# Run at end of every session
node scripts/save_to_drive.js --files soul.md,soul_ares.md,permanent.json,rolling_summary.md,client_override.json --folder 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1
```

---

## 7. LLM ROUTING — ARES SPECIFIC

| Task | Model | Max Tokens | Notes |
|---|---|---|---|
| Task classification | Gemma 3 (local) | 512 | Fast, cheap |
| Research / bulk content | Gemma 3 (local) | 4096 | Cost control |
| Agent-to-agent messages | Gemma 3 (local) | 1024 | Internal only |
| Strategy decisions | Claude API | 2048 | Quality gate |
| Client-facing output | Claude API | 4096 | Always Claude |
| Scrutinizer review | Claude API | 2048 | Quality gate |
| Code generation | Claude API | 4096 | Accuracy required |

---

## 8. ACTIVE PROJECTS

| Project | Status | Priority | Notes |
|---|---|---|---|
| ARES Dashboard (React/Firebase) | Active dev | P1 | Visual agent status UI |
| Rank Higher Media website | Blocked | P1 | DNS config issue — needs unlock |
| Centre Willow (Imajery) | Active | P2 | Monthly SEO/SEM |
| Goldwater Law (Imajery) | Active | P2 | Monthly Google Ads reporting |
| Vanguard: Galactic Rescue | Parked | P3 | Phaser.js/Firebase game |
| SEO Audit Tool | Parked | P3 | 4-agent pipeline |
| Maze Generator | Parked | P3 | TikTok/Shorts automation |
