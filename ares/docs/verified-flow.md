# ARES Verified Execution Flow

**Audited:** 2026-04-17 (Session 16)
**Source:** `scripts/agent_connector.js` (full read)
**Status:** Flow documented — end-to-end run pending

---

## Actual 5-Phase Flow

The "5 phases" map to these real code paths:

```
agent_inbox/<task>.md
        ↓
[ROUTE]     agentPicker() → routeModel() → picks qwen3:30b-a3b / gemma3 / gemini / claude
        ↓
[RESEARCH]  buildContextPacket() in load_context.js
            └─ Section 5: retrieveKnowledge() — pulls relevant KB chunks
            └─ Writes full context to /tmp/ares_context_<taskId>.md
        ↓
[DRAFT]     runOllamaWorker() — Actor turn 1
            └─ Prompt = context packet + task + (optional supervisor retry feedback)
        ↓
[CRITIC]    runCriticReview() — gemma3:12b scores draft (JSON: score/10, issues, suggestion)
            └─ Score ≥ 9 or no issues → exit early ✅
        ↓
[REFINE]    runOllamaWorker() — Actor turn 2 (with critic feedback injected)
            └─ Loop controlled by ACTOR_CRITIC_TURNS (default: 2)
        ↓
[SUPERVISOR] runSupervisor() — gemma3:12b final review
            APPROVED → write Firestore complete, archive task ✅
            REJECTED → requeue to agent_inbox/ with RetryCount+1
                        └─ Max retries (3) → escalated_<taskId>.md
```

---

## What's Actually Built

| Phase | Code | Status |
|---|---|---|
| RESEARCH | `load_context.js` section 5 — `retrieveKnowledge()` | ✅ Built, always-on |
| DRAFT | `runOllamaWorker()` — Actor turn 1 | ✅ Built |
| CRITIC | `runCriticReview()` — gemma3:12b JSON feedback | ✅ Built |
| REFINE | `runOllamaWorker()` — Actor turn 2+ | ✅ Built |
| SUPERVISOR | `runSupervisor()` — APPROVED/REJECTED + requeue | ✅ Built |

**All 5 phases exist and are wired.** Phase C goal is to verify they fire correctly in sequence with a real task.

---

## Important Nuance: Two Research Passes

1. **Primary RESEARCH** (`load_context.js` section 5): Always runs. Loads relevant KB chunks into the context packet before the worker sees the task.

2. **Retry research pass** (`runOllamaWorker` lines 262-298): Only fires when a task is REJECTED by the Supervisor AND the task metadata includes `**ResearchFiles**:`. This is a targeted deep-read for retry corrections — not the main research phase.

---

## Key Config (from memory_config.js)

| Setting | Value |
|---|---|
| WORKER_MODEL | qwen3:30b-a3b |
| SUPERVISOR_MODEL | gemma3:12b |
| ACTOR_CRITIC_ENABLED | true |
| ACTOR_CRITIC_TURNS | 2 |
| SUPERVISOR_MAX_RETRIES | 3 |

---

## Routing Logic

Task routing precedence (highest to lowest):
1. `**Worker**: claude` → CLAUDE_OLLAMA_MODEL (claude-sonnet-4-6 via Ollama or CLI fallback)
2. `**Worker**: gemini` → GEMINI_MODEL
3. `**Worker**: <other>` → that model directly
4. Default → agentPicker() (qwen3 AI picker) → fallback routeModel() (rule-based)
5. `taskType === 'debate'` → brainstorm.js (overrides above)

---

## Gaps Found During Audit

1. **SUPERVISOR_MODEL is gemma3:12b** but MEMORY.md says it was upgraded to gemma3:27b-it-qat. Check if `ollama pull gemma3:27b-it-qat` has been run. If not, gemma3:12b is used (works, just older).

2. **ACTOR_CRITIC_TURNS = 2** means one draft + one refinement. Loop exits early if score ≥ 9. This is fine for verification.

3. **No structured phase logging** — phases aren't stamped with timestamps in Firestore. You can tell phases fired from console output but not from Firestore history. Phase A dashboard will need this added.

4. **Ollama required** — connector won't work if Ollama isn't running. `npm run ares-status` should be run before Task 2 (end-to-end run).

---

## Task 2 Checklist (end-to-end run)

Before running:
- [ ] Confirm Ollama is running: `curl http://localhost:11434/api/tags`
- [ ] Confirm qwen3:30b-a3b is available: check output of above
- [ ] Confirm gemma3:12b is available (or 27b if pulled)
- [ ] Set `GEMINI_API_KEY` in `ares/.env.local` if testing gemini routing

To run:
```bash
cd ~/rank-higher-media/ares
npm run ares-start   # starts ares_daemon.js watcher
# In another terminal, drop a test task:
cat > agent_inbox/task_verify_001.md << 'EOF'
# Summarize ARES Architecture

**Priority**: normal
**Assignee**: qwen3
**Initiator**: phase-c-verification

Summarize the ARES agent system in 3 bullet points. Include: what it is, how tasks flow through it, and what the local models do.
EOF
npm run ares-log     # watch output
```

Expected output sequence:
```
🔔 Task received: task_verify_001.md
   ✅ Knowledge: N chunk(s) retrieved from knowledge/   ← RESEARCH ✅
🎭 Actor-Critic — Actor turn 1/2                        ← DRAFT ✅
🎭 Actor-Critic — Critic reviewing turn 1 output...     ← CRITIC ✅
🎭 Actor-Critic — Actor turn 2/2                        ← REFINE ✅
🧐 Supervisor reviewing Worker output (gemma3:12b)...   ← SUPERVISOR ✅
   🧐 Supervisor decision: APPROVED
```

If all lines appear → Phase C verified ✅
