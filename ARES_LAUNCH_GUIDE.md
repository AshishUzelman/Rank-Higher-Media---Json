# ARES Platform — Standalone Launch Guide
**Use this without Claude. Copy-paste the commands exactly.**

---

## Prerequisites Check
```bash
# Verify Ollama is running
ollama list | grep -E "qwen3|gemma3"

# Expected output:
# qwen3:30b-a3b     30b    f1234...  4.1 GB
# gemma3:12b        12b    a5678...  7.2 GB
```

If models missing:
```bash
ollama pull qwen3:30b-a3b
ollama pull gemma3:12b
```

---

## 1. Start Ollama (if not running)
```bash
ollama serve
# Keep this terminal open — Ollama runs in background
```

---

## 2. Launch ARES Dashboard (new terminal)
```bash
cd ~/rank-higher-media/ares
npm run dev
# Dashboard at http://localhost:3000
```

---

## 3. Start Agent Connector Loop (new terminal)
```bash
cd ~/rank-higher-media/ares
npm run connector
# Watches agent_inbox/ for tasks, routes to qwen3/gemma3
```

---

## 4. Trigger a Brainstorm (new terminal)
```bash
cd ~/rank-higher-media
npm run brainstorm -- "Your topic here" --project ares
```

**Output locations:**
- Debate history: `ares/agent_outbox/debates/`
- Task log: `ares/agent_inbox/tasks.json`
- Firestore live: Dashboard at http://localhost:3000 → AgentStatus widget

---

## 5. Monitor Status

### Dashboard widgets (live Firestore):
- **AgentStatus**: qwen3 (Worker) + gemma3 (Supervisor) state
- **TaskQueue**: pending → in-progress → completed
- **TokenUsage**: model burn by task type
- **MemoryState**: last Drive backup timestamp

### CLI monitoring:
```bash
# Check task queue
cat ~/rank-higher-media/ares/agent_inbox/tasks.json | jq '.tasks[] | {id, status, model}'

# Watch outbox debates (realtime)
tail -f ~/rank-higher-media/ares/agent_outbox/debates/*.json

# Check Firestore backup status
grep "lastDriveSave" ~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/CONTEXT.md
```

---

## 6. Emergency Shutdown
```bash
# Stop all processes
pkill -f "npm run ares"
pkill -f "npm run connector"
pkill -f "npm run brainstorm"

# Verify cleanup
lsof -i :3000  # Should return nothing
```

---

## 7. Troubleshooting

### Ollama not responding
```bash
# Kill and restart
pkill ollama
sleep 2
ollama serve
```

### Tasks stuck in inbox
```bash
# Check agent_connector.js logs
cat ~/.pm2/logs/ares-connector-error.log | tail -50
```

### Firestore backup failed
```bash
# Manual backup to Drive
node ~/rank-higher-media/ares/scripts/save_to_drive.js
```

---

## 8. Token Optimization Settings

Set environment variables before running:

```bash
# Use Gemma for lightweight tasks (saves ~35% token cost)
export SUPERVISOR_MODEL="gemma3:12b"
export WORKER_MODEL="qwen3:30b-a3b"

# Swap to higher Qwen model if needed (more expensive)
export WORKER_MODEL="qwen3:32b"

# Run dashboard
npm run dev
```

---

## Key Files (don't edit without Claude)
- `ares/agent_connector.js` — router logic
- `ares/src/components/Dashboard.js` — live widgets
- `ares/src/lib/firestore.js` — Firestore SDK config
- `ares/.env.local` — Firebase credentials (keep secure)

---

## When to Escalate to Claude
- New task types to add
- Model swapping (qwen→claude)
- Firebase schema changes
- Dashboard widget changes
- Memory file structure changes

Otherwise: **You can operate ARES independently using this guide.**
