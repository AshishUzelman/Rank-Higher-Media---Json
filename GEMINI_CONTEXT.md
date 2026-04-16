# Gemini Context — ARES Project

> Copy this file's content into Gemini when assigning work. Updates automatically.

## Active Projects

| Project | Path | Status | Firebase | Notes |
|---------|------|--------|----------|-------|
| **ARES Platform** | `~/rank-higher-media/ares/` | Active | `ashish-ares` | Main orchestration hub, agent system |
| **Ad Creator** | `~/ad-creator/` | Active | `ashish-ad-creator` | Canvas editor, creative tool |
| **Rank Higher Media** | `~/rank-higher-media/` | Active | `rank-high-media` | Marketing site |

---

## ARES Project Structure

```
~/rank-higher-media/ares/
├── src/
│   ├── app/dashboard/          # Dashboard pages
│   │   ├── page.js            # Main dashboard (Firestore listeners)
│   │   └── components/         # Dashboard components
│   │       ├── DashboardLayout.js
│   │       ├── ProjectCard.js
│   │       ├── TaskQueue.js
│   │       ├── AgentStatus.js
│   │       ├── BrainstormPanel.js
│   │       └── FileTree.js
│   └── components/             # Shared components
│       ├── ArticleCard.js      # Article display
│       ├── BookManager.js      # CRUD for books
│       └── SEOWidget.js        # SEO metrics
├── lib/firebase.js             # Firebase client init
├── agent_inbox/                # Task input (JSON files)
├── agent_outbox/               # Task output (markdown files)
├── scripts/
│   ├── agent_connector.js      # Main agent orchestrator
│   ├── ares_daemon.js          # Background service
│   ├── auto_task_pickup.js     # Continuous task processor
│   └── seed_firestore.mjs      # Test data generator
├── package.json                # npm scripts
├── .env.local                  # Firebase credentials (keep secret)
└── eslint.config.js            # Linting config
```

---

## Firestore Collections

| Collection | Purpose | Fields | Example |
|----------|---------|--------|---------|
| `projects` | ARES projects | name, client, status, updated | ARES Dashboard, Ad Creator |
| `agent_inbox` | Task input queue | taskId, type, description, status, Worker | code, review, research tasks |
| `agent_outbox` | Task results archive | output file path, status, supervisor decision | Complete tasks |
| `agent_state` | Agent status | status, model, currentTask, tokensUsed | qwen, gemma, claude |
| `brainstorm_history` | Debate results | topic, summary, participants, rounds, approved | ARES Architecture debate |
| `articles` | Content library | title, author, tags, publishedAt, summary | LLM Routing, Agent Systems |
| `books` | Book library | title, author, year, status | Designing Multi-Agent Systems |
| `seo_tool` | SEO metrics | keywords, backlinks, traffic, authority, topKeywords, insights | Live SEO data |

---

## How to Assign Work to Gemini

### 1. **Via Task File** (Automatic routing)

Create a JSON file in `agent_inbox/` with `"Worker": "gemini-2.0-flash-001"`:

```json
{
  "taskId": "ui_component_2026_04_15",
  "type": "code",
  "description": "Build React component for dashboard",
  "Worker": "gemini-2.0-flash-001",
  "requirements": ["'use client'", "Tailwind styling", "Firestore integration"],
  "output": "src/components/ComponentName.js"
}
```

Then: `npm run auto-pickup`

Gemini result appears in `agent_outbox/task_*.md`

### 2. **Via Gemini App** (Manual)

Paste this context + your task into Gemini:

**Prompt template:**
```
I'm working on the ARES project at ~/rank-higher-media/ares/.
Project structure: [paste ARES Project Structure section above]
Firestore collections: [paste table above]

Task: [your specific task]

File to modify/create: [path]
Tech stack: Next.js 16, Tailwind 4, Firebase Web SDK v12, JavaScript only
Rules: - 'use client' on components with hooks - No TypeScript - Full file content only
```

---

## Key Npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js dev server (port 3003) |
| `npm run ares-start` | Start agent daemon |
| `npm run ares-stop` | Stop agent daemon |
| `npm run auto-pickup` | Monitor inbox, run connector continuously |
| `npm run connector` | Single connector run (manual) |
| `npm run seed` | Add test data to Firestore |

---

## API Keys & Credentials

| Service | Location | Status |
|---------|----------|--------|
| Firebase (ashish-ares) | `.env.local` | ✅ Filled |
| Gemini | [Your API key] | Setup needed |
| Ollama (local LLMs) | localhost:11434 | ✅ Running |

---

## Current Priorities

1. ✅ Dashboard scaffold complete (page + 7 components)
2. ✅ Firestore seed script created
3. **Next:** Gemini integration for coding tasks when Claude hits token limits
4. Fix dashboard loading issue (Firebase initialization)
5. Add brainstorm debate history panel

---

## Recent Commits

```
5118d18 feat: Add Firestore seed script for test data
d350668 fix: Add eslint.config.js for linting support
54ac324 feat: Add auto-task-pickup script for continuous task processing
1a78e5c feat: Add ArticleCard, BookManager, SEOWidget components
800c9f1 feat: ARES dashboard scaffold (page, layout, ProjectCard, TaskQueue, AgentStatus, BrainstormPanel, FileTree)
```

---

## Gemini API Setup (Optional)

If you want automatic routing to Gemini via task files:

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set `GEMINI_API_KEY` in `.env.local`
3. Update `agent_connector.js` to support `Worker: gemini-2.0-flash-001`

---

**Last updated:** 2026-04-15 | **Updated by:** Claude | **Next review:** When Gemini integration complete
