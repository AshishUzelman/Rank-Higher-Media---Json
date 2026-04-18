# rolling_summary.md — Session Context Buffer
> Keeps last 3 sessions. Archive older sessions to Drive before overwriting.
> Drive folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1
> Update this file at the END of every session before closing.

---

## Session 17 — 2026-04-18
**Date:** 2026-04-18
**Primary Work:**
- **Ollama 404 bug FIXED** — Gemma picker was hallucinating bare model names (`qwen3` instead of `qwen3:30b-a3b`). Added `normalizeModelName()` + `MODEL_NAME_MAP` in [agent_connector.js](ares/scripts/agent_connector.js). Applied at BOTH the picker response AND the explicit task-file `**Worker**:` tag path.
- **.env.local recreated** — 7 Firebase vars + GEMINI_API_KEY, validated with seed script.
- **Firestore migrated to Admin SDK** — `firestore-client.js` rewritten to use `firebase-admin` + `service-account.json` (at `ares/service-account.json`). Bypasses security rules entirely. No more PERMISSION_DENIED noise in daemon. Also updated `seed_missing_collections.js` to Admin SDK API.
- **4 collections seeded** — articles, books, seo_tool, projects (via temporary open rules, then locked back down).
- **Qwen executed 5 tasks via the loop:**
  - task_02: PhaseTimeline React component (in outbox, minor CSS issues noted)
  - task_04: meta-task — produced Phase B specs inline (split manually into task_05/06/07)
  - task_05: dreamlog_scheduler.js (in outbox, has relative-path bug — fix queued as task_10)
  - task_06, task_07 failed with `fetch failed` (Ollama OOM from concurrent load) — re-queued one at a time
- **Commits:** `11e2c031` — fix(ares): resolve Ollama 404 + migrate Firestore to Admin SDK

**Decisions Made:**
- Admin SDK is the correct pattern for server-side Firestore. Client SDK stays for `src/lib/firebase/` (browser components).
- When giving Qwen multi-file tasks, it produces inline content — built task_09 (split_multi_file_output.js) to auto-handle that.
- Don't run >2 Qwen tasks concurrently on M1 — Ollama evicts and 404/fetch-fails. Queue one at a time.

**Open Items (carried forward):**
- task_06, task_07 re-queued — should finish in next 10-15 min
- task_08 (PhaseTimeline live Firestore) queued
- task_09 (multi-file output splitter) queued
- task_10 (fix task_05 relative paths) queued
- Still need to: merge Qwen outputs into src/ after review
- Phase B remaining: prepare_training_data.js (task_03 completed, verify + merge)

**Code Review Notes (for next session):**
- `PhaseTimeline.jsx` (task_02 output): absolute positioning without relative parent; dead imports (`useState, useEffect`); border-dashed without border-width. Fix before merging to `src/components/dashboard/`.
- `dreamlog_scheduler.js` (task_05 output): relative paths break on cwd change (task_10 will fix).

**Next Session Should Start With:**
1. Load memory stack (SKIP CONTEXT.md — see feedback_session_token_savings.md)
2. Check `agent_outbox/` for task_06, 07, 08, 09, 10 results
3. Run `node scripts/split_multi_file_output.js <outbox_file>` on task_04/08 outputs
4. Review + merge cleaned files into `src/` and `scripts/`
5. Commit merged work
6. Begin Phase A dashboard wiring: PhaseTimeline live via task_08 hook → main dashboard page

## Session 16 — 2026-04-17
**Date:** 2026-04-17
**Primary Work:**
- Monorepo migration COMPLETE: ARES moved from broken gitlink → git subtree at `rank-higher-media/ares/`
- Phase C audit COMPLETE: all 5 phases confirmed built in agent_connector.js (nothing to rebuild)
- Supervisor upgraded: gemma3:12b → gemma3:27b-it-qat (model was already pulled ✅)
- npm install run in new ares/ location — @google/generative-ai and all deps installed
- Wrote `ares/docs/verified-flow.md` — full execution map with phase-by-phase breakdown
- Revised Phase C spec: 9-task greenfield plan replaced with 3-task verify plan

**Decisions Made:**
- Monorepo layout: flat (ares/ at root, not apps/ares/) — YAGNI, no packages needed yet
- Phase C is verification not construction — loop is already built
- No site/ move yet — deferred, not blocking

**Phase C END-TO-END RUN ✅ CONFIRMED** (task_verify_001 produced valid output via all 5 phases)

**Work completed directly this session (not via ARES):**
- `ares/scripts/seed_missing_collections.js` — ready to run once .env.local set
- `ares/docs/phase-b-research.md` — full launchd + MLX LoRA + Ollama merge plan

**Blocked / Open:**
- `.env.local` needs recreating at `ares/.env.local` (gitignored, lost in migration)
  - Firebase keys: Firebase Console → ashish-ares → Project Settings → Your apps → Config
  - Gemini key: aistudio.google.com/apikey
- **NEW BUG**: Ollama HTTP 404 on 3 Qwen tasks after supervisor upgrade to gemma3:27b-it-qat.
  Verify task worked before the upgrade. Likely causes:
  1. Agent picker routing to a model name Ollama doesn't have
  2. SUPERVISOR_MODEL mismatch in CRITIC calls
  Diagnose: `curl http://localhost:11434/api/tags` to confirm all models, then check connector log for exact model name in 404 response.
- Queued but unprocessed (still in `ares/agent_inbox/archive/` — failed with 404):
  `task_01_audit_hooks.md`, `task_02_dashboard_component.md`, `task_03_prepare_training_data.md`

**Next Session Should Start With:**
1. Load memory stack
2. Recreate `ares/.env.local` (7 Firebase vars + GEMINI_API_KEY)
3. Run Phase C end-to-end: `cd ~/rank-higher-media/ares && npm run ares-start`
4. Drop test task: `cp agent_inbox/task_verify_001.md.ready agent_inbox/task_verify_001.md` (see TERMINAL_GUIDE.md)
5. Watch logs: `npm run ares-log`

---
## Session 15 — 2026-04-17
**Date:** 2026-04-17
**Primary Work:**
- Integrated Google Gemini API as 3rd model provider in ARES (4 commits: `5a6a3a2`, `c68f477`, `35b4b0f`, `8b3d861`)
  - New `scripts/gemini_provider.js` (lazy key check, non-streaming JSON, error handling)
  - `memory_config.js` — `GEMINI_MODEL` constant + auto-route for contextSize > 50K tokens
  - `agent_connector.js` — explicit `**Worker**: gemini` tag + long-context fallback
  - `.env.local` — `GEMINI_API_KEY=` placeholder (user to fill from aistudio.google.com/apikey)
- **Gap audit** — found multiple tasks fell off during Sessions 13-14:
  - Multi-phase loop only 4/5 phases working (RESEARCH phase not fully activated)
  - Active Dreaming (Phase 2): data logged but no scheduler, no LoRA runner, no model reload
  - Memory consolidation, Meta-Harness patterns, Ash Code delegator — documented but not built
  - Dashboard still scaffold only — no phase visualization
- Design spec written: `ares/docs/superpowers/specs/2026-04-17-ares-pipeline-completion-design.md`

**Decisions Made:**
- Used `@google/generative-ai` SDK (not `@google/genai` — confirmed installed)
- Set `gemini-2.5-flash` as default Gemini model (free tier, 1M context)
- **Priority order for next sessions: C → B → A**
  - C: Verify foundation (RESEARCH phase + full 5-phase loop end-to-end)
  - B: Close dreaming loop (scheduler + LoRA fine-tuning + model reload)
  - A: Dashboard visualization (show live 5-phase loop + agent activity)

**Open Items (carried forward):**
- User needs to add `GEMINI_API_KEY` to `ares/.env.local` (get from aistudio.google.com/apikey)
- Firecrawl alternatives research (deferred) — Apify free tier, Cheerio/Puppeteer, Browserless, Playwright
- Visual Companion for dashboard mockups — offered but deferred to Phase A

**Next Session Should Start With:**
1. Load memory stack + read `ares/docs/superpowers/specs/2026-04-17-ares-pipeline-completion-design.md`
2. Begin **Phase C** — verify RESEARCH phase activation and run one full 5-phase task end-to-end
3. Invoke `writing-plans` skill to break Phase C into executable tasks

## Archive Protocol
When Session 5 would be overwritten:
1. Copy current rolling_summary.md to Drive (folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1)
2. Name it: `rolling_summary_archive_YYYY-MM.md`
3. Then overwrite Session 4 slot with new session

> ⚠️ **Archive still needed:** rolling_summary_archive_2026-02.md → save to Drive.
