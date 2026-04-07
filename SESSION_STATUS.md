# Session Status — 2026-04-06 (While You Were Out)

> Written while Ashish was on a dog walk. Resume here.

---

## What Got Done

### 1. Memory Compiler — Complete + Running on qwen ✅

All 8 tasks implemented, reviewed, and tested. The system is live.

**How it works now:**
- Claude Code `Stop` hook fires at session end
- `scripts/compile_memory.js` reads transcript → calls **qwen2.5-coder:14b via Ollama** → writes `memory_draft.md`
- You run `cd ~/rank-higher-media && node scripts/approve_memory.js` to review diffs + merge

**Default LLM:** `qwen2.5-coder:14b` at `localhost:11434` (Ollama — free, local, no API tokens)
**Fallback:** Set `MEMORY_LLM=claude` to use Claude API for higher-quality runs

**Quality verified:** qwen output is solid — rolling_summary, CONTEXT, PROJECT_STATUS all correct. Auto-memory JSON fence stripping fixed.

---

### 2. ARES — Seeded + Running ✅

- **Firestore seeded** with 3 agents, 3 tasks, 2 token records, 2 memory records
- **ARES dev server running on `localhost:3000`** — open it now to see the live dashboard
- All 4 widgets (AgentStatus, TaskQueue, TokenUsage, MemoryState) are on live Firestore subscriptions

**Agents in Firestore:**
| Agent | Model | Tier |
|-------|-------|------|
| gemini-manager | gemini-2.0-flash | Manager |
| claude-terminal | claude-sonnet-4-6 | Worker |
| ash-local | qwen2.5-coder:14b | Worker |

**`agent_connector.js` fixed** — now checks Ollama at `localhost:11434` directly (ash-proxy at port 4000 is broken, bypassed for now)

---

### 3. Ollama Routing Fixed Everywhere

| Component | Before | After |
|-----------|--------|-------|
| memory_config.js | port 4000 (broken), claude default | port 11434, **ollama default** |
| agent_connector.js | port 4000 (broken) | port 11434 ✅ |
| Model | qwen3.5:9b (not installed) | **qwen2.5-coder:14b** (installed, tested) |

---

## What Needs Your Attention

### 1. Open a terminal and run the ARES connector
```bash
cd ~/rank-higher-media/ares && node scripts/agent_connector.js
```
This starts watching `agent_inbox/` for tasks. There's a `task_001.md` in the inbox ready to process. But — it will invoke `claude` CLI to execute the task, which costs tokens. Review `agent_inbox/task_001.md` first and decide if you want to process it.

### 2. Visit ARES dashboard
Open `http://localhost:3000` — you should see all 4 widgets live with Firestore data.

### 3. ash-proxy at port 4000
Something is running on port 4000 but returning `{"error":"not found"}` for all routes. Need to investigate what it is and fix it — this is the future MoE router entry point. Not blocking anything right now.

### 4. qwen3.5:9b not installed yet
The config is ready for it (`OLLAMA_MODEL=qwen3.5:9b`). To install:
```bash
ollama pull qwen3.5:9b
```
Current model: `qwen2.5-coder:14b` (working fine, 14B params, Q4_K_M)

---

## Next Priorities (suggested order)

1. **See ARES live** — open http://localhost:3000, confirm 4 widgets show data
2. **Run `node scripts/approve_memory.js`** — approve the memory draft qwen just compiled (this session's memory)
3. **Opal integration design** — 3 tracks (B→A→C), start with track B (process doc, free)
4. **ash-proxy investigation** — what's on port 4000 and why is it broken?
5. **Drive OAuth** — `save_to_drive.js` scaffold exists, just needs `credentials.json`

---

## Commits This Session

```
rank-higher-media/main:
  d04adda0 feat: switch memory compiler to qwen2.5-coder:14b via Ollama, fix JSON fence stripping
  9e3735eb test: add sample transcript fixture for integration testing
  f773d619 fix: filter blank entries in rolling_summary session slice
  b4a35091 feat: add approve_memory.js with diff preview and interactive merge
  ...+ 9 more commits (full memory compiler implementation)

ares/main:
  f0d0532  fix: point local LLM check at Ollama port 11434 (ash-proxy at 4000 not working)
```

---

## Token Savings Starting Now

The memory compiler now runs on qwen (free) instead of Claude API on every session end.
Each compilation = ~4 LLM calls that previously would have cost Claude API tokens = **0 tokens now**.

To use qwen for other Claude Code tasks: the MEMORY_LLM env var pattern can be extended.
The MoE router (agent_connector Phase 3) will generalize this to all agent tasks.
