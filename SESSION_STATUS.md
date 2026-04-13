# Session Status — 2026-04-07 (New Task Intake)

> Resume here. Previous session work complete. New tasks captured below.

---

## What's Done (from last session)

- **Memory Compiler** — live, running on qwen2.5-coder:14b via Ollama ✅
- **ARES Firestore** — seeded, dashboard widgets live ✅
- **Ollama routing** — fixed everywhere (port 11434, qwen2.5-coder:14b) ✅
- **Google Opal Track B** — confirmed to build, brainstorm not yet started

---

## Active: Google Opal Track B

Use Opal to prototype ARES agent workflows before coding them. Process doc, no build required.

**Start with:** brainstorm what ARES workflows to model first (SEO audit? ad copy? keyword research?)

---

## New Tasks (captured 2026-04-07)

### 1. Model Abilities Knowledge Base (Priority: High)
Build and maintain an MD file that documents each LLM's capabilities, context window, cost, strengths/weaknesses.

- Format: one file per model family (e.g. `kb/models/qwen.md`, `kb/models/claude.md`, `kb/models/gemma.md`)
- Auto-update hook: when agent_connector detects a new model or release (via Ollama tags or manual flag), create a Firestore "review" task → sent to agent_inbox for review
- Relevant new models: Gemma 3 (frontend/design help), qwen3.5:9b (pending install), Jules (Google coding agent)

### 2. Harness Consistency / Share Functions
When sharing the harness or onboarding a new LLM into ARES:

- Each LLM should receive a consistent "role card" MD file (what it does, how to behave, what not to do)
- A `share_harness.sh` or ARES skill that exports: SOUL files + role card + CONTEXT summary + task format spec
- Goal: any LLM dropped into ARES behaves consistently without Ashish having to repeat preferences

### 3. Frontend Development Help
Need frontend dev support. Options to evaluate:

- **Gemma 3** (free, Google, good at UI): pull via Ollama, test for React/Tailwind tasks
- **Google Stitch** (UI prototyping, free): evaluate for ARES dashboard design iterations
- **Google Jules** (coding agent, free): evaluate for GitHub-integrated coding tasks
- **Figma MCP** (already installed): audit if it's being used, connect to ARES design workflow

Build a "frontend-dev" skill for Ash Code that routes UI tasks to the best available model.

### 4. Agent Communication via MD Files
For low-token agent-to-agent and agent-to-harness communication:

- Use lightweight MD files as message bus (already partially done via agent_inbox/)
- Define a standard MD message format: header (from/to/priority/type), body, expected response format
- Keeps token count low for inter-agent communication vs. JSON API calls

### 5. Hermes — File Bloat Monitor
System to track and prevent file/context bloat:

- Hermes agent: periodically scans repo and memory for oversized files, duplicate content, stale records
- Reports to ARES dashboard (new widget: "System Health")
- Auto-suggests archival or deletion → sends to agent_inbox as review task
- Also watches ~/.claude/projects/.../memory/ for stale or contradictory memory files

### 6. Opal Track A (after Track B)
Embed/link Opal mini-apps in ARES dashboard or RHM site.

### 7. Opal Track C (after ARES auth stable)
Native mini-app builder inside ARES.

---

## Pending (carried from before)

- `ollama pull qwen3.5:9b` — config ready, not yet installed
- ash-proxy at port 4000 — broken, needs investigation
- Drive OAuth — `save_to_drive.js` scaffold ready, needs `credentials.json`
- Ash Code harness design — Karpathy KB + superpowers audit + local LLM routing

---

## File Locations (anti-bloat reference)

| What | Where |
|------|-------|
| Soul files | `~/rank-higher-media/SOUL_BASE.md`, `SOUL_ARES.md`, `SOUL.md` |
| Session memory | `rolling_summary.md`, `CONTEXT.md`, `PROJECT_STATUS.md` (repo root) |
| Auto-memory index | `~/.claude/projects/.../memory/MEMORY.md` |
| Memory compiler | `~/rank-higher-media/scripts/` |
| ARES platform | `~/rank-higher-media/ares/` |
| Agent inbox/outbox | `ares/agent_inbox/`, `ares/agent_outbox/` |
| Skills | `~/ashish-skills/` |
| Plans/specs | `~/rank-higher-media/docs/superpowers/plans/` + `specs/` |

---

## Start Next Session With

1. Open this file, read context
2. `ollama pull qwen3.5:9b` (background, takes a few min)
3. Brainstorm Google Opal Track B — which ARES workflow to model first?
4. Design Model Abilities KB — file structure + auto-update hook design
5. Evaluate Gemma 3 for frontend tasks (`ollama pull gemma3` or check what's available)
