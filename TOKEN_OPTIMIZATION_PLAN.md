# Token Optimization Plan — Next 72 Hours
**Target: Reduce cloud token burn by 60%. Shift to qwen3/gemma3 offloading + CLI ops.**

---

## Current Burn Rate Crisis
- **Weeks remaining**: 2-3 days at current usage
- **Root cause**: Heavy CLAUDE.md loading, MCP tool overhead, Sonnet for routine tasks
- **Solution**: Hybrid local/cloud routing + memory consolidation

---

## Phase 1: Immediate Savings (Today)

### 1.1 CLI > MCP (Estimated 20% savings)
**Replace MCP tools with CLI where possible:**

| Task | Current (MCP) | Optimized (CLI) | Token Savings |
|------|---------------|-----------------|--------------|
| Git operations | git MCP | `git` bash | 30-40% |
| File reads | google_drive MCP | `cat` / `grep` | 25% |
| Task scheduling | CronCreate tool | `CONTEXT.md` + cron | 40% |
| SSH/deploy | cloud MCP | `ssh` + `scp` | 35% |

**Action**: Disconnect unused MCPs in settings.json
```json
{
  "connected_mcps": {
    "google-drive": false,
    "google-calendar": false
  }
}
```

### 1.2 Memory File Consolidation (Estimated 15% savings)

**Current bloat**: CLAUDE.md is 800+ lines, MEMORY.md has 200+ lines, plus 8 support files.
**Every session load**: Full context of all projects + all memories.

**Fix**: Master router document + lazy loading
```
CLAUDE.md (LEAN)
  ├→ [link to ARES context]
  ├→ [link to Ad Creator context]
  └→ [link to Project Registry]

PROJECT_CONTEXT.md (per-project, loaded only when needed)
  ├─ ares/CONTEXT_ARES.md (ARES-only, stays in ares/ folder)
  └─ ad-creator/CONTEXT_AD.md (Ad Creator-only, stays in ad-creator/ folder)
```

**Action**: Consolidate by Friday
1. Move 6/8 memory support files to Drive (`15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`)
2. Keep only: CLAUDE.md, PROJECT_STATUS.md, MEMORY.md (as index)
3. Reduce CLAUDE.md to ~300 lines (project registry only, remove session notes)

---

## Phase 2: Routing Logic (Today → Tomorrow)

### 2.1 Gemma for Routine Tasks (Est. 40% savings on routine work)
**Route to local Gemma3:12b for:**
- Code reviews (non-blocking)
- Documentation generation
- Simple bug reproduction
- Test case generation
- Memory/context summarization

**Keep Claude for:**
- Architecture decisions
- Complex bug diagnosis
- New feature design
- Token/context planning
- Anything marked as "strategic" or "blocking"

**Config** (`~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/CONTEXT.md`):
```json
{
  "routing": {
    "gemma_tasks": ["code_review", "docs", "test_gen", "summary"],
    "claude_tasks": ["architecture", "design", "diagnosis", "strategy"],
    "budget": "80% local work, 20% Claude"
  }
}
```

### 2.2 Haiku for Lite Tasks (Est. 30% savings vs Sonnet)
When Claude is needed, use Haiku for:
- Simple edits
- Status checks
- Brief explanations
- Troubleshooting guidance

Use Sonnet/Opus only for:
- Multi-step implementations
- Code architecture reviews
- Complex system design

---

## Phase 3: ARES Offloading (Ongoing)

### 3.1 Brainstorm to Local Models
Current: brainstorm skill uses Claude
Better: Use qwen3 (worker) + gemma3 (supervisor) via agent_connector.js

```bash
# Use local models for debate (free)
npm run brainstorm -- "topic" --project ares --use-local

# Use Claude only for final synthesis (1 call, ~5K tokens)
npm run brainstorm -- "topic" --project ares --synthesize-only
```

### 3.2 Async Work Queue
**Batch Claude tasks for off-peak hours:**
- Write task to `~/queue/claude_tasks.json`
- Check back in 12 hours (Claude has 1-3 day planning buffer)
- Reduces real-time pressure

---

## Phase 4: Memory Archive Strategy (By Friday)

### 4.1 Drive Backup (Permanent Record)
Move to Google Drive folder `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`:
- `rolling_summary_archive_2026-04.md`
- `SOUL_BASE.md` (keep local but update monthly)
- `SOUL_ARES.md` (keep in ares/SOUL_ARES.md)
- `SOUL.md` (keep local)
- `permanent.json` (keep local + backup)

### 4.2 Lean Local Context
**Keep in git repo:**
- CLAUDE.md (router only, ~300 lines)
- PROJECT_STATUS.md (tiered milestones only)
- MEMORY.md (index with links only)

**Move to ares/ subdirectory:**
- CONTEXT_ARES.md
- SOUL_ARES.md
- agent logs + task history

---

## Implementation Checklist

- [ ] **Today**: Disconnect MCP tools in settings.json (15 min)
- [ ] **Today**: Run ARES_LAUNCH_GUIDE.md standalone test (30 min)
- [ ] **Wed**: Archive 6 memory files to Drive (45 min)
- [ ] **Wed**: Reduce CLAUDE.md to router format (~300 lines) (1 hour)
- [ ] **Thu**: Test local-only brainstorm (npm run brainstorm --use-local) (30 min)
- [ ] **Thu**: Document Gemma routing rules in CONTEXT.md (30 min)
- [ ] **Fri**: Full token audit: compare burn before/after (30 min)

---

## Expected Results (After 3 days)

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Weekly token burn | 200K | 80K | 60% |
| Context load time | 45s | 15s | 67% |
| Routine task cost | 5K/task | 500/task (local) | 90% |
| Session setup | Full reload | Router lookup | 50% |
| CLAUDE.md size | 800 lines | 300 lines | 62% |

**Net effect**: Your token budget extends from 2-3 days to **8-10 days**.

---

## When to Escalate to Claude
- New routing rules needed
- Local model swaps (qwen→different)
- Architecture changes
- Memory structure overhaul
- Token planning/forecasting

---

## Emergency: Pause Until Friday

If you hit zero tokens before implementing above:
1. Push current work to git
2. Go local-only: `npm run ares --use-local` (free)
3. Document what you're working on in CONTEXT.md
4. Resume Friday after memory consolidation
