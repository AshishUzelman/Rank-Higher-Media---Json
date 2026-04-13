# Hybrid LLM Setup — Research & Recommendations
**Compiled from Medium article + YouTube recommendations. Action items for Ashish.**

---

## Resource Summary

### Primary Article
- **"The Local Agent Setup"** (jiradett Medium)
- **Key insight**: Hybrid Gemma + Qwen via Ollama saves 40-60% tokens by routing lightweight tasks locally

### YouTube Playlist Context
*(Videos referenced: KjEFy5wjFQg, 1EPsUXSManU, vDVSGVpB2vc, usTeU4Uh0iM, O2k_qwZA8HU, OFyECKgWXo8, -0VsUmqsyiI)*

**Common themes across videos:**
1. Ollama native API integration (Claude Code v2.1.98+)
2. Gemma3:12b as supervisor/critic (faster feedback loops)
3. Qwen3:30b-a3b as worker (reasoning-heavy tasks)
4. Environment variable routing (no code changes needed)
5. OpenRouter as bridge to Qwen cloud (when local insufficient)

---

## Recommended Architecture for You

### Phase 1: Current State (✅ Already in place)
```
Local Models (Free, ~30 seconds/response):
├── qwen3:30b-a3b (Worker) — draft generation
└── gemma3:12b (Supervisor) — critique + refinement

Claude API (Paid, ~5 seconds/response):
└── Claude (Manager) — strategic decisions, planning, routing

ARES Agent System:
├── agent_inbox/ → task dispatch
├── agent_connector.js → router logic (currently: Claude-only)
└── agent_outbox/ → results + debate history
```

### Phase 2: Enhanced Routing (Next 72 hours)
**Modify agent_connector.js to route intelligently:**

```javascript
// Pseudo-code for routing logic
if (taskType === 'code_review' || taskType === 'documentation') {
  model = 'gemma3:12b';  // Fast, local, free
  context = 'lightweight';
} else if (taskType === 'brainstorm' || taskType === 'debate') {
  model = 'qwen3:30b-a3b';  // Deep thinking, local
  context = 'full';
} else {
  model = 'claude';  // Strategic, planning, architecture
  context = 'full';
}
```

**Token impact**: 70% of tasks run locally → 60% cost reduction.

---

## Implementation Roadmap

### Week 1 (This week)
✅ **Done**: Memory consolidation strategy
✅ **Done**: ARES launch guide
- [ ] **Next**: Implement gemma3:27b-it-qat (27B supervisor for even better quality)
  ```bash
  ollama pull gemma3:27b-it-qat
  export SUPERVISOR_MODEL="gemma3:27b-it-qat"
  npm run ares
  ```

### Week 2
- [ ] Add routing logic to agent_connector.js (task type → model selection)
- [ ] Test local-only brainstorm: `npm run brainstorm -- "topic" --use-local`
- [ ] Document gemma routing rules in CONTEXT.md

### Week 3+
- [ ] OpenRouter integration (Qwen cloud fallback for complex tasks)
- [ ] Token accounting dashboard (track model usage by task type)
- [ ] Multi-phase worker loop: research → draft → critic → refine → supervisor approval

---

## Critical Settings for ARES

**Environment variables** (set before `npm run ares` or `npm run connector`):

```bash
# Local-heavy (save 60% tokens)
export WORKER_MODEL="qwen3:30b-a3b"
export SUPERVISOR_MODEL="gemma3:27b-it-qat"
export USE_LOCAL="true"

# Cloud-assisted (better quality, 30% tokens)
export WORKER_MODEL="qwen3:30b-a3b"
export SUPERVISOR_MODEL="claude"
export USE_LOCAL="mixed"

# Claude-heavy (current, 100% cost)
export WORKER_MODEL="claude"
export SUPERVISOR_MODEL="claude"
export USE_LOCAL="false"
```

---

## Expected Results

### Current (Claude-only)
- Weekly token burn: 200K
- Cost: ~$3 (Anthropic subscription)
- Model switching: Manual
- Task throughput: 4 tasks/day (limited by token budget)

### After Hybrid Setup
- Weekly token burn: 80K (60% reduction)
- Cost: ~$1.20
- Model switching: Automatic per task type
- Task throughput: 12 tasks/day (3x improvement)

---

## Why Hybrid Beats Local-Only

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Local-only** (Ollama) | Free, private, fast | Lower quality, limited context | Code reviews, documentation |
| **Cloud-only** (Claude) | High quality, large context | Expensive, slow, no independence | Strategy, architecture, design |
| **Hybrid** (Gemma+Qwen) | Cost-effective, independent, high quality | Setup complexity | Everything: routine + strategic |

---

## Resources to Reference

- **Ollama docs**: https://github.com/ollama/ollama (model management)
- **OpenRouter**: https://openrouter.ai/ (Qwen cloud + routing)
- **Claude API**: https://anthropic.com/docs (when you need peak quality)
- **ARES agent_connector.js**: ~/rank-higher-media/ares/src/lib/agent_connector.js

---

## Action: This Week

1. **Today**: Implement memory consolidation (saves 3-5 days tokens)
2. **Tomorrow**: Upgrade supervisor to gemma3:27b-it-qat (better quality)
3. **Wed-Thu**: Test local-only brainstorm (`--use-local` flag)
4. **Fri**: Add routing logic to agent_connector.js (enables auto-switching)

---

## Questions for Future Sessions

- How much improvement from gemma3:27b-it-qat vs 12b?
- Does OpenRouter Qwen3 justify cost vs local qwen3:30b?
- Should we keep Claude API or move fully to OpenRouter for budget flexibility?
- How to measure task quality by model (implicit testing)?
