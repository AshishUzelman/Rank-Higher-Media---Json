# Meta-Harness + Terminal-Bench 2.0 — Knowledge Base Entry
**Date ingested:** 2026-04-09
**Source:** Stanford IRIS Lab — arXiv:2603.28052
**Repo:** https://github.com/stanford-iris-lab/meta-harness-tbench2-artifact
**Paper:** https://arxiv.org/abs/2603.28052
**Relevance:** ARES (high), Ash Code (high), local LLM eval (medium-high)

---

## What TBench2 Is

**Terminal-Bench 2.0** — the hardest available real-world agentic benchmark as of Q1 2026.

- **89 tasks**, hand-curated, containerized Linux terminal environment
- **Pass@1, 5 trials** — binary scoring (all pytests pass = 1, else = 0)
- **Categories:** SE (largest), ML training, sysadmin, security, data science, utility
- **Difficulty:** Easy (4), Medium (55), Hard (30)
- **Quality bar:** 3+ hours human audit per task, adversarial exploit agent tested each task for shortcuts

### Leaderboard (April 2026)
| Rank | Agent | Model | Score |
|------|-------|-------|-------|
| 1 | Pilot | Claude Opus 4.6 | 82.9% |
| 3 | ForgeCode | Claude Opus 4.6 | 81.8% |
| **8** | **Meta-Harness** | **Claude Opus 4.6** | **76.4%** |
| — | Meta-Harness | Claude Haiku 4.5 | 37.6% (most efficient small-model agent) |

**Reference point for local LLMs:** Haiku 4.5 = 37.6%. qwen3:30b-a3b likely 15-30% range. Calibrate via Harbor.

---

## What Meta-Harness Is

**Core thesis:** A 6× performance gap exists between good and bad harnesses on the same model. Meta-Harness automates harness optimization using an LLM proposer (Claude Code / Opus 4.6) that reads the full filesystem of all prior harness candidates — source code + execution traces — and proposes improved implementations.

### What a "Harness" Is
The code layer wrapping an LLM agent:
- What context to inject and when
- How memory/history is stored and pruned
- How tools are defined and called
- How the agent loop is orchestrated
- How prompts are structured

### The Algorithm
```
For each iteration:
  Proposer reads ALL prior: source code + execution traces + scores
  Proposer proposes k new harness implementations
  Each is evaluated → stored in filesystem
Return Pareto frontier (accuracy vs. token cost)
```

**Proposer context per iteration: 10 Mtok** (vs OPRO 0.002M, TextGrad 0.015M, AlphaEvolve 0.022M)
**Files read per iteration (median): 82** — 41% prior code, 40% execution traces, 6% scores, 13% other

### Critical Finding: Raw Traces > Compressed Summaries
| Access Level | Best Accuracy |
|---|---|
| Scores only | 41.3% |
| Scores + LLM summaries | 38.7% (**worse**) |
| Scores + raw execution traces | **56.7%** |

LLM-compressed summaries actively remove diagnostic signal. Always store and expose raw traces.

### Proposer Behavior (Causal Reasoning, Not Random Search)
Documented over 10 iterations on TBench2:
- Iterations 1-2: Bundled changes → both regress
- Iteration 3: Proposer identifies confound, isolates structural fixes to test hypothesis
- Iterations 4-6: Probes specific bugs with explicit hypotheses
- **Iteration 7: Pivots to purely additive approach** — environment bootstrapping without touching existing machinery → best candidate
- Iterations 8-10: Composes additive improvements, transfers patterns

**Lesson:** Prefer additive improvements over rewrites. Test one variable at a time. The best discovered improvement was purely additive.

---

## The 4 Concrete Engineering Patterns (Directly Portable)

### 1. Environment Bootstrapping ⭐ HIGHEST LEVERAGE

Before the agent loop, inject a snapshot of the working environment into the initial system prompt:

```bash
# Compound command (15s timeout, graceful fallback)
pwd && ls -la && \
python3 --version 2>/dev/null && node --version 2>/dev/null && \
pip --version 2>/dev/null && npm --version 2>/dev/null && \
free -h 2>/dev/null || vm_stat 2>/dev/null
```

**Value:** Saves 2-5 early exploration turns. Agent knows its environment before making any decisions.

**ARES application:** Add to `load_context.js` as Section 6 — execute on the ARES machine context (models available, Firestore connection, active tasks, memory state) before every agent invocation. agent_connector.js currently loads soul files; extend to also snapshot system state.

### 2. Structured Tool Schema (Reasoning Before Action)

Every tool call requires `analysis` and `plan` fields before the commands array:

```python
execute_commands(
  analysis="The error is a missing dependency in the build step",
  plan="Install the dependency then retry the build",
  commands=["pip install X", "make build"]
)
```

**Value:** Forces structured reasoning before execution. Reduces hallucination/thrashing. Makes agent reasoning auditable.

**ARES application:** Add `analysis` and `plan` fields to the WORKER_SYSTEM_PROMPT tool instructions. Instruct qwen3: "Before listing commands, always state analysis and plan explicitly."

### 3. Marker-Based Async Command Polling

Instead of `time.sleep(N)`, append a unique marker after each command:

```bash
your_command && echo "__CMDEND__{unique_id}__"
```

Asyncio loop polls tmux/terminal output for marker appearance. Early exit when marker detected. Tracks `_total_time_saved`.

**Value:** Eliminates fixed sleep waste. Fast commands (ls, echo) exit immediately. Slow commands (make, pip install) wait as long as needed.

**ARES application:** If/when ARES agents run shell commands via bash, use this pattern instead of hardcoded sleeps. Directly portable to any terminal-executing agent.

### 4. Draft Verification (Inference Cost Reduction)

Two-stage pattern for classification/decision tasks:
1. Cheap draft call → initial prediction
2. Retrieve confirmers (agree) + challengers (disagree) conditioned on draft
3. Verification call decides: keep or revise
4. Only spend verification tokens when draft is uncertain

**Value:** Reduces total inference cost while maintaining accuracy.

**ARES application:** MoE router pattern — qwen3 fast draft → gemma3 verification only when confidence < threshold. Already partially implemented in Actor-Critic loop; formalize as the default pattern.

---

## Discovered Harness Patterns

### Text Classification — Two Strategies Discovered Automatically

**Label-Primed Query (highest accuracy):**
1. List all valid labels in prompt upfront
2. Retrieve 1 example per class (coverage)
3. Add query-anchored contrastive pairs (similar examples, different labels)
4. TF-IDF retrieval with query-anchored pairing

**Draft Verification (lowest token cost):**
1. Retrieve 5 similar → draft prediction
2. Retrieve confirmers + challengers conditioned on draft
3. Verification call decides
4. Fallback to few-shot if insufficient history

### Math Retrieval — 4-Route BM25 (Entirely Discovered)
Problem domain detected by keyword/regex → routed to domain-specific retrieval strategy:
- Combinatorics: Fetch 20 → deduplicate → rerank by lexical + difficulty → top 3
- Geometry: 1 fixed reference + 2 BM25 neighbors
- Number Theory: Fetch 12 → rerank with technique-explicit bonus
- Algebra/Other: Fetch 10 → adaptive reranking

Key insight: **domain-specific routing was discovered automatically**, not designed. The pattern of routing to specialized retrieval strategies based on input type is applicable to ARES task routing.

---

## Use Cases for ARES + Ash Code

### Immediate (can implement now)

1. **Environment bootstrapping in agent_connector.js**
   - Add system snapshot (models, Firestore state, active tasks, free RAM) to Context Packet
   - Inject before first LLM call, not during
   - Expected: eliminate first 2-3 "orientation" turns in every agent run

2. **Structured reasoning fields in WORKER_SYSTEM_PROMPT**
   - Add `analysis:` and `plan:` requirement to tool use instructions
   - qwen3 must state reasoning before listing commands
   - Makes agent reasoning auditable in Firestore

3. **Raw execution trace storage in Firestore**
   - Currently storing resultExcerpt (500 chars) — too lossy for diagnosis
   - Add `executionTrace` field with full output (or S3/Drive link for large traces)
   - This unlocks Meta-Harness-style post-mortem: proposer reads traces → diagnoses failure patterns

4. **Draft Verification formalized in MoE router**
   - qwen3 draft → route to gemma3 verification only when confidence < threshold
   - Add confidence score to agent output contract (aligns with brainstorm system design)

### Medium-term

5. **TBench2 evaluation for local LLMs**
   - `pip install harbor`
   - Run a subset of TBench2 tasks against qwen3:30b-a3b via Ollama
   - Get calibrated accuracy numbers → know where local models break
   - Use difficulty tiers to profile: Easy = baseline, Medium = working well, Hard = ceiling

6. **Meta-Harness-style harness search for ARES**
   - Use Gemini (free tier, large context) as the proposer
   - Store all agent_connector.js versions + full Firestore execution traces
   - Let Gemini propose modifications to the harness code, not the task prompts
   - This is Phase 3 of the LLM Intelligence Roadmap (MoE router evolution)

7. **Domain routing for ARES tasks**
   - Like the 4-route math harness: detect task domain → apply domain-specific retrieval + routing
   - ares tasks → load SOUL_ARES + ares debates
   - ad-creator tasks → load Ad Creator context + ad-creator debates
   - Already designed in brainstorm system; extend to all task types

### Ash Code Specific

8. **Ash Code as meta-harness proposer**
   - The Meta-Harness paper uses Claude Code (Opus 4.6) as the proposer
   - Ash Code is the local equivalent
   - Pipeline: store all session corrections + traces → Ash Code reads all history → proposes improvements to its own SOUL files and skill definitions
   - This IS Active Dreaming Phase 2, just with a clearer algorithm

9. **Marker-based polling for headless task execution**
   - When Ash Code runs headless tasks via launchd, use `__TASKEND__` markers
   - Ash Code polls for completion rather than sleeping
   - Enables reliable scheduled task execution without fixed timeouts

---

## Key Numbers to Remember

- 6× performance gap between good and bad harnesses (same model)
- 82 files read per proposer iteration (median)
- 10 Mtok context per iteration (10,000× more than OPRO)
- 2-5 turns saved by environment bootstrapping
- Raw traces outperform LLM summaries by 18+ points
- Claude Haiku 4.5 = 37.6% on TBench2 (local LLM reference point)
- Purely additive improvements won over rewrites every time

---

## Links
- Paper: https://arxiv.org/abs/2603.28052
- Repo: https://github.com/stanford-iris-lab/meta-harness-tbench2-artifact
- TBench2: https://tbench.ai | Leaderboard: https://www.tbench.ai/leaderboard/terminal-bench/2.0
- Harbor framework: https://github.com/laude-institute/terminal-bench
- TBench1 paper: https://arxiv.org/abs/2601.11868
