# Claude Code + Local LLMs: Running with Gemma & Qwen via Ollama

**Primary Source:** https://jiradett.medium.com/the-local-agent-setup-running-claude-code-with-gemma-and-qwen-free-private-hybrid-8136e44745e7
**Supporting Sources:**
- https://docs.ollama.com/integrations/claude-code
- https://ollama.com/blog/claude
- https://medium.com/@michael.hannecke/connecting-claude-code-to-local-llms-two-practical-approaches-faa07f474b0f
- https://github.com/mattlqx/claude-code-ollama-proxy
- https://ai.georgeliu.com/p/running-google-gemma-4-with-ollama
- https://medium.com/@joe.njenga/i-tried-gemma-4-on-claude-code-and-found-new-free-google-coding-beast-6d0995ba8645

**Date:** 2026-04-09

---

## Key Takeaways

1. **No LiteLLM required for basic setup** — Ollama now has native Anthropic-compatible API support (v0.14.0+), so Claude Code can connect directly via `ANTHROPIC_BASE_URL=http://localhost:11434` without any middleware proxy.
2. **Context window is the silent killer** — The 4K Ollama default will silently produce garbage. Claude Code needs `num_ctx` set to at least 65,536 tokens. This is the #1 cause of "Ollama + Claude Code is broken" reports.
3. **Hybrid routing is the right architecture** — Local models for bulk/private work, cloud (OpenRouter) for heavy reasoning tasks. Not a binary choice.
4. **Model specialization matters** — Qwen3-Coder beats Gemma 4 for function calling and tool use (what Claude Code relies on). Gemma 4 wins as a generalist/vision model but is not a coding specialist.
5. **MoE models punch above weight** — Gemma 4 26B-A4B runs at ~40 tok/s and scores comparably to the dense 31B model. For local inference, MoE is the right architectural bet.

---

## Full Notes

### Architecture Overview

The setup separates two concerns:
- **Agent layer**: Claude Code CLI — reads files, runs commands, orchestrates tasks, manages the feedback loop
- **Reasoning layer**: Local model (Gemma/Qwen via Ollama) — decides what code to write, debug, plan

The ideal hybrid uses:
- Gemma 4 or Qwen3 locally (via Ollama) for offline/private work
- OpenRouter free tier (Qwen 3.6 Plus or similar) for heavy reasoning tasks that exceed local hardware

---

### Bridge / Proxy Used

**Option 1 — Direct Ollama (preferred, no proxy needed):**
As of Ollama v0.14.0+, the Anthropic-compatible API is built in. No LiteLLM or custom proxy required.

**Option 2 — LiteLLM proxy (for routing/logging):**
Used when you need multi-model routing, logging, or want to mix local and cloud endpoints in one config.

```bash
pip install litellm
litellm --model ollama/gemma4:27b --port 4000
```

With YAML config:
```yaml
model_list:
  - model_name: local-coder
    litellm_params:
      model: ollama/qwen3-coder
      api_base: http://localhost:11434
```

Then: `litellm --config litellm_config.yaml --port 4000`

**Option 3 — claude-code-ollama-proxy:**
Community-built lightweight proxy: https://github.com/mattlqx/claude-code-ollama-proxy
Specifically designed for Claude Code ↔ Ollama translation with minimal overhead.

---

### Setup Steps (Direct Ollama — Recommended)

**Prerequisites:**
- Ollama v0.14.0 or higher
- Claude Code installed
- Model pulled with sufficient context window modelfile

**Step 1: Create a modelfile with extended context**

```
FROM gemma4:27b
PARAMETER num_ctx 65536
```

Or for Qwen3:
```
FROM qwen3-coder
PARAMETER num_ctx 65536
```

Save as `Modelfile`, then:
```bash
ollama create my-gemma4 -f Modelfile
ollama create my-qwen3-coder -f Modelfile
```

**Step 2: Set environment variables**

```bash
export ANTHROPIC_BASE_URL="http://localhost:11434"
export ANTHROPIC_AUTH_TOKEN="ollama"
export ANTHROPIC_API_KEY=""
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

Add to `~/.zshrc` for persistence.

**macOS gotcha:** `launchctl setenv` is unreliable on macOS 15+ across reboots. Use a LaunchAgent plist or add directly to shell profile instead.

**Step 3: Launch Claude Code**

```bash
claude --model my-gemma4
# or
claude --model my-qwen3-coder
```

Or inline:
```bash
ANTHROPIC_AUTH_TOKEN=ollama ANTHROPIC_BASE_URL=http://localhost:11434 ANTHROPIC_API_KEY="" claude --model qwen3-coder
```

**Step 4 (optional): Route heavy tasks to OpenRouter**

```bash
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="your-openrouter-key"
```

---

### Model Recommendations

| Model | Use Case | Context | Hardware |
|---|---|---|---|
| `gemma4:27b` | Generalist, vision, broad reasoning | 65K | 24+ GB RAM |
| `gemma4:26b-A4B` (MoE) | Fast generalist, ~40 tok/s | 65K | 24+ GB RAM |
| `qwen3-coder` | Code generation, function calling, tool use | 65K | 16+ GB RAM |
| `qwen3:30b-a3b` (MoE) | Worker-tier, fast reasoning | 32K+ | 16+ GB RAM |
| `glm-5:cloud` | Cloud via Ollama | N/A | API key |

**Recommended for ARES Worker tier:** `qwen3-coder` or `qwen3:30b-a3b`
**Recommended for ARES Supervisor tier:** `gemma4:27b` or cloud fallback

---

### Performance Notes

- Gemma 4 26B-A4B MoE: ~40 tok/s on M-series Mac, scores 82.6% MMLU Pro, 88.3% AIME 2026
- Dense 31B Gemma 4: 85.2% MMLU Pro, 89.2% AIME 2026 — only slightly better, much slower
- MoE advantage: Only a fraction of parameters activate per token, so inference is faster than parameter count suggests
- On 16GB hardware: Keep inputs under 32K tokens for stable quality
- 48GB M4 Pro: Gemma 4 26B with 64K context modelfile starts swapping around 35GB — tight but workable

---

### Critical Gotchas

1. **Context window (THE gotcha):** Default `num_ctx` in Ollama is 4K. Claude Code silently fails — no error, just degraded/broken output. Always create a custom modelfile with `PARAMETER num_ctx 65536`.

2. **Tool/function calling quality:** Gemma 4 is a generalist — its function calling is passable but inconsistent. Qwen3-Coder has better-trained tool use patterns. For agentic workflows where Claude Code is issuing tool calls, prefer Qwen3-Coder.

3. **macOS env vars across reboots:** `launchctl setenv` doesn't persist reliably on macOS 15+. Use `~/.zshrc` export statements or a LaunchAgent plist.

4. **No real API key needed:** When routing to Ollama, `ANTHROPIC_AUTH_TOKEN` can be any non-empty string (convention: `"ollama"`). `ANTHROPIC_API_KEY` should be empty string to avoid accidentally hitting the real Anthropic API.

5. **VSCode extension config:** The Claude Code VS Code extension has its own env var settings — must be set separately from terminal env vars.

---

## ARES Application

**Immediate actions:**
- ARES `agent_connector.js` should set `ANTHROPIC_BASE_URL` dynamically based on routing tier — local Ollama for Worker tasks, Anthropic API for Manager/Director tier
- Create custom modelfiles for both `qwen3:30b-a3b` and `gemma3:12b` (current ARES LLM table) with `num_ctx 65536` — this is non-negotiable for agentic workflows
- The hybrid routing architecture described here maps directly to the ARES Supervisor/Worker pattern: Supervisor = cloud or Gemma4, Worker = Qwen3-Coder local

**Medium-term:**
- `claude-code-ollama-proxy` (mattlqx) is worth evaluating as a lightweight replacement for the custom proxy layer in `agent_connector.js`
- LiteLLM YAML config enables a clean multi-model routing table that could replace hand-coded routing logic in the connector
- Consider updating the ARES LLM routing table: swap `gemma3:12b` (Supervisor) for `gemma4:27b` — significant capability upgrade with same memory footprint

**Architecture insight:**
The Jiradett article validates the ARES hybrid approach: local models for bulk/private tasks, cloud fallback for complex reasoning. The key missing piece in current ARES is the dynamic `ANTHROPIC_BASE_URL` swap — this is what enables true hybrid routing at the connector level.
