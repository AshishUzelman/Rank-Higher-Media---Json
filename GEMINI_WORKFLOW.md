# Gemini + Auto-Pickup Workflow

**Goal:** Easy way to delegate work to Gemini when tokens run low, without waiting for Claude.

---

## Workflow

### Step 1: Describe Work

```bash
# You write what's needed in agent_inbox/task_XXX.json
cat > agent_inbox/task_article_list.json << 'EOF'
{
  "taskId": "article_list_component",
  "type": "code",
  "description": "Build ArticleList component showing articles from Firestore with pagination",
  "requirements": [
    "'use client' directive",
    "Fetch from Firestore collection 'articles'",
    "Display in grid with ArticleCard component",
    "Add pagination (10 per page)",
    "Tailwind dark theme (gray-800/700)"
  ],
  "output": "src/components/ArticleList.js",
  "Worker": "gemini-2.0-flash-001"
}
EOF
```

### Step 2: Auto-Pickup Runs Gemini

```bash
# In background terminal:
npm run auto-pickup

# Monitors agent_inbox/ every 30 seconds
# Finds task_article_list.json
# Calls agent_connector with Gemini routing
# Output appears in agent_outbox/task_article_list_complete.md
```

### Step 3: Review Output

```bash
# Check results
cat agent_outbox/task_article_list_complete.md

# If good → copy to src/components/ArticleList.js
# If bad → create new task with fixes, re-run
```

### Step 4: Test & Commit

```bash
npm run dev
# Test at http://localhost:3003

git add src/components/ArticleList.js
git commit -m "feat: Add ArticleList component"
```

---

## When to Use Gemini vs Claude

| Situation | Use | Why |
|-----------|-----|-----|
| **Tokens running low (80%+)** | Gemini | Save context for coordination |
| **Component building** | Gemini | Straightforward code tasks |
| **Bug fixes** | Gemini | Local reasoning sufficient |
| **New features** | Gemini | Good for implementation |
| **Architecture decisions** | Claude | Needs strategic thinking |
| **Debugging complex issues** | Claude | Needs context synthesis |
| **Integration challenges** | Claude | Needs cross-project knowledge |
| **Coordinating agents** | Claude | Needs meta-level planning |

---

## Template Task File

For repeatable work:

```json
{
  "taskId": "YYYY_MM_DD_component_name",
  "type": "code",
  "project": "ares",
  "description": "What to build, why, and where",
  "requirements": [
    "'use client' on hooks/browser APIs",
    "Tailwind dark theme",
    "Firestore integration",
    "Error boundaries for data fetching"
  ],
  "output": "src/components/ComponentName.js",
  "tags": ["component", "react", "firestore"],
  "Worker": "gemini-2.0-flash-001",
  "context": "Reference: src/components/ProjectCard.js for styling pattern. Schema: {id, name, ...}"
}
```

---

## Full Example: Add a New Dashboard Widget

**1. Write task:**
```bash
cat > agent_inbox/task_metrics_widget.json << 'EOF'
{
  "taskId": "metrics_widget_2026_04_15",
  "type": "code",
  "description": "Build MetricsWidget showing ARES stats: tasks completed, tokens used, avg response time",
  "requirements": [
    "'use client' for useState, useEffect",
    "Fetch from Firestore 'token_usage' collection",
    "Show cards: Total Tasks, Total Tokens, Avg Response Time",
    "Green/yellow/red indicators for status",
    "Responsive grid layout",
    "Tailwind dark theme"
  ],
  "output": "src/components/MetricsWidget.js",
  "Worker": "gemini-2.0-flash-001"
}
EOF
```

**2. Run auto-pickup:**
```bash
npm run auto-pickup
# Wait 2 minutes
```

**3. Copy output:**
```bash
cat agent_outbox/task_metrics_widget_complete.md | head -100
# Review code
# Copy to src/components/MetricsWidget.js
```

**4. Add to dashboard:**
Edit `src/app/dashboard/components/DashboardLayout.js`:
```javascript
import MetricsWidget from '@/components/MetricsWidget';

// In JSX:
{activeTab === 'metrics' && <MetricsWidget />}
```

**5. Test & commit:**
```bash
npm run dev
# Test at http://localhost:3003/dashboard
git add src/components/MetricsWidget.js src/app/dashboard/components/DashboardLayout.js
git commit -m "feat: Add MetricsWidget to dashboard"
```

---

## Troubleshooting

**"auto-pickup not finding tasks"**
- Check: `ls agent_inbox/*.json`
- Task file must be valid JSON
- Filename must match pattern `task_*.json`

**"Gemini output is incomplete"**
- Check: `cat agent_outbox/task_*.md`
- Look for `supervisor: REJECTED` messages
- Create new task with more specific requirements

**"Next.js reload stuck"**
- Kill: `lsof -i :3003` → `kill -9 PID`
- Restart: `npm run dev`

---

## How It Works Behind the Scenes

```
agent_inbox/task_*.json
    ↓
npm run auto-pickup (polls every 30s)
    ↓
agent_connector.js (reads Worker field)
    ↓
"Worker": "gemini-2.0-flash-001"
    ↓
Calls Gemini API with task requirements
    ↓
Gemini writes response to agent_outbox/task_*_complete.md
    ↓
You review & copy to src/
    ↓
git add + commit
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run auto-pickup` | Start monitoring (Ctrl+C to stop) |
| `npm run connector` | Single run (don't use with auto-pickup) |
| `npm run ares-status` | Check daemon status |
| `npm run dev` | Start Next.js dev server |
| `npm run seed` | Add test data to Firestore |
| `git add .` + `git commit` | Save your work |

---

**Works best when:** You have clear, well-defined tasks. Vague requirements → iterate with refinement tasks.

**Easier than:** Waiting for Claude token limit → manually switching context → doing the work yourself.

**Next level:** Add Claude review tasks (`"Worker": "claude-sonnet-4-6"`) to validate Gemini code before merging.
