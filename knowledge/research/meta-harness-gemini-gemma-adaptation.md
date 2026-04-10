# Meta-Harness → Gemini + gemma3 Adaptation Guide
**Date:** 2026-04-09
**Source:** Stanford IRIS Lab arXiv:2603.28052 + harbor CLI docs
**Repo:** https://github.com/stanford-iris-lab/meta-harness-tbench2-artifact

> **To get the source code:** `git clone https://github.com/stanford-iris-lab/meta-harness-tbench2-artifact ~/tmp/meta-harness`

---

## What the Meta-Harness Does

The Meta-Harness has two distinct roles:

| Role | Original | ARES Adaptation |
|------|----------|-----------------|
| **Proposer** | Claude Code / Opus 4.6 — reads all prior harness versions + execution traces, proposes improved harness code | Gemini 1.5 Flash (free tier) — large context, free, reads ARES agent_connector.js history |
| **Executor** | Claude Haiku 4.5 — runs the actual benchmark tasks inside the harness | qwen3:30b-a3b or gemma3:27b-it-qat via Ollama — zero cost per run |
| **Benchmark** | TBench2 (89 terminal tasks, containerized Linux) | ARES own task queue or TBench2 subset |

---

## Installation

```bash
git clone https://github.com/stanford-iris-lab/meta-harness-tbench2-artifact
cd meta-harness-tbench2-artifact
pip install harbor
```

---

## Original Run Command (Claude, paid)

```bash
export ANTHROPIC_API_KEY=<your-key>

harbor run \
  --agent-import-path agent:AgentHarness \
  -d terminal-bench@2.0 \
  -m anthropic/claude-opus-4-6 \
  -e runloop \
  -n 20 \
  --n-attempts 5
```

---

## Adapted Run Command (Gemini proposer + Ollama executor)

### Option A: Gemini as proposer, Ollama as executor

```bash
export GOOGLE_API_KEY=<your-gemini-key>
export OLLAMA_BASE_URL=http://localhost:11434

harbor run \
  --agent-import-path agent:AgentHarness \
  -d terminal-bench@2.0 \
  -m google/gemini-1.5-flash \
  --executor-model ollama/gemma3:27b-it-qat \
  -e runloop \
  -n 20 \
  --n-attempts 5
```

### Option B: Gemini Flash as both proposer and executor (pure free)

```bash
export GOOGLE_API_KEY=<your-gemini-key>

harbor run \
  --agent-import-path agent:AgentHarness \
  -d terminal-bench@2.0 \
  -m google/gemini-1.5-flash \
  -e runloop \
  -n 20 \
  --n-attempts 5
```

### Option C: Gemma 4 31B as proposer (free via Google AI Studio)

```bash
export GOOGLE_API_KEY=<your-gemini-key>

harbor run \
  --agent-import-path agent:AgentHarness \
  -d terminal-bench@2.0 \
  -m google/gemma-4-31b-it \
  -e runloop \
  -n 5 \
  --n-attempts 3
```

---

## How the Proposer/Executor Split Maps to ARES

```
Meta-Harness Architecture:
  Proposer (large ctx LLM)
    → reads: all prior harness_v*.py + execution_traces/*.jsonl + scores.csv
    → proposes: k new harness implementations
    → each is evaluated on benchmark
    → repeat 10 iterations
    → return Pareto frontier (accuracy vs cost)

ARES Equivalent:
  Proposer = Gemini 1.5 Flash (free, 1M ctx)
    → reads: all prior agent_connector.js versions (git log)
             + all Firestore execution traces
             + task success/failure rates
    → proposes: modified agent_connector.js
    → evaluated: run 20 tasks through new connector, score outcomes
    → repeat: 5-10 iterations
    → result: improved agent_connector.js on the Pareto frontier
```

---

## Key Environment Variables

| Variable | Original | Adapted |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Required | Not needed for Gemini/Ollama |
| `GOOGLE_API_KEY` | Not used | Required for Gemini proposer |
| `OLLAMA_BASE_URL` | Not used | `http://localhost:11434` for local executor |
| `HARBOR_PROPOSER_MODEL` | Claude Opus 4.6 | `google/gemini-1.5-flash` or `google/gemma-4-31b-it` |
| `HARBOR_EXECUTOR_MODEL` | Claude Haiku 4.5 | `ollama/gemma3:27b-it-qat` |

---

## harbor Model String Format

Harbor uses LiteLLM-style model strings:

| Provider | Format | Example |
|----------|--------|---------|
| Anthropic | `anthropic/<model>` | `anthropic/claude-opus-4-6` |
| Google | `google/<model>` | `google/gemini-1.5-flash` |
| Ollama | `ollama/<model>` | `ollama/gemma3:27b-it-qat` |
| Ollama (custom base) | `ollama/<model>` + `OLLAMA_API_BASE` env | for non-localhost |

---

## 4 Patterns to Apply to ARES (from the paper — no source code needed)

### Pattern 1: Environment Bootstrapping (implement in load_context.js)
Before any agent call, inject a system snapshot:
```bash
# Add to load_context.js before first LLM call:
pwd && ls -la && \
ollama list 2>/dev/null && \
node -e "require('./scripts/agent_connector.js').getFirestoreStatus()" 2>/dev/null
```
**Expected gain:** Saves 2-5 "orientation" turns per session.

### Pattern 2: Structured Tool Schema (implement in WORKER_SYSTEM_PROMPT)
Add to `WORKER_SYSTEM_PROMPT` in memory_config.js:
```
Before listing any commands, always state:
analysis: <what the error/situation is>
plan: <what you will do and why>
commands: [...]
```

### Pattern 3: Marker-Based Polling (implement when adding shell execution)
Instead of `setTimeout(N)` in any async loop:
```javascript
// Append to every shell command:
const marker = `__CMDEND_${Date.now()}__`
const cmd = `${yourCommand} && echo "${marker}"`
// Poll output for marker instead of sleeping
```

### Pattern 4: Raw Trace Storage (implement in Firestore writes)
In agent_connector.js, change `resultExcerpt` (500 chars) to full trace:
```javascript
// Current (lossy):
resultExcerpt: result.slice(0, 500)

// Better (full trace — enables Meta-Harness diagnosis):
executionTrace: result,  // full output
resultExcerpt: result.slice(0, 500),  // keep for quick reads
```

---

## TBench2 Quick Calibration Run

To get a baseline score for local models (compare vs Haiku 4.5 = 37.6%):

```bash
cd ~/tmp/meta-harness-tbench2-artifact
pip install harbor

# Test just Easy tasks (4 total) first:
OLLAMA_BASE_URL=http://localhost:11434 harbor run \
  --agent-import-path agent:AgentHarness \
  -d terminal-bench@2.0 \
  -m ollama/qwen3:30b-a3b \
  -e runloop \
  --difficulty easy \
  -n 4 \
  --n-attempts 3
```

Expected: Easy tasks should pass. If they do, move to Medium.

---

## Reference Points

| Model | TBench2 Score | Notes |
|-------|---------------|-------|
| Claude Opus 4.6 (Pilot agent) | 82.9% | Best in class |
| Claude Opus 4.6 (Meta-Harness) | 76.4% | Harness-optimized |
| Claude Haiku 4.5 (Meta-Harness) | 37.6% | Reference for small models |
| qwen3:30b-a3b (estimated) | 20-35% | MoE, fast, local |
| gemma3:27b-it-qat (estimated) | 15-30% | QAT, fits M1 32GB |

---

## Next Steps

1. **Get the source:** `git clone https://github.com/stanford-iris-lab/meta-harness-tbench2-artifact`
2. **Install:** `pip install harbor`
3. **Run Easy calibration** against qwen3:30b-a3b (see above)
4. **Store traces in Firestore** (Pattern 4) — enables future Meta-Harness-style optimization
5. **Wire Gemini as ARES harness proposer** — reads all agent_connector.js versions + traces → proposes improvements (Phase 3 of LLM Intelligence Roadmap)
