# ARES Work Coordination — Align Antigravity, Local, Claude
**Last updated**: 2026-04-13 | **Status**: Synced

---

## Actual vs. Planned

### The Checklist (Was Outdated)
```
Phase 1: Workspace & Setup              ✅ DONE (2026-04-01)
Phase 2: Core Data Models               ✅ DONE (2026-04-03)
Phase 3: Dashboard UI Components        ✅ DONE (2026-04-05)
Phase 4: LLM Router Integration         ✅ DONE (2026-04-08)
Phase 5: Memory Management              🟡 PARTIAL (Drive backup OAuth pending)
```

### What's Actually Built (Real Status)
```
✅ Next.js 16 + React 19 + Tailwind 4 + Firebase Web SDK v12
✅ Firestore seeded with: tasks, agent_state, token_usage, memory collections
✅ Dashboard widgets LIVE: AgentStatus, TaskQueue, TokenUsage, MemoryState
✅ Agent system WORKING: agent_inbox/ → agent_connector.js → qwen3/gemma3 → agent_outbox/
✅ Brainstorm system COMPLETE: qwen3 drafts → gemma3 critiques → synthesis
✅ Scripts DEPLOYED: connector, brainstorm, youtube ingest, RSS ingest, context loader, summarizer
✅ Ollama routing FIXED: port 11434, qwen3:30b-a3b + gemma3:12b on M1 Mac
✅ Knowledge base SCAFFOLDED: knowledge/debates/, knowledge/research/

🟡 Drive backup: Active but OAuth pending (credentials.json not delivered)
❓ Share harness function: Designed but not coded
❓ Model abilities KB: Designed but not populated
```

---

## Active Work (As of 2026-04-13)

### Ashish (Local Machine)
**What you should focus on:**
1. Memory consolidation (40% token savings) — use MEMORY_CONSOLIDATION.md
2. Hybrid model setup — gemma3:27b-it-qat upgrade + routing in agent_connector.js
3. Testing standalone ARES operation — confirm npm run ares / npm run connector works alone
4. Google Opal Track B exploration (brainstorm → prototype workflow)

**What NOT to do:**
- ❌ Rewrite Dashboard components (already live)
- ❌ Rebuild Firestore schema (already seeded)
- ❌ Change brainstorm system (working well)

### Antigravity (Cloud IDE, working on this branch?)
**Unclear what was done. Share plan or status update so we don't conflict.**

If Antigravity was building:
- [ ] Google Drive OAuth setup? (blocked)
- [ ] Model Abilities KB? (not started)
- [ ] Harness share function? (designed, not coded)
- [ ] UI improvements to dashboard? (which widgets?)

### Claude (You)
**Stay in this lane:**
- Architecture decisions (Phase 5 expansion, model swaps)
- New feature design (Model KB, harness function)
- Troubleshooting bugs
- Token optimization strategy (DONE — see TOKEN_OPTIMIZATION_PLAN.md)
- Memory/context management

**Defer to Ashish for:**
- Local model upgrades (ollama pull, environment setup)
- Terminal testing (npm run brainstorm --use-local, etc.)
- UI tweaks (Ashish sees the dashboard live)

---

## Coordination Rules

### Before Starting Work
1. **Check SESSION_STATUS.md** — current priorities + active tasks
2. **Check agent_outbox/** — recent brainstorm debates + what was just tried
3. **Ask**: "Is this on the active list? Or a new request?"

### Avoid Duplicates
- **Git log**: Check recent commits before proposing a change
- **agent_inbox/tasks.json**: Don't start work if already queued
- **CONTEXT.md**: Current session state (last update, who's working on what)

### When Stuck
- **Ollama not responding**: Ashish runs `pkill ollama && sleep 2 && ollama serve`
- **Firebase sync issues**: Ashish checks `.env.local` (not committed, secret)
- **Token budget**: See TOKEN_OPTIMIZATION_PLAN.md (priority until Friday)
- **Unclear scope**: Check git log + SESSION_STATUS.md + CONTEXT.md

---

## Current Priority (Through Friday)

**#1 Token Optimization (Ashish)**
- Implement memory consolidation (30 min)
- Upgrade gemma to 27b-it-qat (5 min)
- Test standalone ARES (30 min)
- Total impact: 60% cost reduction, independence from token budget

**#2 Hybrid Routing (Claude)**
- Add task-type → model routing to agent_connector.js (1 hour)
- Test with local brainstorm (30 min)
- Document in CONTEXT.md (30 min)

**#3 Opal Prototype (Ashish)**
- Brainstorm ARES workflows to model in Opal (30 min)
- Identify highest-ROI workflow (SEO audit? Ad copy?)
- Design first prototype (1-2 hours)

---

## Key Files (Don't Change Without Sync)

| File | Owner | Why |
|------|-------|-----|
| agent_connector.js | Claude + Ashish | LLM routing logic — changes affect all tasks |
| Dashboard.js | Ashish | Live widget — Ashish can see, best to test locally |
| brainstorm.js | Claude | Complex task orchestration — verify changes don't break debates |
| .env.local | Ashish only | Firebase credentials — secret, never committed |
| CONTEXT.md | Both | Current session state — update before/after work |
| SESSION_STATUS.md | Both | Master status — update daily |

---

## Antipattern: Avoid This

❌ **Ashish modifies brainstorm.js without testing local**: Could break all debates
❌ **Claude changes Dashboard without Ashish seeing**: UI issues won't be caught
❌ **Both work on agent_connector.js simultaneously**: Merge conflicts
❌ **Don't check SESSION_STATUS.md before starting work**: Duplicate effort

✅ **Right way**: Check status → coordinate → implement → test → merge → update status

---

## This Week's Sync Points

- **Today (Wed)**: Memory consolidation + hybrid routing planning
- **Tomorrow (Thu)**: Test standalone ARES + routing in agent_connector.js
- **Friday**: Token audit + Opal prototype design
- **Next Mon**: Full status update + next week priorities

---

## If Antigravity Was Working on X

**Post here** (update this file) what was being built:
- [ ] Google Drive OAuth
- [ ] Model Abilities KB
- [ ] Harness share function
- [ ] Dashboard UI improvements
- [ ] Other: ___________

**Then we coordinate** to avoid duplication.

---

## Questions?

Ask in this file or in SESSION_STATUS.md under "Open Questions".
