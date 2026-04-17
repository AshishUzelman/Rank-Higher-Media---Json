# ARES Pipeline Completion — Design Spec

**Date:** 2026-04-17
**Session:** 15 (Gemini integration + gap audit)
**Status:** Ready for implementation planning

---

## Problem

ARES has a documented 5-phase multi-agent loop (RESEARCH → DRAFT → CRITIC → REFINE → SUPERVISOR), but during Sessions 13-14 the focus pivoted to ancillary features (YouTube pipeline, RSS ingestor) and multiple core pieces were left incomplete or unbuilt. Without closing these gaps, ARES cannot fulfill its design goal of **self-improving local agent orchestration**.

## Gap Audit (found 2026-04-17)

### Partial / Started but Not Finished

| Feature | What Exists | What's Missing |
|---|---|---|
| Multi-phase loop | 4/5 phases (DRAFT, CRITIC, REFINE, SUPERVISOR) | RESEARCH phase not fully activated end-to-end |
| Active Dreaming (Phase 2) | `log_correction.js` + 6 corrections logged | Scheduler, LoRA training runner, model reload |
| Memory consolidation | `compile_memory.js` in Stop hook | Fine-tuning loop, integration |
| Dashboard | Scaffold (ProjectCard, TaskQueue, AgentStatus, BrainstormPanel, FileTree) | Phase visualization, live-wired to 5-phase loop |

### Documented but Never Built

- Meta-Harness patterns (4 analyzed in `knowledge/research/meta-harness-tbench2.md`, 0 implemented)
- Ash Code delegator (Phase 6 — design only)
- TBench2 evaluation suite (research only)
- Opal prototype (never started)
- Harness share function (designed, not coded)
- Model Abilities KB (schema designed, empty)

### Blocked / Stalled

- Google Drive OAuth (waiting on `credentials.json`)
- Nightly scheduler (PROJECT_STATUS says "via scheduled-tasks MCP" but no config exists)

---

## Decision: Priority Order

User decision (2026-04-17): **C → B → A**

### Phase C — Verify the Foundation *(boring but critical)*

**Goal:** Prove the 5-phase loop works end-to-end with no hidden breaks.

Scope:
1. Activate and verify RESEARCH phase — confirm it pulls from knowledge base before DRAFT
2. Run a real task through all 5 phases, observing each step produces valid output
3. Identify and fix any breaks in the orchestration (timeouts, routing errors, context bloat)
4. Document the verified flow so Phase B builds on known-good foundation

Success criteria:
- A non-trivial task flows through RESEARCH → DRAFT → CRITIC → REFINE → SUPERVISOR without manual intervention
- Each phase logs its input/output
- Supervisor feedback loop actually re-queues on REJECTED

### Phase B — Close the Dreaming Loop *(highest long-term leverage)*

**Goal:** ARES learns from corrections nightly, making local models better over time.

Scope:
1. Scheduler: add nightly cron/MCP trigger (check `scheduled-tasks` MCP availability)
2. LoRA training runner: MLX fine-tune on `corrections/*.json` → ChatML format
3. Model reload: hot-swap updated gemma3 into connector without restart
4. Verify learning: test task before/after training shows measurable improvement

Success criteria:
- Nightly job runs unattended
- Corrections count threshold (20-30) triggers training
- New model loaded into Ollama and routed to automatically
- At least one concrete example of improved behavior post-training

### Phase A — Dashboard Visualization *(tangible payoff)*

**Goal:** See ARES working — real-time view of the 5-phase loop and agent activity.

Scope:
1. Phase visualization — show which phase each active task is in
2. Wire dashboard to Firestore live updates (tasks, agent_state, corrections)
3. Display corrections and training history from Phase B
4. Add brainstorm debate history panel (already in MEMORY as priority 6)

Success criteria:
- Dashboard shows live task progression through all 5 phases
- Agent activity (worker, critic, supervisor) visible per task
- Corrections log displayed with training status
- Works on localhost, deployed to Vercel

---

## Out of Scope (for this spec)

- Meta-Harness implementation (parked)
- Ash Code delegator (Phase 6 — separate spec later)
- Opal prototype (separate concern)
- Drive OAuth (blocked externally)

---

## Completed This Session (2026-04-17)

- ✅ Google Gemini API integrated as 3rd model provider (4 commits in ARES repo: `5a6a3a2`, `c68f477`, `35b4b0f`, `8b3d861`)
  - `scripts/gemini_provider.js` — wrapper module for `@google/generative-ai` SDK
  - `scripts/memory_config.js` — `GEMINI_MODEL` constant + auto-route for contextSize > 50K tokens
  - `scripts/agent_connector.js` — full routing wired (explicit `Worker: gemini` + auto long-context)
  - `.env.local` — `GEMINI_API_KEY=` placeholder added (user to fill from aistudio.google.com)

- ✅ Gap audit completed — this document captures the findings

- ⏳ Visual Companion (mockup browser) — offered but deferred; add to Phase A task list

---

## Next Session Starting Point

1. Load memory stack (MEMORY.md, CONTEXT.md, PROJECT_STATUS.md, rolling_summary.md, this spec)
2. Read this spec first — it supersedes older "dashboard first" priority in MEMORY.md
3. Begin **Phase C** with: "Verify the RESEARCH phase is activated and running end-to-end"
4. Invoke `writing-plans` skill to break Phase C into executable tasks

---

## Related Files

- `/Users/ashishuzelman/rank-higher-media/CONTEXT.md` — lines 38-100 (multi-phase design)
- `/Users/ashishuzelman/rank-higher-media/ares/scripts/agent_connector.js` — orchestrator
- `/Users/ashishuzelman/rank-higher-media/ares/scripts/memory_config.js` — model constants + `routeModel()`
- `/Users/ashishuzelman/rank-higher-media/ares/scripts/log_correction.js` — corrections logger (Phase B input)
- `/Users/ashishuzelman/rank-higher-media/ares/corrections/` — 6 ChatML-format correction files
- `/Users/ashishuzelman/rank-higher-media/knowledge/research/meta-harness-tbench2.md` — 4 patterns analyzed (future)
