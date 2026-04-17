# ARES Platform — Complete Project Briefing for Opus 4.7

**Date:** 2026-04-16 | **Status:** Active development | **Location:** `~/rank-higher-media/ares/`

---

## Executive Summary

ARES is a multi-agent orchestration platform built on Next.js 16 + Tailwind 4 + Firebase Web SDK v12. It runs a local LLM ensemble (Ollama: qwen3:30b-a3b for Worker, gemma3:12b for Supervisor/Critic) and coordinates AI tasks through an actor-critic loop.

**Current Maturity:**
- ✅ Dashboard UI: 90% complete (4 live Firestore widgets rendering)
- ✅ Agent core system: Functional (task inbox/outbox, connector routing)
- ✅ Local LLM integration: Ollama working, qwen3 + gemma3 models loaded
- ✅ Brainstorm subsystem: Complete (debate engine, skill hooks)
- 🔄 **In Progress:** Firestore schema expansion (missing 4 collections)
- ❌ **Not Started:** Natural language interface, dashboard analytics panel

**The Ask:** Opus is being given this briefing to design/implement missing components while Claude handles strategy-layer decisions.

---

## Project Structure

```
~/rank-higher-media/ares/
├── .git/                          # Separate repo (not under RHM main repo)
├── .env.local                     # ✅ Fully populated (all 7 Firebase credentials)
├── .next/                         # Build cache
├── node_modules/
├── public/                        # Static assets
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout
│   │   ├── page.js                # Home/dashboard page
│   │   ├── api/
│   │   │   ├── brainstorm/        # Brainstorm engine endpoints
│   │   │   │   ├── route.js       # Main brainstorm handler
│   │   │   │   ├── supervisor.js  # Supervisor review logic
│   │   │   │   └── synthesizer.js # Multi-model synthesis
│   │   │   └── agent/
│   │   │       ├── connector.js   # 🔑 CORE: task router → Ollama worker
│   │   │       ├── inbox.js       # Read tasks from agent_inbox/
│   │   │       └── outbox.js      # Write results to agent_outbox/
│   │   └── dashboard/
│   │       ├── page.js            # Main dashboard
│   │       └── widgets/
│   │           ├── AgentStatus.jsx     # Agent health/status live widget
│   │           ├── TaskQueue.jsx       # Pending tasks queue
│   │           ├── TokenUsage.jsx      # LLM token consumption tracking
│   │           └── MemoryState.jsx     # Agent memory state viewer
│   ├── components/
│   │   ├── BrainstormPanel.jsx         # Brainstorm UI component
│   │   ├── TaskBuilder.jsx             # Create new tasks
│   │   └── DebugConsole.jsx            # Agent logs + output viewer
│   ├── lib/
│   │   ├── firebase.js                 # Firebase init + guard (hasConfig check)
│   │   ├── firestore.js                # Firestore helpers + listeners
│   │   ├── ollama.js                   # Ollama API client (qwen3, gemma3)
│   │   └── agent_context.js            # Context packet builder (soul files + memory)
│   ├── hooks/
│   │   ├── useFirestore.js             # Real-time Firestore listeners
│   │   ├── useOllama.js                # Local LLM calls (never in render phase)
│   │   └── useAgentStatus.js           # Poll agent status + task queue
│   ├── styles/
│   │   └── globals.css                 # Tailwind 4 + custom theming
│   └── utils/
│       ├── agent_inbox/                # 📁 Task input folder (for agent to watch)
│       ├── agent_outbox/               # 📁 Task output folder (agent writes results here)
│       └── knowledge/                  # 📁 Knowledge base folder (KNOWLEDGE_ROOT)
├── scripts/
│   ├── ares_daemon.js             # npm run ares-start/stop/status — spawn/kill connector
│   └── save_to_drive.js            # Firestore backup → Drive (OAuth pending)
├── package.json                   # Dependencies + npm run commands
├── tailwind.config.js             # Tailwind 4 config
├── next.config.js                 # Next.js config
└── BRIEF.md                       # Project brief (design, goals, tech stack)
```

### Key Locations by Function

| Function | Location | Status |
|----------|----------|--------|
| **Dashboard UI** | `src/app/page.js` + `src/components/` | ✅ 90% done |
| **Agent routing** | `src/app/api/agent/connector.js` | ✅ Working |
| **Task inbox** | `src/utils/agent_inbox/` | ✅ Connector watches |
| **Task outbox** | `src/utils/agent_outbox/` | ✅ Connector writes |
| **Ollama client** | `src/lib/ollama.js` | ✅ Functional |
| **Firestore schema** | Collections in Firebase console | 🔄 See below |
| **Brainstorm engine** | `src/app/api/brainstorm/` | ✅ Complete |
| **Daemon control** | `scripts/ares_daemon.js` | ✅ Works |
| **Drive backup** | `scripts/save_to_drive.js` | 🔄 OAuth pending |

---

## Firestore Schema

### ✅ Already Implemented

#### 1. **tasks** (Collection)
```
tasks/{taskId}/
  ├── id: string (auto)
  ├── type: "code" | "review" | "research" | "summary" | "debate" | "agentic" | "general"
  ├── status: "pending" | "in_progress" | "completed" | "failed"
  ├── content: string (prompt/task description)
  ├── assignedTo: string (claude | qwen3 | gemma3)
  ├── createdAt: timestamp
  ├── completedAt: timestamp (null until done)
  ├── result: string (null until completed)
  ├── tokens: { input: number, output: number }
  └── metadata: object (arbitrary key-value)
```

#### 2. **agent_state** (Collection)
```
agent_state/{agentId}/
  ├── id: string (qwen3 | gemma3 | supervisor)
  ├── status: "idle" | "busy" | "error"
  ├── lastHeartbeat: timestamp
  ├── currentTask: string (taskId or null)
  ├── errorMessage: string (null if healthy)
  ├── model: string (model name)
  └── metadata: object (version, uptime, etc)
```

#### 3. **token_usage** (Collection)
```
token_usage/{date}/
  ├── date: string (YYYY-MM-DD)
  ├── qwen3: { input: number, output: number, cost: number }
  ├── gemma3: { input: number, output: number, cost: number }
  ├── total: { input: number, output: number, cost: number }
  └── timestamp: timestamp
```

#### 4. **memory** (Collection)
```
memory/{type}/{key}/
  ├── type: "user" | "feedback" | "project" | "reference"
  ├── content: string (markdown)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── tags: array[string]
  └── embedding: array[number] (future: for vector search)
```

### 🔄 Missing (To Be Implemented)

These 4 collections are designed but not yet in Firestore. **Priority for Opus:**

#### 5. **articles** (Collection)
```
articles/{articleId}/
  ├── id: string (auto)
  ├── title: string
  ├── slug: string
  ├── content: string (markdown)
  ├── metadata: {
  │   ├── author: string
  │   ├── keywords: array[string]
  │   ├── wordCount: number
  │   ├── readTime: number (minutes)
  │   └── seoScore: number (0-100)
  │ }
  ├── status: "draft" | "published" | "archived"
  ├── createdAt: timestamp
  ├── publishedAt: timestamp (null if draft)
  ├── updatedAt: timestamp
  ├── tags: array[string]
  ├── relatedArticles: array[articleId]
  └── analytics: {
      ├── views: number
      ├── engagement: number
      └── lastViewed: timestamp
    }
```

#### 6. **books** (Collection)
```
books/{bookId}/
  ├── id: string (auto)
  ├── title: string
  ├── author: string
  ├── isbn: string
  ├── content: string (full text or chapters)
  ├── metadata: {
  │   ├── pages: number
  │   ├── published: date
  │   ├── publisher: string
  │   └── category: string
  │ }
  ├── chapters: array[{
  │   ├── number: number
  │   ├── title: string
  │   ├── content: string
  │   └── notes: string
  │ }]
  ├── annotations: array[{
  │   ├── pageNumber: number
  │   ├── highlight: string
  │   ├── note: string
  │   └── timestamp: timestamp
  │ }]
  └── status: "reading" | "completed" | "archived"
```

#### 7. **seo_tool** (Collection)
```
seo_tool/{toolId}/
  ├── id: string (auto)
  ├── name: string
  ├── type: "keyword_research" | "rank_tracking" | "backlink_analysis" | "competitor_intel"
  ├── lastRun: timestamp
  ├── data: {
  │   ├── keywords: array[{ keyword, volume, difficulty, intent }]
  │   ├── rankings: array[{ keyword, position, url, ctr }]
  │   ├── backlinks: array[{ domain, authority, anchor }]
  │   └── competitors: array[{ domain, traffic, topKeywords }]
  │ }
  ├── settings: {
  │   ├── targetKeywords: array[string]
  │   ├── competitors: array[string]
  │   └── updateFrequency: string (hourly | daily | weekly)
  │ }
  └── status: "active" | "paused" | "archived"
```

#### 8. **projects** (Collection)
```
projects/{projectId}/
  ├── id: string (auto)
  ├── name: string
  ├── status: "active" | "in_progress" | "paused" | "completed"
  ├── description: string
  ├── owner: string (user email)
  ├── createdAt: timestamp
  ├── deadline: timestamp (nullable)
  ├── tasks: array[taskId] (references to tasks collection)
  ├── metadata: {
  │   ├── priority: "p0" | "p1" | "p2" | "p3"
  │   ├── budget: number
  │   ├── spent: number
  │   └── team: array[string] (emails)
  │ }
  └── milestones: array[{
      ├── title: string
      ├── dueDate: timestamp
      ├── status: "pending" | "complete"
      └── tasks: array[taskId]
    }]
```

---

## Agent Architecture

### Component Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Dashboard (UI)                         │
│  AgentStatus | TaskQueue | TokenUsage | MemoryState     │
└──────────────────────┬──────────────────────────────────┘
                       │ (reads from Firestore)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Firestore Collections                       │
│  tasks | agent_state | token_usage | memory | articles  │
│  books | seo_tool | projects                            │
└──────────────────────┬──────────────────────────────────┘
                       │ (connector polls)
                       ▼
┌─────────────────────────────────────────────────────────┐
│          agent_connector.js (Router)                     │
│  • Polls agent_inbox/ for new tasks                      │
│  • Routes by taskType & assignedTo                       │
│  • Calls Ollama (qwen3 for Worker, gemma3 for Critic)   │
│  • Writes results → agent_outbox/                        │
│  • Updates Firestore collections                         │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   ┌─────────────┐          ┌──────────────┐
   │  qwen3:30b  │          │ gemma3:12b   │
   │  (Worker)   │          │ (Supervisor) │
   │  Ollama     │          │ Ollama       │
   └─────────────┘          └──────────────┘
```

### Task Lifecycle

1. **Create:** Task written to `agent_inbox/{taskId}.json` or via `/api/agent/tasks` (POST)
2. **Route:** `connector.js` detects task, reads taskType + assignedTo
3. **Execute:** Calls appropriate Ollama model with full context packet (soul files + memory)
4. **Review:** If type="agentic", gemma3 critiques qwen3 output (actor-critic loop)
5. **Commit:** Results written to `agent_outbox/{taskId}.json`
6. **Sync:** Firestore collections updated automatically
7. **Display:** Dashboard reflects new state in real-time

### Key Files — Agent System

| File | Purpose | Status |
|------|---------|--------|
| `src/app/api/agent/connector.js` | 🔑 Core router — spawned by daemon | ✅ Working |
| `src/app/api/agent/inbox.js` | Polls `agent_inbox/` folder | ✅ Working |
| `src/app/api/agent/outbox.js` | Writes `agent_outbox/` folder | ✅ Working |
| `src/lib/ollama.js` | Ollama API client (qwen3, gemma3) | ✅ Working |
| `src/lib/agent_context.js` | Builds context packet | ✅ Working |
| `scripts/ares_daemon.js` | Spawn/kill connector process | ✅ Working |

---

## Running ARES

### Prerequisites

```bash
# Ollama must be running with these models pulled
ollama pull qwen3:30b-a3b     # Worker model (128K context)
ollama pull gemma3:12b        # Supervisor/Critic model
ollama serve                  # Start Ollama server on localhost:11434
```

### Dev Server

```bash
cd ~/rank-higher-media/ares/
npm run dev                   # Start Next.js dev server (localhost:3000)
npm run ares-start            # In another terminal: spawn connector daemon
npm run brainstorm -- "topic" # Test brainstorm engine (from RHM root)
npm run ares-status           # Check connector status
```

### Production

```bash
npm run build                 # Build Next.js
npm start                     # Start production server
npm run ares-start            # Spawn connector daemon
```

### Scripts

```bash
npm run ares-start            # Start connector daemon
npm run ares-stop             # Kill connector daemon
npm run ares-status           # Show connector PID + status
npm run connector             # Manual connector run (debug mode)
npm run brainstorm -- "topic" # Run brainstorm debate engine (DEPRECATED — use skill)
npm run save-backup           # Firestore → Drive backup (OAuth pending)
```

---

## Current Gaps & Blockers

### 🔴 Critical

1. **Missing Firestore collections (4 total):** articles, books, seo_tool, projects
   - Design done (see schema above)
   - Implementation: Create collection via Firebase console OR programmatic setup
   - **Task for Opus:** Implement Firestore setup script + update dashboard widgets

2. **Drive OAuth pending:** `scripts/save_to_drive.js` works but needs credentials.json
   - Folder ID: `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`
   - Requires: OAuth 2.0 service account from GCP
   - **Status:** Blocked on Firebase setup

### 🟡 Medium Priority

1. **Natural language task interface:** Currently tasks are created via JSON/API only
   - Design exists but not built
   - **Next:** Build `/api/agent/ask` endpoint (convert natural language → task)

2. **Dashboard analytics panel:** Brainstorm debate history not displayed
   - Widgets render but no historical timeline
   - **Next:** Add analytics panel to dashboard (TokenUsage trends, task success rate, etc)

3. **SUPERVISOR_MODEL upgrade:** Currently gemma3:12b, should run gemma3:27b-it-qat
   - Requires: `ollama pull gemma3:27b-it-qat`
   - **Status:** Ready but not pulled locally yet

### 🔵 Low Priority

1. **ESLint hook:** Pre-existing issue — ARES missing eslint.config.js
   - Post-tool-use hook complains but doesn't block
   - **Fix:** Add eslint.config.js to ARES root (copy from RHM if needed)

2. **Firestore SDK v12 gotchas:** Firebase 12 has stricter initialization
   - Already guarded in `src/lib/firebase.js` with hasConfig check
   - **Status:** Documented, no action needed

---

## Environment Variables (.env.local)

All 7 credentials populated as of 2026-04-07:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ashish-ares
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<id>
NEXT_PUBLIC_FIREBASE_APP_ID=<id>
NEXT_PUBLIC_FIREBASE_DATABASE_URL=<url>

# Ollama config
OLLAMA_BASE_URL=http://localhost:11434
WORKER_MODEL=qwen3:30b-a3b
SUPERVISOR_MODEL=gemma3:12b

# Optional
GEMMA_CLOUD_MODEL=gemini-2.0-flash-thinking (for SYNTHESIZER_USE_CLOUD=1)
```

---

## Key Design Decisions

### Why Ollama + Local LLMs?

- **Token budget:** ARES work limited to Qwen + Gemma; Claude reserved for strategy
- **Cost:** Local inference ~$0 vs. Claude API ~$0.01/1K tokens
- **Privacy:** All agent data stays local (no external API calls)
- **Speed:** Ollama on M1 Mac: qwen3 draft ~5-10s, gemma3 review ~3-5s

### Why Actor-Critic Loop?

- **Quality:** qwen3 drafts → gemma3 critiques → qwen3 revises (2 turns max)
- **Autonomy:** Supervisor pattern (gemma3) reviews and approves/rejects, escalates to Claude on deadlock
- **Learning:** Every debate loop is logged to Firestore for analysis

### Why Task Files + Firestore?

- **Decoupling:** Connector doesn't need HTTP; watches folder + writes results
- **Auditability:** All task I/O is file-based (auditable, version-controllable)
- **Sync:** Firestore collections auto-sync to dashboard in real-time via listeners

---

## Handoff Checklist for Opus

**Before Opus starts work:**

- [ ] Read this entire document
- [ ] Verify local Ollama is running: `curl http://localhost:11434/api/tags`
- [ ] Verify .env.local is populated (all 7 Firebase credentials)
- [ ] Run `npm install` in ~/rank-higher-media/ares/
- [ ] Run `npm run dev` and verify dashboard loads on localhost:3000
- [ ] Run `npm run ares-start` and verify connector spawns (check logs)
- [ ] Test dashboard widgets (AgentStatus, TaskQueue, etc should show data)

**Opus's primary tasks:**

1. **Implement 4 missing Firestore collections** (articles, books, seo_tool, projects)
   - Create via Firebase console OR programmatic setup
   - Build Firestore listeners for dashboard widgets
   - Add collection-specific React components

2. **Build dashboard widgets for new collections**
   - ArticleCard (display articles, edit/delete)
   - BookManager (track reading progress, annotations)
   - SEOWidget (show keyword rankings, competitor data)
   - ProjectManager (task list, milestones, team)

3. **Implement natural language task interface**
   - `/api/agent/ask` endpoint (convert "do X" → task JSON)
   - Hook into existing connector + actor-critic loop

4. **Add dashboard analytics panel**
   - Brainstorm debate history timeline
   - Token usage trends (daily/weekly/monthly)
   - Task success rates + error logs

**Claude's role (strategy layer):**

- Review Opus's implementations
- Route complex architectural decisions
- Integrate ARES with other projects (Ad Creator, RHM site, etc)
- Manage agent delegation (decide what tasks → qwen3 vs gemma3 vs Claude)

---

## Links & References

| Resource | Location | Purpose |
|----------|----------|---------|
| BRIEF.md | `~/rank-higher-media/ares/BRIEF.md` | Design + goals |
| Firebase Console | https://console.firebase.google.com/ | Firestore, Auth, Storage |
| Ollama Docs | https://ollama.ai/ | Local LLM setup |
| GitHub Repo | https://github.com/AshishUzelman/ashish-ares | Version control |
| MEMORY.md | `~/rank-higher-media/MEMORY.md` | Cross-project context |
| Agent System Bugs | `~/rank-higher-media/project_ares_agent_system.md` | Known issues + fixes |

---

## Quick Debug Commands

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check connector process
ps aux | grep connector

# View agent inbox
ls -la ~/rank-higher-media/ares/src/utils/agent_inbox/

# View agent outbox
ls -la ~/rank-higher-media/ares/src/utils/agent_outbox/

# Tail Firestore logs (requires Firebase CLI)
firebase functions:log --only connector

# Manual task creation (for testing)
curl -X POST http://localhost:3000/api/agent/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "content": "Write a hello world script",
    "assignedTo": "qwen3"
  }'
```

---

## Session State References

**Always load at session start:**
- `~/rank-higher-media/SOUL_BASE.md` — Core principles
- `~/rank-higher-media/SOUL_ARES.md` — ARES-specific architecture
- `~/rank-higher-media/CONTEXT.md` — Live project state
- `~/rank-higher-media/PROJECT_STATUS.md` — Tiered milestones

**End of session:**
- Upload memory files to Drive folder: `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`
- Update `PROJECT_STATUS.md` daily section
- Update `rolling_summary.md` with session summary

---

**Version:** 1.0 | **Last Updated:** 2026-04-16 | **Author:** Ashish Uzelman | **For:** Opus 4.7
