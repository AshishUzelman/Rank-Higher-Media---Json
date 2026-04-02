# Personal LLM System — Design Spec
> Date: 2026-04-02
> Status: Approved
> Author: Ashish Uzelman + Claude
> Approach: C (Vertical Slice) — 4 phases

---

## Overview

A personal hybrid AI system running on Ashish's M1 Mac (32GB unified memory) with external SSD storage. Combines local LLM inference (Ollama + TurboQuant) with cloud APIs (Claude + Gemini) via an MoE-style router, and a self-improving Active Dreaming loop that fine-tunes models on Ashish's domain expertise.

**This spec covers Phase 1 (Local Inference).** Phases 2–4 are outlined for context but get their own specs when ready.

---

## System Architecture (All Phases)

```
┌─────────────────────────────────────────────────────────┐
│                    ASH (Terminal Binary)                  │
│  Dynamic system prompt (load_context.js)                │
│  11+ skills + scraping agent + research agent           │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │          MoE ROUTER (agent_connector)    │            │
│  │  Routes by task type + model capability  │            │
│  │                                          │            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │            │
│  │  │ LOCAL    │ │ CLOUD    │ │ CLOUD    │ │            │
│  │  │ Ollama   │ │ Claude   │ │ Gemini   │ │            │
│  │  │ +TurboQ  │ │ API      │ │ API      │ │            │
│  │  └──────────┘ └──────────┘ └──────────┘ │            │
│  └─────────────────────────────────────────┘            │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │          MODEL POOL (SSD)                │            │
│  │  qwen2.5-coder:14b  — primary learner   │            │
│  │  qwen2.5-coder:32b  — heavy inference   │            │
│  │  + LoRA adapters (llm-ops, seo, style)  │            │
│  └─────────────────────────────────────────┘            │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │          DREAMING ENGINE (MLX)           │            │
│  │  Interaction Logger → Quality Filter     │            │
│  │  → LoRA Fine-tune → Model Update        │            │
│  │  Nightly autonomous cycle                │            │
│  └─────────────────────────────────────────┘            │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │          ARES WORKERS                    │            │
│  │  Scraping Agent — site data harvesting   │            │
│  │  Research Agent — variant SERP queries   │            │
│  │  Training Agent — edits → training data  │            │
│  └─────────────────────────────────────────┘            │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │          FIRESTORE (persistence)         │            │
│  │  interactions/ — logged I/O pairs        │            │
│  │  training_queue/ — approved examples     │            │
│  │  model_versions/ — LoRA checkpoint log   │            │
│  │  dream_logs/ — what dreaming produced    │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Phase Map

| Phase | Name | What Ships | Depends On | Status |
|---|---|---|---|---|
| **1** | Local Inference | Ollama + TurboQuant + models on M1, SSD storage, ash-proxy | SSD + Homebrew | **This spec** |
| **2** | Active Dreaming | Interaction logger, quality filter, LoRA via MLX, nightly cycle, first LoRA: llm-ops-expert | Phase 1 | Future spec |
| **3** | MoE Router | Smart routing in agent_connector.js: local + Claude + Gemini, adapter swap | Phase 1 | Future spec |
| **4** | Data Agents | Scraping Agent + Research Agent as ARES Workers | Phase 1 + ARES | Future spec |

Phases 2 + 3 can run in parallel. Phase 4 can start anytime after Phase 1.

---

## Phase 1 — Local Inference

### What Ships

Ollama running on M1 32GB with TurboQuant KV cache compression, models stored on external SSD, ash-proxy verified as the Anthropic↔Ollama bridge, end-to-end inference confirmed via terminal.

---

### Section 1 — Ollama Installation

**Install via Homebrew:**
```bash
brew install ollama
```

**Verify:**
```bash
ollama --version
ollama serve    # starts daemon on http://localhost:11434
```

Ollama runs as a background service on macOS. It auto-starts on boot via `brew services start ollama` (optional — can also run on-demand).

**API endpoint:** `http://localhost:11434`
- OpenAI-compatible: `http://localhost:11434/v1`
- Native: `http://localhost:11434/api/chat`

---

### Section 2 — SSD Model Storage

By default Ollama stores models at `~/.ollama/models/`. Redirect to external SSD:

**Environment variable (add to `~/.zshrc`):**
```bash
export OLLAMA_MODELS=/Volumes/<SSD-NAME>/ollama-models
```

**SSD directory structure:**
```
/Volumes/<SSD-NAME>/
├── ollama-models/           ← Ollama model blobs
├── lora-adapters/           ← LoRA fine-tune outputs (Phase 2)
│   ├── llm-ops-expert/
│   ├── seo-expert/
│   └── ash-style/
├── training-data/           ← Curated training sets (Phase 2)
└── model-backups/           ← Versioned snapshots before re-training
```

**Graceful fallback:** When SSD is not mounted, Ollama fails to load models but doesn't crash. The ash-proxy returns a clear error to the caller. ARES falls back to cloud APIs automatically (Phase 3 behavior, but designed in now).

**Config file:** `~/.ash/llm-config.json` (new file, created during Phase 1):
```json
{
  "ssd_mount": "/Volumes/<SSD-NAME>",
  "ollama_models": "/Volumes/<SSD-NAME>/ollama-models",
  "lora_adapters": "/Volumes/<SSD-NAME>/lora-adapters",
  "training_data": "/Volumes/<SSD-NAME>/training-data",
  "default_model": "qwen2.5-coder:14b",
  "fallback_model": "qwen2.5-coder:32b"
}
```

---

### Section 3 — Model Downloads

**Primary model (the learner):**
```bash
ollama pull qwen2.5-coder:14b
```
- Size on disk: ~9GB
- Inference RAM: ~9GB (Q4 quantization)
- LoRA trainable: yes, comfortably on M1 32GB
- Role: default for all local tasks, base for all LoRA adapters

**Secondary model (heavy inference):**
```bash
ollama pull qwen2.5-coder:32b
```
- Size on disk: ~20GB
- Inference RAM: ~20GB (Q4)
- LoRA trainable: no (too tight on M1 32GB)
- Role: swap in for complex inference-only tasks, no training

**Both stored on SSD.** Ollama manages model files internally — the `OLLAMA_MODELS` env var handles redirection.

**GGUF for turboquant_plus:** Ollama stores models in its own blob format, not as plain `.gguf` files. For turboquant_plus (which needs a `.gguf` path), download the GGUF separately:
```bash
# Download GGUF directly from HuggingFace for turboquant_plus
huggingface-cli download Qwen/Qwen2.5-Coder-14B-Instruct-GGUF \
  --local-dir /Volumes/<SSD-NAME>/gguf-models/
```
This gives turboquant_plus a direct `.gguf` path while Ollama manages its own copy. ~9GB duplication on SSD (cheap trade-off for 256GB+ SSD).

**Note:** `<SSD-NAME>` is a placeholder throughout this spec. Replace with actual volume name when SSD is purchased and formatted.

---

### Section 4 — TurboQuant Integration

TurboQuant compresses the KV cache (not model weights) by 4-6x. This enables dramatically longer context windows without increasing memory usage.

**What TurboQuant changes on the 14B model:**

| Context Length | KV Cache (no TQ) | KV Cache (TQ 4-bit) | Savings |
|---|---|---|---|
| 8K tokens | ~1.2GB | ~0.3GB | 0.9GB freed |
| 32K tokens | ~4.6GB | ~1.2GB | 3.4GB freed |
| 128K tokens | ~18.4GB | ~4.8GB | 13.6GB freed |

At 128K context with TurboQuant: 9GB model + 4.8GB KV = 13.8GB — leaves 18GB for LoRA training or OS overhead.

**Installation path: turboquant_plus (llama.cpp fork for Apple Silicon)**

The community fork `turboquant_plus` integrates TurboQuant into llama.cpp with Metal acceleration for Apple Silicon. This is the recommended path because:
- Ollama uses llama.cpp under the hood
- Metal acceleration = M1 GPU utilization
- `turbo3` and `turbo4` cache types available (4-bit recommended)

**Build from source:**
```bash
git clone https://github.com/TheTom/turboquant_plus.git
cd turboquant_plus
mkdir build && cd build
cmake .. -DLLAMA_METAL=ON -DLLAMA_TURBOQUANT=ON
cmake --build . --config Release -j$(sysctl -n hw.ncpu)
```

**Run inference with TurboQuant:**
```bash
./build/bin/llama-server \
  -m /Volumes/<SSD-NAME>/ollama-models/<model-path>.gguf \
  --cache-type-k turbo4 --cache-type-v turbo4 \
  -ngl 99 -c 131072 -fa on \
  --host 0.0.0.0 --port 8080
```

Flags:
- `--cache-type-k turbo4 --cache-type-v turbo4` — 4-bit TurboQuant on both key and value caches
- `-ngl 99` — offload all layers to GPU (Metal)
- `-c 131072` — 128K context window
- `-fa on` — flash attention (required for TurboQuant)

**Integration decision: Ollama vs llama.cpp direct**

Two options exist:

| Approach | Pros | Cons |
|---|---|---|
| **A: Ollama only** (no TurboQuant yet) | Simple, `ollama serve` just works, model management built in | No TurboQuant until Ollama adds native support |
| **B: llama.cpp (turboquant_plus) direct** | TurboQuant now, full control, 128K context | Manual model management, must convert GGUF paths |

**Recommendation: Both.** Install Ollama for model management and simple tasks. Run turboquant_plus llama-server for long-context work. ash-proxy routes to the right backend:

```
ash-proxy decision:
  if task.context_length > 32K → turboquant_plus (port 8080)
  else → Ollama (port 11434)
```

---

### Section 5 — ash-proxy Verification

ash-proxy is already designed in the Ash Code spec (friendly-volhard worktree). It's a Bun HTTP server that translates Anthropic SDK format → Ollama format.

**For Phase 1, we verify the proxy works with both backends:**

```
Anthropic SDK request
  → POST http://localhost:4000/v1/messages
  → ash-proxy (Bun, port 4000)
  → routes to:
      Ollama (port 11434) for standard requests
      turboquant_plus (port 8080) for long-context requests
  → translates response back to Anthropic format
  → caller receives standard Anthropic response
```

**ash-proxy additions for Phase 1:**

1. **Dual backend support** — config flag to route between Ollama and turboquant_plus based on context length threshold
2. **Health check** — `GET /health` returns which backends are available (Ollama up? turboquant_plus up? SSD mounted?)
3. **Model swap** — `POST /admin/model` to change active model without restarting (tells Ollama to load a different model)

**Config (env vars, same as Ash Code spec):**
```bash
export ASH_OLLAMA_URL=http://localhost:11434      # Ollama backend
export ASH_TURBO_URL=http://localhost:8080         # turboquant_plus backend
export ASH_PROXY_PORT=4000                         # proxy listen port
export ASH_MODEL=qwen2.5-coder:14b                # default model
export ASH_TURBO_CONTEXT_THRESHOLD=32768           # route to turbo above this
```

---

### Section 6 — Python TurboQuant (HuggingFace Path)

For Phase 2 (Active Dreaming) and direct experimentation, also install the Python package:

```bash
pip install turboquant
```

This enables:
- Direct quantizer access for benchmarking/testing
- HuggingFace model integration for training pipelines
- OpenAI-compatible server mode: `turboquant-server --model <name> --bits 4 --port 9000`

Not used in Phase 1 inference — this is prep for Phase 2 training workflows.

---

### Section 7 — Verification Tests

Phase 1 is complete when all of these pass:

**Test 1: Ollama basic inference**
```bash
ollama run qwen2.5-coder:14b "Write a Python function that checks if a number is prime"
```
Expected: Correct code output, <5s first-token latency.

**Test 2: Ollama API endpoint**
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-coder:14b",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```
Expected: JSON response with assistant message.

**Test 3: TurboQuant long context**
```bash
# Feed a large document (>32K tokens) to turboquant_plus server
curl http://localhost:8080/v1/chat/completions -d '{
  "model": "qwen2.5-coder:14b",
  "messages": [{"role": "user", "content": "<32K+ token prompt>"}]
}'
```
Expected: Response completes without OOM. Memory usage stays under 20GB.

**Test 4: ash-proxy translation**
```bash
# Send Anthropic-format request to proxy
curl http://localhost:4000/v1/messages -d '{
  "model": "qwen2.5-coder:14b",
  "max_tokens": 1024,
  "messages": [{"role": "user", "content": "Hello from ash-proxy"}]
}'
```
Expected: Valid Anthropic-format response.

**Test 5: ash-proxy health check**
```bash
curl http://localhost:4000/health
```
Expected: `{"ollama": true, "turboquant": true, "ssd_mounted": true, "model": "qwen2.5-coder:14b"}`

**Test 6: Model swap**
```bash
curl -X POST http://localhost:4000/admin/model -d '{"model": "qwen2.5-coder:32b"}'
# Then run inference — should use 32b model
```
Expected: Model loads, inference works on 32b.

**Test 7: SSD unmounted fallback**
```bash
# Unmount SSD, then:
curl http://localhost:4000/health
```
Expected: `{"ollama": false, "turboquant": false, "ssd_mounted": false}` — no crash.

---

### Section 8 — File Locations

| File/Dir | Path | Purpose |
|---|---|---|
| Ollama binary | `/opt/homebrew/bin/ollama` | Installed via Homebrew |
| Ollama models | `/Volumes/<SSD-NAME>/ollama-models/` | Redirected via OLLAMA_MODELS |
| turboquant_plus source | `~/turboquant_plus/` | Built from source |
| turboquant_plus binary | `~/turboquant_plus/build/bin/llama-server` | TQ-enabled inference server |
| ash-proxy | `~/Downloads/Ash Test/ash-proxy.ts` | Anthropic↔Ollama bridge (does not exist yet — created during Ash Code build or Phase 1 step 12) |
| GGUF models | `/Volumes/<SSD-NAME>/gguf-models/` | Direct GGUF files for turboquant_plus |
| LLM config | `~/.ash/llm-config.json` | SSD paths, default model, thresholds |
| LoRA adapters | `/Volumes/<SSD-NAME>/lora-adapters/` | Phase 2 — created now for structure |
| Training data | `/Volumes/<SSD-NAME>/training-data/` | Phase 2 — created now for structure |
| Python turboquant | `pip install turboquant` | Phase 2 prep — HuggingFace integration |
| Env config | `~/.zshrc` | OLLAMA_MODELS + ASH_* env vars |

---

### Section 9 — Build Order (Phase 1)

1. Install Ollama via Homebrew
2. Mount SSD + set OLLAMA_MODELS env var in ~/.zshrc
3. Create SSD directory structure (ollama-models, lora-adapters, training-data, model-backups)
4. Pull qwen2.5-coder:14b
5. Pull qwen2.5-coder:32b
6. Run Test 1 + Test 2 (Ollama basic inference)
7. Clone + build turboquant_plus from source (with Metal + TurboQuant flags)
8. Locate GGUF model file on SSD, run turboquant_plus llama-server with TurboQuant flags
9. Run Test 3 (TurboQuant long context)
10. Install Python turboquant (`pip install turboquant`)
11. Create ~/.ash/ directory + llm-config.json
12. Verify ash-proxy.ts routes to both backends (Ollama + turboquant_plus)
13. Add dual-backend routing + health check + model swap to ash-proxy
14. Run Tests 4–7 (proxy, health, swap, fallback)
15. Update SOUL_BASE.md LLM routing table with local model details
16. Update agent_connector.js to recognize local endpoint as available

---

## Phase 2 Preview — Active Dreaming

> Full spec in a future session. Key decisions locked now:

**Base model for training:** qwen2.5-coder:14b
**Training framework:** Apple MLX (native M1 acceleration)
**LoRA adapter strategy:** Swappable experts on single base
- `llm-ops-expert.lora` — LLM infrastructure + optimization knowledge (first adapter)
- `seo-expert.lora` — SEO/PPC/ad copy domain expertise
- `ash-style.lora` — trained on Ashish's edits, preferences, communication style

**Dreaming pipeline:**
1. **Log:** All interactions saved to Firestore `interactions/` collection
2. **Filter:** Quality scoring (human-rated or auto-scored by Claude API)
3. **Train:** MLX LoRA fine-tune on approved examples
4. **Deploy:** New adapter replaces old, old archived to `model-backups/`
5. **Cycle:** Nightly via launchd (macOS cron equivalent)

**Firestore collections (created in Phase 2):**
- `interactions/` — raw I/O pairs with metadata
- `training_queue/` — approved examples queued for next training run
- `model_versions/` — LoRA checkpoint history
- `dream_logs/` — what each dreaming cycle produced + metrics

---

## Phase 3 Preview — MoE Router

> Full spec in a future session. Key decisions locked now:

**Router location:** ARES `agent_connector.js` (existing orchestrator)

**Routing matrix:**

| Task Type | Route To | Why |
|---|---|---|
| Code, agentic tool use | Local: qwen2.5-coder:14b | Fast, free, good enough |
| Long context (>32K) | Local: turboquant_plus | TurboQuant handles it |
| SEO/PPC domain tasks | Local: 14b + seo-expert.lora | Domain-tuned |
| Strategy, client-facing | Claude API | Quality-critical |
| Scrutinizer review | Claude API | Quality-critical |
| Task classification | Local: 14b (fast) | Cheap routing decision |
| Research, bulk content | Local: 14b | Cost control |
| ARES Manager decisions | Gemini API | Already wired |

**Adapter swap logic:** Router selects LoRA adapter based on task type tag before inference.

---

## Phase 4 Preview — Data Agents

> Full spec in a future session. Key decisions locked now:

**Scraping Agent:** ARES Worker that harvests data from websites. Feeds into training pipeline.
**Research Agent:** ARES Worker that runs variant SERP queries, compiles competitive intelligence.
Both run on local 14b model (cost-free bulk operations).

---

## Success Criteria (Phase 1)

- [ ] `ollama serve` running on M1, models stored on SSD
- [ ] `qwen2.5-coder:14b` inference works via Ollama CLI and API
- [ ] `qwen2.5-coder:32b` downloaded and swappable
- [ ] turboquant_plus built from source with Metal + TurboQuant
- [ ] 128K context inference works without OOM on 14b
- [ ] ash-proxy routes to both Ollama and turboquant_plus backends
- [ ] Health check shows backend status + SSD mount state
- [ ] Model swap works without restart
- [ ] Graceful fallback when SSD unmounted
- [ ] `~/.ash/llm-config.json` stores all paths and defaults
- [ ] SOUL_BASE.md LLM routing table updated
- [ ] SSD directory structure ready for Phase 2 (lora-adapters, training-data)
