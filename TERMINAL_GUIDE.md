# ARES Terminal Guide
> Your dashboard replacement until Phase A is built. All commands from ~/rank-higher-media/

---

## 1. First: Recreate .env.local (ONE TIME — do this first)

```bash
# Open Firebase Console → ashish-ares project → Project Settings → Your apps → Config
# Copy the values, then:
nano ~/rank-higher-media/ares/.env.local
```

Paste this template and fill in values:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ashish-ares.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ashish-ares
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ashish-ares.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=      # get from aistudio.google.com/apikey
```

---

## 2. ARES Daemon (start/stop/status)

```bash
cd ~/rank-higher-media/ares

npm run ares-start    # start the agent watcher (watches agent_inbox/)
npm run ares-stop     # stop it
npm run ares-status   # is it running?
npm run ares-log      # tail the live log
```

---

## 3. Give Qwen a Task

Drop a markdown file in agent_inbox/ — Qwen picks it up automatically.

```bash
cat > ~/rank-higher-media/ares/agent_inbox/task_001.md << 'EOF'
# Your Task Title Here

**Priority**: normal
**Assignee**: qwen3
**Initiator**: ashish

Describe what you want done here.
EOF
```

**Task types** (put in **Type**: field to route correctly):
- `code` — write/fix code
- `research` — research a topic, write summary
- `summary` — summarize a document
- `review` — review existing code
- `debate` — brainstorm both sides of an idea
- `general` — anything else

**To use Claude instead of Qwen:**
Add `**Worker**: claude` to the task header.

**To use Gemini instead:**
Add `**Worker**: gemini` to the task header.

---

## 4. Phase C Verification Run (next session)

```bash
cd ~/rank-higher-media/ares
npm run ares-start

# In a new terminal tab:
cat > agent_inbox/task_verify_001.md << 'EOF'
# Summarize ARES Architecture

**Priority**: normal
**Assignee**: qwen3
**Initiator**: phase-c-verification

Summarize the ARES agent system in 3 bullet points:
what it is, how tasks flow, what the local models do. Under 150 words.
EOF

# Watch it run:
npm run ares-log
```

**What you should see (all 5 phases firing):**
```
🔔 Task received: task_verify_001.md
   ✅ Knowledge: N chunk(s) retrieved    ← RESEARCH
🎭 Actor-Critic — Actor turn 1/2         ← DRAFT
🎭 Actor-Critic — Critic reviewing...    ← CRITIC
🎭 Actor-Critic — Actor turn 2/2         ← REFINE
🧐 Supervisor reviewing...               ← SUPERVISOR
   🧐 Supervisor decision: APPROVED      ← DONE ✅
```

Result appears in: `agent_outbox/task_verify_001_complete.md`

---

## 5. Check What Qwen/Gemma Completed

```bash
ls ~/rank-higher-media/ares/agent_outbox/        # completed tasks
ls ~/rank-higher-media/ares/agent_inbox/archive/  # archived task files
cat ~/rank-higher-media/ares/agent_outbox/task_001_complete.md  # read a result
```

---

## 6. Brainstorm with Qwen + Gemma (debate engine)

```bash
cd ~/rank-higher-media/ares
npm run brainstorm -- "your topic here" --project ares

# Use Gemma 4 31B synthesizer (free via Gemini API):
SYNTHESIZER_USE_CLOUD=1 npm run brainstorm -- "your topic" --project ares
```

Results saved to: `knowledge/debates/ares/YYYY-MM-DD-topic.md`

---

## 7. Check Ollama Models Available

```bash
curl http://localhost:11434/api/tags | node -e "
const d=require('fs').readFileSync('/dev/stdin','utf8');
JSON.parse(d).models.forEach(m=>console.log(m.name))
"
```

Expected: qwen3:30b-a3b, gemma3:27b-it-qat, gemma3:12b, claude-sonnet-4-6

---

## 8. Give Gemini a Research Task

```bash
cat > ~/rank-higher-media/ares/agent_inbox/task_gemini_research.md << 'EOF'
# Research: Next Steps for ARES Phase B

**Priority**: high
**Worker**: gemini
**Initiator**: ashish
**Type**: research

Research the best approach for implementing a nightly LoRA fine-tuning scheduler on an M1 Mac using MLX.
Specifically:
1. What MLX LoRA training script to use
2. How to format the corrections/*.json files into ChatML training data
3. How to hot-swap an updated model in Ollama without restarting

Output a concise implementation plan under 300 words.
EOF
```

---

## 9. Monorepo Structure (what changed this session)

```
~/rank-higher-media/          ← ONE git repo (the shell)
├── ares/                     ← ARES agent platform (git subtree)
│   ├── scripts/              ← all 25 agent scripts
│   ├── agent_inbox/          ← drop tasks here
│   ├── agent_outbox/         ← completed tasks appear here
│   ├── corrections/          ← logged corrections for LoRA training
│   ├── docs/verified-flow.md ← how the 5-phase loop actually works
│   └── src/                  ← Next.js dashboard (localhost:3000)
├── CLAUDE.md                 ← master router
├── MEMORY.md                 ← cross-session memory index
├── rolling_summary.md        ← last 3 session summaries
├── CONTEXT.md                ← current project state
└── TERMINAL_GUIDE.md         ← this file
```

**Push ARES changes back to GitHub:**
```bash
cd ~/rank-higher-media
git subtree push --prefix=ares https://github.com/AshishUzelman/ashish-ares.git main
```
