# Phase B Research — LoRA Fine-Tuning on M1 Mac (Nightly Dreaming Loop)

**Date:** 2026-04-17 (Session 16)
**Author:** Claude (Opus 4.7)
**Goal:** Design nightly pipeline that fine-tunes local models on `corrections/*.json` so ARES improves over time.

---

## 1. Scheduler → `launchd` (macOS native)

**Pick: launchd.** Cron works but Apple deprecated it; launchd is the supported path and survives reboots/sleeps. `scheduled-tasks` MCP depends on a live MCP server — unreliable for unattended nightly jobs.

Create `~/Library/LaunchAgents/com.ares.dreamloop.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ares.dreamloop</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>cd ~/rank-higher-media/ares && node scripts/dream_loop.js >> logs/dream.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>0</integer></dict>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
```

Load: `launchctl load ~/Library/LaunchAgents/com.ares.dreamloop.plist`. Fires 3am daily even if laptop was asleep (launchd wakes the scheduled window on next wake).

---

## 2. MLX LoRA Training

**Install (one-time):** `pip install mlx-lm` (Apple Silicon native, no CUDA).

**Convert corrections to training format.** Corrections are already ChatML. MLX expects JSONL with `{"messages": [...]}` per line. Transform:

```js
// scripts/prepare_training_data.js (already half-present — extend)
const corrections = fs.readdirSync('corrections').filter(f => f.endsWith('.json'))
const jsonl = corrections.map(f => {
  const { user, assistant_rejected, assistant_corrected } = JSON.parse(fs.readFileSync(`corrections/${f}`))
  return JSON.stringify({ messages: [
    { role: 'user', content: user },
    { role: 'assistant', content: assistant_corrected }  // train on CORRECTED, not rejected
  ]})
}).join('\n')
fs.writeFileSync('corrections/train.jsonl', jsonl)
```

**Train command** (targets gemma3 since it's the supervisor/critic):

```bash
mlx_lm.lora \
  --model mlx-community/gemma-3-12b-it-4bit \
  --train \
  --data corrections/ \
  --iters 200 \
  --batch-size 2 \
  --lora-layers 8 \
  --learning-rate 1e-5 \
  --adapter-path adapters/ares-gemma3-$(date +%Y%m%d)
```

**Threshold for running:** Only train when `corrections/*.json` count ≥ 20. Below that, LoRA overfits to noise.

**Time estimate on M1 Mac 32GB:** gemma-3-12b-4bit with 20–50 examples at 200 iters ≈ 15–25 minutes. qwen3:30b would take 60+ minutes and risk OOM — start with gemma.

---

## 3. Model Reload in Ollama

**Honest answer: Ollama does not hot-swap LoRAs.** It loads full model weights or a merged GGUF. Two paths:

**Option A (simplest): Merge LoRA into base, build new GGUF, reload.**
```bash
# After LoRA training:
mlx_lm.fuse --model mlx-community/gemma-3-12b-it-4bit --adapter-path adapters/ares-gemma3-20260417 --save-path fused/
# Convert to GGUF:
python -m llama_cpp.convert fused/ --outfile gemma-ares-20260417.gguf
# Create Ollama model:
echo "FROM ./gemma-ares-20260417.gguf" > Modelfile
ollama create gemma-ares:latest -f Modelfile
# agent_connector.js picks it up on next request (no daemon restart needed — Ollama loads on demand)
```

**Option B (cleaner but slower to iterate): Keep using MLX directly for supervisor calls**, skip Ollama for the supervisor. Means updating `runSupervisor()` to shell to `mlx_lm.generate`. Trade-off: slower startup per call, no Ollama caching.

Recommend **Option A** for Phase B v1. Switch to Option B only if merge step becomes a bottleneck.

---

## 4. Next Session — Three Files to Create

1. **`ares/scripts/dream_loop.js`** — orchestrator. Reads corrections count, checks threshold (≥20), calls `prepare_training_data`, shells to `mlx_lm.lora`, runs `mlx_lm.fuse`, builds GGUF, creates Ollama model, logs to Firestore `corrections/training_runs/<date>` doc.

2. **`ares/scripts/prepare_training_data.js`** — ChatML → JSONL converter (see section 2). Also filters out corrections older than 90 days.

3. **`~/Library/LaunchAgents/com.ares.dreamloop.plist`** — launchd config (see section 1). After creating, run `launchctl load`.

**Test path before automation:** Drop a fake 20th correction file, run `node scripts/dream_loop.js` manually, verify `gemma-ares:latest` appears in `ollama list`, then call the model through `agent_connector.js` Supervisor path and compare output quality.

---

## Gotchas

- **Disk:** Each merged GGUF is ~7GB for gemma-12b. Prune old adapters monthly.
- **Thermals:** M1 throttles above 80°C. Nightly 3am slot is deliberate — laptop idle + cool.
- **Memory:** MLX LoRA on 12b-4bit peaks ~18GB RAM. Close Chrome before training.
- **First run is manual:** Don't trust launchd on the very first cycle. Run once by hand, verify output, then enable the plist.
