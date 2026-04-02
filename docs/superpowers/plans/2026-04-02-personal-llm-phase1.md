# Personal LLM System — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get Ollama + TurboQuant + qwen2.5-coder:14b running on M1 32GB with ash-proxy as the Anthropic↔Ollama bridge, ready for Ash Code integration.

**Architecture:** Ollama handles model management and standard inference. turboquant_plus (llama.cpp fork) handles long-context inference with TurboQuant KV cache compression. ash-proxy (Bun HTTP server) sits in front of both, accepts Anthropic SDK format, and routes to the right backend based on context length. Models stored on internal drive for now — SSD migration is a separate deferred task.

**Tech Stack:** Ollama, llama.cpp (turboquant_plus fork), Bun, TypeScript, CMake, Python (pip)

**Important:** SSD is not yet purchased. All tasks use internal storage (`~/.ollama/models/` and `~/gguf-models/`) with paths designed to be easily redirected when SSD arrives.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `~/.ash/llm-config.json` | Central config: model paths, defaults, thresholds |
| Create | `~/ash-proxy/ash-proxy.ts` | Bun HTTP server: Anthropic↔Ollama translation + dual-backend routing |
| Create | `~/ash-proxy/package.json` | Bun project manifest |
| Create | `~/ash-proxy/tsconfig.json` | TypeScript config |
| Modify | `~/rank-higher-media/SOUL_BASE.md` | Add local model details to LLM routing table |
| Modify | `~/rank-higher-media/ares/scripts/agent_connector.js` | Add local endpoint awareness |
| Create | `~/ash-proxy/test-inference.sh` | End-to-end verification script |

---

## Task 1: Install Ollama

**Files:**
- System: `/opt/homebrew/bin/ollama` (installed by Homebrew)

- [ ] **Step 1: Install Ollama via Homebrew**

```bash
brew install ollama
```

- [ ] **Step 2: Verify installation**

```bash
ollama --version
```

Expected: Version string like `ollama version 0.X.X`

- [ ] **Step 3: Start Ollama daemon**

```bash
ollama serve &
```

Expected: Server starts on `http://localhost:11434`. Output includes `Listening on 127.0.0.1:11434`.

- [ ] **Step 4: Verify API is responding**

```bash
curl -s http://localhost:11434/api/tags | python3 -m json.tool
```

Expected: JSON response with `"models": []` (empty list, no models yet).

---

## Task 2: Download Models

**Files:**
- Storage: `~/.ollama/models/` (default, migrates to SSD later)

- [ ] **Step 1: Pull primary model (the learner)**

```bash
ollama pull qwen2.5-coder:14b
```

Expected: Downloads ~9GB. Progress bar shows download + verification. This takes 5-15 minutes depending on connection.

- [ ] **Step 2: Verify model is listed**

```bash
ollama list
```

Expected: Shows `qwen2.5-coder:14b` with size ~9GB.

- [ ] **Step 3: Pull secondary model (heavy inference)**

```bash
ollama pull qwen2.5-coder:32b
```

Expected: Downloads ~20GB. Takes 10-30 minutes. This model is for swap-in inference only — no training.

- [ ] **Step 4: Verify both models listed**

```bash
ollama list
```

Expected: Both `qwen2.5-coder:14b` and `qwen2.5-coder:32b` shown.

---

## Task 3: Verify Ollama Basic Inference

**Files:**
- None (verification only)

- [ ] **Step 1: Test CLI inference**

```bash
ollama run qwen2.5-coder:14b "Write a Python function that checks if a number is prime. Just the function, no explanation."
```

Expected: Correct Python function output. First-token latency under 5 seconds on M1.

- [ ] **Step 2: Test API inference**

```bash
curl -s http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-coder:14b",
  "messages": [{"role": "user", "content": "Say hello in exactly 5 words"}],
  "stream": false
}' | python3 -m json.tool
```

Expected: JSON response with `message.content` containing a 5-word greeting.

- [ ] **Step 3: Test OpenAI-compatible endpoint**

```bash
curl -s http://localhost:11434/v1/chat/completions -d '{
  "model": "qwen2.5-coder:14b",
  "messages": [{"role": "user", "content": "What is 2+2?"}]
}' | python3 -m json.tool
```

Expected: OpenAI-format JSON response with `choices[0].message.content` containing "4".

- [ ] **Step 4: Test model swap**

```bash
curl -s http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-coder:32b",
  "messages": [{"role": "user", "content": "Say hello"}],
  "stream": false
}' | python3 -m json.tool
```

Expected: Response from 32b model. First load takes 10-20 seconds (model swap), subsequent calls faster.

- [ ] **Step 5: Commit progress**

```bash
cd ~/rank-higher-media
git add -A
git commit -m "chore: Ollama installed and verified — 14b + 32b models running"
```

---

## Task 4: Install Dependencies + Build turboquant_plus

**Files:**
- Source: `~/turboquant_plus/` (cloned from GitHub)
- Binary: `~/turboquant_plus/build/bin/llama-server`

- [ ] **Step 1: Install build dependencies**

```bash
brew install cmake
```

If already installed, this is a no-op.

- [ ] **Step 2: Install Python dependencies for GGUF download**

```bash
pip3 install huggingface-hub turboquant
```

- [ ] **Step 3: Clone turboquant_plus**

```bash
cd ~
git clone https://github.com/TheTom/turboquant_plus.git
cd turboquant_plus
```

Expected: Repo cloned. Contains llama.cpp fork with TurboQuant patches.

- [ ] **Step 4: Build with Metal + TurboQuant**

```bash
cd ~/turboquant_plus
mkdir -p build && cd build
cmake .. -DLLAMA_METAL=ON -DLLAMA_TURBOQUANT=ON
cmake --build . --config Release -j$(sysctl -n hw.ncpu)
```

Expected: Build completes. Binary at `~/turboquant_plus/build/bin/llama-server`.

- [ ] **Step 5: Verify binary exists**

```bash
ls -la ~/turboquant_plus/build/bin/llama-server
~/turboquant_plus/build/bin/llama-server --help 2>&1 | head -5
```

Expected: Binary exists, help output shows available flags including `--cache-type-k` and `--cache-type-v`.

---

## Task 5: Download GGUF + Verify TurboQuant Inference

**Files:**
- Storage: `~/gguf-models/` (migrates to SSD later)

- [ ] **Step 1: Create GGUF directory**

```bash
mkdir -p ~/gguf-models
```

- [ ] **Step 2: Download GGUF model from HuggingFace**

```bash
huggingface-cli download Qwen/Qwen2.5-Coder-14B-Instruct-GGUF \
  qwen2.5-coder-14b-instruct-q4_k_m.gguf \
  --local-dir ~/gguf-models/
```

Expected: Downloads ~9GB Q4_K_M quantized GGUF file. This is the same model Ollama has, but in raw GGUF format for turboquant_plus.

- [ ] **Step 3: Start turboquant_plus server with TurboQuant enabled**

```bash
~/turboquant_plus/build/bin/llama-server \
  -m ~/gguf-models/qwen2.5-coder-14b-instruct-q4_k_m.gguf \
  --cache-type-k turbo4 --cache-type-v turbo4 \
  -ngl 99 -c 65536 -fa on \
  --host 127.0.0.1 --port 8080 &
```

Flags:
- `--cache-type-k turbo4 --cache-type-v turbo4` — 4-bit TurboQuant KV cache
- `-ngl 99` — offload all layers to Metal GPU
- `-c 65536` — 64K context (conservative start, scale to 128K after verification)
- `-fa on` — flash attention (required for TurboQuant)
- Port 8080 to avoid conflict with Ollama on 11434

Expected: Server starts, logs show model loaded with TurboQuant cache type.

- [ ] **Step 4: Test basic inference via turboquant_plus**

```bash
curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder-14b",
    "messages": [{"role": "user", "content": "What is TurboQuant?"}],
    "max_tokens": 200
  }' | python3 -m json.tool
```

Expected: Valid OpenAI-format response. Model generates coherent answer.

- [ ] **Step 5: Test long context (verify TurboQuant is working)**

Generate a large prompt and send it:

```bash
# Generate a ~16K token prompt (roughly 64KB of text)
python3 -c "
text = 'The quick brown fox jumps over the lazy dog. ' * 2000
import json
payload = json.dumps({
    'model': 'qwen2.5-coder-14b',
    'messages': [{'role': 'user', 'content': text + '\n\nSummarize the above text in one sentence.'}],
    'max_tokens': 100
})
print(payload)
" | curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d @- | python3 -m json.tool
```

Expected: Response completes without OOM error. Check memory usage:

```bash
# In a separate terminal while inference is running:
ps aux | grep llama-server | grep -v grep | awk '{print $6/1024 " MB"}'
```

Expected: Memory usage under 15GB (9GB model + ~1.2GB TurboQuant KV cache for 16K tokens + overhead).

- [ ] **Step 6: Stop turboquant_plus server**

```bash
pkill -f "llama-server.*8080"
```

---

## Task 6: Create Config Infrastructure

**Files:**
- Create: `~/.ash/llm-config.json`

- [ ] **Step 1: Create ~/.ash directory**

```bash
mkdir -p ~/.ash
```

- [ ] **Step 2: Create llm-config.json**

Write this file at `~/.ash/llm-config.json`:

```json
{
  "version": "1.0",
  "ollama": {
    "url": "http://localhost:11434",
    "default_model": "qwen2.5-coder:14b",
    "fallback_model": "qwen2.5-coder:32b"
  },
  "turboquant": {
    "url": "http://localhost:8080",
    "binary": "~/turboquant_plus/build/bin/llama-server",
    "gguf_dir": "~/gguf-models",
    "default_gguf": "qwen2.5-coder-14b-instruct-q4_k_m.gguf",
    "cache_type": "turbo4",
    "context_length": 65536,
    "gpu_layers": 99
  },
  "proxy": {
    "port": 4000,
    "turbo_context_threshold": 32768
  },
  "ssd": {
    "mounted": false,
    "mount_point": null,
    "ollama_models": null,
    "gguf_models": null,
    "lora_adapters": null,
    "training_data": null,
    "model_backups": null
  }
}
```

- [ ] **Step 3: Add ASH env vars to ~/.zshrc**

Append to `~/.zshrc`:

```bash
# --- Ash Code / Local LLM ---
export ASH_OLLAMA_URL=http://localhost:11434
export ASH_TURBO_URL=http://localhost:8080
export ASH_PROXY_PORT=4000
export ASH_MODEL=qwen2.5-coder:14b
export ASH_TURBO_CONTEXT_THRESHOLD=32768
export ASH_CONFIG=~/.ash/llm-config.json
```

- [ ] **Step 4: Source the updated profile**

```bash
source ~/.zshrc
echo $ASH_MODEL
```

Expected: Outputs `qwen2.5-coder:14b`.

---

## Task 7: Create ash-proxy (Dual-Backend Router)

This is the main code artifact. A Bun HTTP server that accepts Anthropic Messages API format and routes to Ollama or turboquant_plus.

**Files:**
- Create: `~/ash-proxy/package.json`
- Create: `~/ash-proxy/tsconfig.json`
- Create: `~/ash-proxy/ash-proxy.ts`

- [ ] **Step 1: Create project directory and package.json**

```bash
mkdir -p ~/ash-proxy
```

Write `~/ash-proxy/package.json`:

```json
{
  "name": "ash-proxy",
  "version": "1.0.0",
  "description": "Anthropic SDK ↔ Ollama/TurboQuant translation proxy",
  "type": "module",
  "scripts": {
    "start": "bun run ash-proxy.ts",
    "dev": "bun --watch run ash-proxy.ts"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Write `~/ash-proxy/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "types": ["bun-types"]
  }
}
```

- [ ] **Step 3: Install Bun if not present**

```bash
which bun || curl -fsSL https://bun.sh/install | bash
```

- [ ] **Step 4: Write ash-proxy.ts**

Write `~/ash-proxy/ash-proxy.ts`:

```typescript
/**
 * ash-proxy — Anthropic SDK ↔ Ollama/TurboQuant translation layer
 *
 * Accepts Anthropic Messages API format on port 4000.
 * Routes to Ollama (port 11434) for standard requests.
 * Routes to turboquant_plus (port 8080) for long-context requests.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// --- Config ---

const OLLAMA_URL = process.env.ASH_OLLAMA_URL || "http://localhost:11434";
const TURBO_URL = process.env.ASH_TURBO_URL || "http://localhost:8080";
const PORT = parseInt(process.env.ASH_PROXY_PORT || "4000");
const DEFAULT_MODEL = process.env.ASH_MODEL || "qwen2.5-coder:14b";
const TURBO_THRESHOLD = parseInt(process.env.ASH_TURBO_CONTEXT_THRESHOLD || "32768");

let currentModel = DEFAULT_MODEL;

// --- Types ---

interface AnthropicMessage {
  role: string;
  content: string | Array<{ type: string; text?: string }>;
}

interface AnthropicRequest {
  model?: string;
  max_tokens?: number;
  messages: AnthropicMessage[];
  system?: string;
  stream?: boolean;
}

interface OllamaMessage {
  role: string;
  content: string;
}

// --- Helpers ---

function extractText(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("\n");
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 chars
  return Math.ceil(text.length / 4);
}

function anthropicToOllama(req: AnthropicRequest): {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
  options: { num_predict: number };
} {
  const messages: OllamaMessage[] = [];

  if (req.system) {
    messages.push({ role: "system", content: req.system });
  }

  for (const msg of req.messages) {
    messages.push({
      role: msg.role,
      content: extractText(msg.content),
    });
  }

  return {
    model: req.model || currentModel,
    messages,
    stream: false,
    options: { num_predict: req.max_tokens || 1024 },
  };
}

function ollamaToAnthropic(ollamaResp: any, model: string): object {
  return {
    id: `msg_${Date.now()}`,
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: ollamaResp.message?.content || ollamaResp.choices?.[0]?.message?.content || "",
      },
    ],
    model,
    stop_reason: "end_turn",
    usage: {
      input_tokens: ollamaResp.prompt_eval_count || 0,
      output_tokens: ollamaResp.eval_count || ollamaResp.usage?.completion_tokens || 0,
    },
  };
}

async function checkBackend(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return resp.ok;
  } catch {
    return false;
  }
}

function checkSsd(): boolean {
  try {
    const configPath = resolve(process.env.HOME || "~", ".ash/llm-config.json");
    if (!existsSync(configPath)) return false;
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (!config.ssd?.mount_point) return false;
    return existsSync(config.ssd.mount_point);
  } catch {
    return false;
  }
}

// --- Routes ---

async function handleHealth(): Promise<Response> {
  const [ollamaUp, turboUp] = await Promise.all([
    checkBackend(`${OLLAMA_URL}/api/tags`),
    checkBackend(`${TURBO_URL}/health`),
  ]);

  return Response.json({
    ollama: ollamaUp,
    turboquant: turboUp,
    ssd_mounted: checkSsd(),
    model: currentModel,
    turbo_threshold: TURBO_THRESHOLD,
  });
}

async function handleModelSwap(req: Request): Promise<Response> {
  const body = (await req.json()) as { model: string };
  if (!body.model) {
    return Response.json({ error: "model field required" }, { status: 400 });
  }
  currentModel = body.model;
  return Response.json({ ok: true, model: currentModel });
}

async function handleMessages(req: Request): Promise<Response> {
  const body = (await req.json()) as AnthropicRequest;

  // Estimate total context length
  let totalText = body.system || "";
  for (const msg of body.messages) {
    totalText += extractText(msg.content);
  }
  const estimatedTokens = estimateTokens(totalText);

  // Route decision: Ollama for short context, turboquant_plus for long
  const useTurbo = estimatedTokens > TURBO_THRESHOLD;
  const backendUrl = useTurbo ? TURBO_URL : OLLAMA_URL;

  let backendResp: any;

  if (useTurbo) {
    // turboquant_plus speaks OpenAI format
    const openaiPayload = {
      model: body.model || currentModel,
      messages: [] as OllamaMessage[],
      max_tokens: body.max_tokens || 1024,
    };
    if (body.system) {
      openaiPayload.messages.push({ role: "system", content: body.system });
    }
    for (const msg of body.messages) {
      openaiPayload.messages.push({ role: msg.role, content: extractText(msg.content) });
    }

    const resp = await fetch(`${TURBO_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(openaiPayload),
    });
    backendResp = await resp.json();
  } else {
    // Ollama native format
    const ollamaPayload = anthropicToOllama(body);
    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaPayload),
    });
    backendResp = await resp.json();
  }

  // Translate response to Anthropic format
  const anthropicResp = ollamaToAnthropic(backendResp, body.model || currentModel);
  return Response.json(anthropicResp);
}

// --- Server ---

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health" && req.method === "GET") {
      return handleHealth();
    }

    if (url.pathname === "/admin/model" && req.method === "POST") {
      return handleModelSwap(req);
    }

    if (url.pathname === "/v1/messages" && req.method === "POST") {
      return handleMessages(req);
    }

    return Response.json({ error: "not found" }, { status: 404 });
  },
});

console.log(`ash-proxy running on http://localhost:${PORT}`);
console.log(`  Ollama backend: ${OLLAMA_URL}`);
console.log(`  TurboQuant backend: ${TURBO_URL}`);
console.log(`  Default model: ${currentModel}`);
console.log(`  TurboQuant threshold: ${TURBO_THRESHOLD} tokens`);
```

- [ ] **Step 5: Start ash-proxy and verify startup**

```bash
cd ~/ash-proxy
bun run ash-proxy.ts &
```

Expected output:
```
ash-proxy running on http://localhost:4000
  Ollama backend: http://localhost:11434
  TurboQuant backend: http://localhost:8080
  Default model: qwen2.5-coder:14b
  TurboQuant threshold: 32768 tokens
```

---

## Task 8: Verify ash-proxy End-to-End

**Files:**
- Create: `~/ash-proxy/test-inference.sh`

Prerequisite: Ollama must be running (`ollama serve`). turboquant_plus does NOT need to be running for Tests 1-3.

- [ ] **Step 1: Test health check (Ollama only)**

```bash
curl -s http://localhost:4000/health | python3 -m json.tool
```

Expected:
```json
{
  "ollama": true,
  "turboquant": false,
  "ssd_mounted": false,
  "model": "qwen2.5-coder:14b",
  "turbo_threshold": 32768
}
```

- [ ] **Step 2: Test Anthropic-format inference via proxy**

```bash
curl -s http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder:14b",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "What is 2+2? Answer in one word."}]
  }' | python3 -m json.tool
```

Expected: Anthropic-format JSON response with `content[0].text` containing "Four" or "4".

- [ ] **Step 3: Test model swap via proxy**

```bash
# Swap to 32b
curl -s -X POST http://localhost:4000/admin/model \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5-coder:32b"}' | python3 -m json.tool

# Verify health shows new model
curl -s http://localhost:4000/health | python3 -m json.tool

# Swap back to 14b
curl -s -X POST http://localhost:4000/admin/model \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5-coder:14b"}' | python3 -m json.tool
```

Expected: Model field updates in health check after each swap.

- [ ] **Step 4: Test TurboQuant routing (start turboquant_plus first)**

```bash
# Start turboquant_plus in background
~/turboquant_plus/build/bin/llama-server \
  -m ~/gguf-models/qwen2.5-coder-14b-instruct-q4_k_m.gguf \
  --cache-type-k turbo4 --cache-type-v turbo4 \
  -ngl 99 -c 65536 -fa on \
  --host 127.0.0.1 --port 8080 &

# Wait for server to load model
sleep 15

# Verify both backends up
curl -s http://localhost:4000/health | python3 -m json.tool
```

Expected: `{"ollama": true, "turboquant": true, ...}`

- [ ] **Step 5: Write and run the full verification script**

Write `~/ash-proxy/test-inference.sh`:

```bash
#!/bin/bash
# ash-proxy end-to-end verification
# Requires: ollama serve + ash-proxy running
# Optional: turboquant_plus running on 8080

set -e
PASS=0
FAIL=0

check() {
  local name="$1"
  local result="$2"
  if [ "$result" = "true" ]; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== ash-proxy verification ==="
echo ""

# Test 1: Health endpoint
echo "Test 1: Health check"
HEALTH=$(curl -s http://localhost:4000/health)
OLLAMA_UP=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['ollama'])")
check "Ollama backend reachable" "$OLLAMA_UP"

# Test 2: Anthropic-format inference
echo "Test 2: Inference via proxy"
RESP=$(curl -s http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder:14b","max_tokens":50,"messages":[{"role":"user","content":"Say hello"}]}')
HAS_CONTENT=$(echo "$RESP" | python3 -c "
import sys,json
try:
  r = json.load(sys.stdin)
  print('true' if r.get('content',[{}])[0].get('text','') else 'false')
except: print('false')
")
check "Anthropic-format response received" "$HAS_CONTENT"

# Test 3: Model swap
echo "Test 3: Model swap"
curl -s -X POST http://localhost:4000/admin/model \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder:32b"}' > /dev/null
SWAPPED=$(curl -s http://localhost:4000/health | python3 -c "
import sys,json; print('true' if json.load(sys.stdin)['model']=='qwen2.5-coder:32b' else 'false')
")
check "Model swapped to 32b" "$SWAPPED"
# Swap back
curl -s -X POST http://localhost:4000/admin/model \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder:14b"}' > /dev/null

# Test 4: TurboQuant backend (if running)
echo "Test 4: TurboQuant backend"
TURBO_UP=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['turboquant'])")
if [ "$TURBO_UP" = "True" ] || [ "$TURBO_UP" = "true" ]; then
  check "TurboQuant backend reachable" "true"
else
  echo "  ⊘ TurboQuant not running (optional — start llama-server on 8080 to test)"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ $FAIL -gt 0 ]; then exit 1; fi
```

```bash
chmod +x ~/ash-proxy/test-inference.sh
~/ash-proxy/test-inference.sh
```

Expected: All tests pass (TurboQuant test is optional — passes if turboquant_plus is running).

- [ ] **Step 6: Clean up background processes**

```bash
pkill -f "llama-server.*8080" 2>/dev/null || true
```

- [ ] **Step 7: Commit ash-proxy**

```bash
cd ~/ash-proxy
git init
git add -A
git commit -m "feat: ash-proxy — Anthropic↔Ollama translation with TurboQuant routing"
```

---

## Task 9: Update ARES Integration Files

**Files:**
- Modify: `~/rank-higher-media/SOUL_BASE.md`
- Modify: `~/rank-higher-media/ares/scripts/agent_connector.js`

- [ ] **Step 1: Update SOUL_BASE.md LLM routing table**

In `~/rank-higher-media/SOUL_BASE.md`, replace the existing Section 4 LLM Routing Rules table with:

```markdown
## 4. LLM ROUTING RULES

| Task Type | Route To | Model | Reason |
|---|---|---|---|
| Research, scraping, bulk content | Local (Ollama) | qwen2.5-coder:14b | Cost efficiency |
| Code generation, agentic tasks | Local (Ollama) | qwen2.5-coder:14b | Fast, free |
| Long context (>32K tokens) | Local (TurboQuant) | qwen2.5-coder:14b | TQ handles 128K ctx |
| Data formatting, templating | Local (Ollama) | qwen2.5-coder:14b | Routine |
| Supervisor decisions, strategy | Claude API | claude-sonnet-4-6 | Quality-critical |
| Scrutinizer review | Claude API | claude-sonnet-4-6 | Quality-critical |
| Client-facing deliverables | Claude API | claude-sonnet-4-6 | Quality-critical |
| ARES Manager decisions | Gemini API | gemini-2.0-flash | Already wired |

**Local endpoint:** ash-proxy at `http://localhost:4000` (routes to Ollama or TurboQuant automatically)
**Fallback:** If local unavailable, route all tasks to Claude API.
```

- [ ] **Step 2: Add local endpoint awareness to agent_connector.js**

In `~/rank-higher-media/ares/scripts/agent_connector.js`, add this function near the top of the file (after the existing imports):

```javascript
// --- Local LLM endpoint check ---
const ASH_PROXY_URL = process.env.ASH_PROXY_URL || 'http://localhost:4000';

async function checkLocalLLM() {
  try {
    const resp = await fetch(`${ASH_PROXY_URL}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    if (resp.ok) {
      const data = await resp.json();
      return { available: data.ollama || data.turboquant, ...data };
    }
    return { available: false };
  } catch {
    return { available: false };
  }
}
```

And add a comment where the Claude API call happens to mark the future MoE router integration point:

```javascript
// TODO [Phase 3]: Replace direct Claude API call with MoE routing.
// checkLocalLLM() → if available + task is bulk/research → route to ash-proxy
// else → route to Claude API (current behavior)
```

- [ ] **Step 3: Commit ARES updates**

```bash
cd ~/rank-higher-media
git add SOUL_BASE.md ares/scripts/agent_connector.js
git commit -m "feat: add local LLM routing to SOUL_BASE.md + agent_connector.js endpoint check"
```

---

## Task 10: SSD Migration (Deferred — Run When SSD Arrives)

> **Do not run this task now.** Save for when the external SSD is purchased, formatted, and mounted.

**Files:**
- Modify: `~/.zshrc`
- Modify: `~/.ash/llm-config.json`

- [ ] **Step 1: Create SSD directory structure**

```bash
SSD_NAME="<your-ssd-volume-name>"
mkdir -p "/Volumes/$SSD_NAME/ollama-models"
mkdir -p "/Volumes/$SSD_NAME/gguf-models"
mkdir -p "/Volumes/$SSD_NAME/lora-adapters/llm-ops-expert"
mkdir -p "/Volumes/$SSD_NAME/lora-adapters/seo-expert"
mkdir -p "/Volumes/$SSD_NAME/lora-adapters/ash-style"
mkdir -p "/Volumes/$SSD_NAME/training-data"
mkdir -p "/Volumes/$SSD_NAME/model-backups"
```

- [ ] **Step 2: Move Ollama models to SSD**

```bash
# Stop Ollama first
pkill ollama

# Move models
mv ~/.ollama/models/* "/Volumes/$SSD_NAME/ollama-models/"

# Update env var in ~/.zshrc
# Replace existing OLLAMA_MODELS line (or add if not present):
export OLLAMA_MODELS="/Volumes/$SSD_NAME/ollama-models"
```

- [ ] **Step 3: Move GGUF models to SSD**

```bash
mv ~/gguf-models/* "/Volumes/$SSD_NAME/gguf-models/"
rmdir ~/gguf-models
ln -s "/Volumes/$SSD_NAME/gguf-models" ~/gguf-models
```

- [ ] **Step 4: Update llm-config.json**

Update `~/.ash/llm-config.json` ssd section:

```json
{
  "ssd": {
    "mounted": true,
    "mount_point": "/Volumes/<SSD-NAME>",
    "ollama_models": "/Volumes/<SSD-NAME>/ollama-models",
    "gguf_models": "/Volumes/<SSD-NAME>/gguf-models",
    "lora_adapters": "/Volumes/<SSD-NAME>/lora-adapters",
    "training_data": "/Volumes/<SSD-NAME>/training-data",
    "model_backups": "/Volumes/<SSD-NAME>/model-backups"
  }
}
```

- [ ] **Step 5: Restart services and verify**

```bash
source ~/.zshrc
ollama serve &
sleep 5
ollama list    # should show models from SSD path
curl -s http://localhost:4000/health | python3 -m json.tool
# ssd_mounted should now be true
```

- [ ] **Step 6: Commit config updates**

```bash
cd ~/rank-higher-media
git add -A
git commit -m "chore: SSD migration complete — models on external storage"
```

---

## Summary — What You Have After Phase 1

```
Ollama daemon (port 11434)
  └── qwen2.5-coder:14b (primary, ~9GB)
  └── qwen2.5-coder:32b (swap-in, ~20GB)

turboquant_plus server (port 8080, on-demand)
  └── Same 14b model via GGUF, TurboQuant 4-bit KV cache
  └── 64K-128K context capability

ash-proxy (port 4000)
  └── Accepts Anthropic Messages API format
  └── Routes: short context → Ollama, long context → turboquant_plus
  └── Health check, model swap, SSD status

~/.ash/llm-config.json — central config
SOUL_BASE.md — updated routing table
agent_connector.js — local endpoint check ready for Phase 3
```

**Ready for Phase 2 (Active Dreaming):** Base model running, MLX can train LoRA on it.
**Ready for Phase 3 (MoE Router):** ash-proxy + agent_connector.js endpoint check in place.
**Ready for Ash Code:** ash-proxy is the bridge layer Ash Code was designed to use.
