# Ollama Cloud + Gemma Model Research — April 2026

> Research date: 2026-04-09
> Context: ARES brainstorm.js Synthesizer upgrade decision
> Current config: `SUPERVISOR_MODEL = 'gemma3:12b'` in `ares/scripts/memory_config.js`

---

## 1. Ollama Cloud: What It Is

Ollama launched a cloud inference service (initially called "Ollama Turbo") in preview in August/September 2025. Key facts:

- **Pricing:** $20/month Pro, $100/month Max subscription tiers (vs. $0 for local)
- **Architecture:** Cloud models use a `:cloud` suffix and are routed through `ollama.com` via a proxy. The local Ollama daemon proxies cloud requests transparently — same API, same commands.
- **Authentication:** `ollama signin` command + Ollama account. Sets up a signed session; no per-request API keys needed for CLI use. For direct REST API: set `OLLAMA_API_KEY` env var.
- **Currently available cloud models (preview, as of April 2026):**
  - `qwen3-coder:480b-cloud`
  - `gpt-oss:120b-cloud`
  - `gpt-oss:20b-cloud`
  - `deepseek-v3.1:671b-cloud`

**Critical finding:** `gemma3:27b-cloud` **is listed in the Ollama library** (35.2M downloads) but is NOT in the official cloud models blog post. It appears to route through Ollama cloud but may be available only with a Pro subscription. Command: `ollama run gemma3:27b-cloud`. Requires Ollama 0.6+.

There is also a **free REST API** at `https://ollama.com/v1/chat/completions` (OpenAI-compatible) with 25+ models, rate-limited but free. This is separate from the subscription cloud model system.

---

## 2. Available Gemma3 Sizes on Ollama (Local)

| Tag | Size on disk | Fits on M1 32GB? |
|-----|-------------|------------------|
| `gemma3:270m` | ~0.2GB | Yes |
| `gemma3:1b` | ~0.8GB | Yes |
| `gemma3:4b` | ~2.5GB | Yes |
| `gemma3:12b` | ~8GB | Yes (currently in use) |
| `gemma3:27b` | **~17GB** | **Yes** — 32GB unified memory handles it comfortably |
| `gemma3:27b-it-qat` | ~6GB | Yes — QAT preserves near-BF16 quality at 3x smaller footprint |
| `gemma3:27b-cloud` | N/A (cloud) | N/A — runs via Ollama cloud subscription |

**M1 32GB assessment for gemma3:27b:**
- The Q4 default quantization weighs ~17GB
- With 32GB unified memory, that leaves ~15GB for system + KV cache — comfortable for synthesis tasks (short context, not 128K loads)
- Minimum comfortable RAM recommendation from community: 20-24GB. M1 32GB is above that.
- The QAT variant (`gemma3:27b-it-qat`) is the best choice: near-BF16 quality at ~6GB — fits easily alongside qwen3:30b-a3b already loaded.

---

## 3. Google Gemma API (Free Cloud Option)

Google released **Gemma 4** (April 2026) and made it available via the Gemini API / Google AI Studio:

### Gemma 4 Model Family
| Model | Size | Type |
|-------|------|------|
| Gemma 4 E2B | ~2B | Dense, on-device |
| Gemma 4 E4B | ~4B | Dense, on-device |
| Gemma 4 26B | 26B | MoE (4B active params) |
| Gemma 4 31B | 31B | Dense |

### API Access
- **Endpoint:** Via `google-genai` SDK, same as Gemini
- **Model IDs:**
  - `gemma-4-31b-it` (31B dense — best quality)
  - `gemma-4-26b-a4b-it` (26B MoE — faster, 4B active)
- **Auth:** Same `GEMINI_API_KEY` already in ARES `.env.local` — no new key needed
- **Free tier:** **Yes — free of charge** (no paid tier currently offered for Gemma 4 via Google AI Studio). Rate limits apply but no cost.
- **Context:** 256K context window, multimodal (text + image)

### Code Example (Node.js — matches ARES stack)
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genai.getGenerativeModel({ model: 'gemma-4-31b-it' })
const result = await model.generateContent(prompt)
return result.response.text()
```

---

## 4. Recommendation: What to Do with brainstorm.js

### Option A — Upgrade local: `gemma3:12b` → `gemma3:27b-it-qat` (RECOMMENDED)
```bash
ollama pull gemma3:27b-it-qat
```
**Change in `memory_config.js`:**
```js
// Before:
const SUPERVISOR_MODEL = 'gemma3:12b'

// After:
const SUPERVISOR_MODEL = 'gemma3:27b-it-qat'
```
**Pros:**
- No cloud subscription cost
- QAT variant: near-BF16 quality at ~6GB — fits M1 32GB alongside qwen3:30b-a3b
- Zero latency overhead (local)
- Dramatically better synthesis than 12b — 27b trained on 14T tokens

**Cons:**
- Need to pull the model first (~6GB download for QAT)
- Slightly slower than 12b per token

---

### Option B — Use Gemma 4 31B via Google AI Studio API (ZERO COST, CLOUD QUALITY)
**Change in `brainstorm.js`:**
```javascript
// Add a cloud synthesizer path alongside the existing Ollama synthesizer
async function callGemma4Cloud(systemPrompt, userPrompt) {
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genai.getGenerativeModel({ model: 'gemma-4-31b-it' })
  const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`)
  return result.response.text()
}
```
**Pros:**
- Gemma 4 31B is larger and more capable than gemma3:27b
- Free — same API key already in `.env.local`
- No local RAM impact
- 256K context window

**Cons:**
- Requires internet (not air-gapped)
- Rate limits on free tier (unknown exact limits)
- Adds Google dependency to brainstorm pipeline (currently Gemini Flash is optional tie-breaker only)

---

### Option C — Use `gemma3:27b-cloud` via Ollama cloud (SKIP FOR NOW)
Requires $20/month Ollama Pro subscription. Not confirmed in official cloud model list. Skip until confirmed.

---

## 5. Decision Summary

| Priority | Action |
|----------|--------|
| **Do now** | `ollama pull gemma3:27b-it-qat` and update `SUPERVISOR_MODEL` |
| **Do now** | Test: `ollama run gemma3:27b-it-qat "Synthesize this debate..."` |
| **Optional upgrade** | Add `callGemma4Cloud()` as a `--synthesizer cloud` flag in brainstorm.js |
| **Skip** | `gemma3:27b-cloud` — needs $20/mo Ollama subscription, unclear availability |

**Recommended final config in `memory_config.js`:**
```js
const SUPERVISOR_MODEL = 'gemma3:27b-it-qat'  // was: gemma3:12b
```
**Expected impact:** Synthesis quality jump equivalent to going from a capable 12B to a tuned 27B — significantly better arbitration on complex strategic debates, especially multi-perspective synthesis tasks.

---

## Sources
- [Ollama Blog: Cloud Models](https://ollama.com/blog/cloud-models)
- [Ollama Library: gemma3:27b](https://ollama.com/library/gemma3:27b)
- [Ollama Library: gemma3:27b-cloud](https://ollama.com/library/gemma3:27b-cloud)
- [Google: Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
- [Google: Gemma 4 available on Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/gemma-4-available-on-google-cloud)
- [Google Gemma 4 Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/)
- [Ollama Cloud Inference API (Medium)](https://pbseven.medium.com/ollama-cloud-inference-api-is-now-ready-f7adf6b8ef3e)
- [Infralovers: Ollama 2025 Updates](https://www.infralovers.com/blog/2025-08-13-ollama-2025-updates/)

---

## Action Items (2026-04-09 — IMPLEMENTED)

### Done
- Updated SUPERVISOR_MODEL in memory_config.js: gemma3:12b → gemma3:27b-it-qat
- Added callGemma4Cloud() to brainstorm.js (SYNTHESIZER_USE_CLOUD=1 env var)

### To do manually (requires Ollama running)
```bash
ollama pull gemma3:27b-it-qat
```
Then run a brainstorm to verify gemma3:27b-it-qat works as Synthesizer.

### Cloud Synthesizer test
```bash
SYNTHESIZER_USE_CLOUD=1 npm run brainstorm -- "test topic" --project ares
```
