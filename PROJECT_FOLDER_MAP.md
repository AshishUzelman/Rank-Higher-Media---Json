# Project Folder Map — Complete Directory Guide

**Last Updated:** 2026-04-16 | **Primary Account:** ashish.uzelman@gmail.com

Quick reference for finding projects, files, configs, and backups across all active work.

---

## Local Projects (~/...)

### 1. Rank Higher Media (RHM) — Marketing Hub
**Location:** `~/rank-higher-media/`  
**GitHub:** Rank-Higher-Media---Json  
**Firebase Project:** rank-high-media  
**Status:** 🟢 Active  

```
~/rank-higher-media/
├── .git/                              # Main repo (RHM hub)
├── .env.local                         # ✅ Firebase + API keys (all 7 credentials)
├── src/
│   ├── app/                          # Next.js 15 App Router
│   ├── components/
│   ├── lib/
│   └── styles/
├── public/                            # Static assets (logos, images)
├── scripts/
│   ├── ares_daemon.js                # Spawn/kill ARES connector
│   ├── save_to_drive.js              # Firestore → Drive backup
│   └── [other RHM scripts]
├── ares/                             # 🔑 ARES platform (separate .git)
│   ├── .git/                         # SEPARATE repo: ashish-ares
│   ├── .env.local                    # ✅ Firebase ashish-ares credentials
│   ├── src/
│   │   ├── app/
│   │   ├── api/agent/               # Connector, inbox, outbox
│   │   ├── api/brainstorm/          # Brainstorm engine
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── utils/
│   │   │   ├── agent_inbox/         # 📁 Task input folder
│   │   │   ├── agent_outbox/        # 📁 Task output folder
│   │   │   └── knowledge/           # 📁 Knowledge base (KNOWLEDGE_ROOT)
│   │   └── styles/
│   ├── scripts/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── BRIEF.md                      # ARES design doc
│   └── node_modules/
├── projects/                         # Project-specific docs
│   ├── ad-creator/
│   │   └── BRIEF.md                 # Ad Creator design doc
│   └── [other project briefs]
├── CLAUDE.md                         # 🔑 Master router (this file)
├── SOUL_BASE.md                      # Core principles + LLM routing
├── SOUL_ARES.md                      # ARES architecture deep-dive
├── SOUL.md                           # Working style + build philosophy
├── CONTEXT.md                        # Live project state (always current)
├── PROJECT_STATUS.md                 # Tiered milestones (daily/weekly/monthly)
├── rolling_summary.md                # Last 3 session summaries
├── permanent.json                    # Agency facts + client data
├── client_override.json              # Client-specific settings
├── MEMORY.md                         # Memory file index (auto-loaded)
├── ARES_HANDOFF.md                   # Complete ARES briefing for Opus
├── PROJECT_FOLDER_MAP.md             # 👈 You are here
├── package.json                      # RHM dependencies
├── tailwind.config.js                # RHM Tailwind config
├── next.config.js                    # RHM Next.js config
└── node_modules/
```

**Key Files in RHM Root:**
- `CLAUDE.md` → Master router (project registry, shared conventions, account info)
- `SOUL_BASE.md` → LLM routing rules, behavioral protocols
- `SOUL_ARES.md` → ARES agent architecture, tier definitions
- `SOUL.md` → Personal working style, preferences
- `CONTEXT.md` → **ALWAYS CURRENT** — live session state
- `PROJECT_STATUS.md` → Milestone tracking (daily/weekly/monthly)
- `rolling_summary.md` → Last 3 session summaries (archive to Drive)
- `MEMORY.md` → Index of all memory files (auto-loaded at session start)
- `permanent.json` → Agency facts, client details (Centre Willow, Goldwater Law)

**Memory Files (also in ~/rank-higher-media/):**
All memory files live in `~/rank-higher-media/` (not in a subdir) and are indexed in MEMORY.md:

```
~/rank-higher-media/
├── MEMORY.md                                    # 🔑 Index file (load this first)
├── user_hardware.md                            # M1 Mac specs, SSD plans
├── feedback_defer_to_claude.md                 # Own technical decisions
├── feedback_token_planning.md                  # Split work across sessions
├── feedback_local_model_delegation.md          # Use Qwen+Gemma for ARES only
├── guide_using_local_agents_for_ares.md        # Step-by-step agent delegation
├── project_ollama_llm_routing.md               # Full architecture + 4-phase plan
├── project_ash_code.md                         # Personal Claude Code fork design
├── project_ares_agent_system.md                # Model roster, hooks, known issues
├── project_skill_builder.md                    # Skill factory pipeline
├── project_architecture_vision.md              # ARES as central brain
├── project_intelligence_roadmap.md             # Actor-Critic → YouTube → KB → Dreaming
├── project_ash_code_strategic.md               # Karpathy KB integration, token budget
├── project_karpathy_guidelines.md              # Four principles (merged into CLAUDE.md)
├── reference_google_opal.md                    # Opal 3-track plan + video links
└── [other topic-specific memory files]
```

---

### 2. ARES Platform — Multi-Agent Orchestration
**Location:** `~/rank-higher-media/ares/`  
**GitHub:** ashish-ares  
**Firebase Project:** ashish-ares  
**Status:** 🟡 Active Development  
**Parent Repo:** Rank Higher Media (but separate .git inside)

```
~/rank-higher-media/ares/
├── .git/                              # 🔑 SEPARATE Git repo (ashish-ares)
├── .env.local                         # ✅ ashish-ares Firebase credentials
├── src/
│   ├── app/
│   │   ├── page.js                   # Dashboard home
│   │   ├── layout.js                 # Root layout
│   │   ├── api/
│   │   │   ├── agent/
│   │   │   │   ├── connector.js      # 🔑 Task router → Ollama
│   │   │   │   ├── inbox.js          # Read from agent_inbox/
│   │   │   │   └── outbox.js         # Write to agent_outbox/
│   │   │   └── brainstorm/
│   │   │       ├── route.js          # Brainstorm handler
│   │   │       ├── supervisor.js     # Supervisor review logic
│   │   │       └── synthesizer.js    # Multi-model synthesis
│   │   └── dashboard/
│   │       ├── page.js               # Dashboard page
│   │       └── widgets/
│   │           ├── AgentStatus.jsx   # Agent health/status
│   │           ├── TaskQueue.jsx     # Pending tasks
│   │           ├── TokenUsage.jsx    # LLM token tracking
│   │           └── MemoryState.jsx   # Agent memory viewer
│   ├── components/
│   │   ├── BrainstormPanel.jsx       # Brainstorm UI
│   │   ├── TaskBuilder.jsx           # Create new tasks
│   │   └── DebugConsole.jsx          # Agent logs viewer
│   ├── lib/
│   │   ├── firebase.js               # Firebase init + guard
│   │   ├── firestore.js              # Firestore helpers
│   │   ├── ollama.js                 # Ollama API client
│   │   └── agent_context.js          # Context packet builder
│   ├── hooks/
│   │   ├── useFirestore.js           # Real-time listeners
│   │   ├── useOllama.js              # LLM calls (safe for hooks)
│   │   └── useAgentStatus.js         # Agent status polling
│   ├── utils/
│   │   ├── agent_inbox/              # 📁 Task input (connector watches)
│   │   ├── agent_outbox/             # 📁 Task output (connector writes)
│   │   └── knowledge/                # 📁 Knowledge base (KNOWLEDGE_ROOT)
│   └── styles/
│       └── globals.css               # Tailwind 4 + theming
├── scripts/
│   ├── ares_daemon.js                # Spawn/kill connector (from RHM root)
│   └── save_to_drive.js              # Firestore → Drive backup
├── package.json                      # ARES dependencies
├── tailwind.config.js                # Tailwind 4 config
├── next.config.js                    # Next.js 16 config
├── BRIEF.md                          # ARES design doc
└── node_modules/
```

**Key Firestore Collections (ashish-ares):**
- `tasks/` — Task definitions (code, review, research, etc)
- `agent_state/` — Agent health (qwen3, gemma3, supervisor)
- `token_usage/` — Daily token consumption tracking
- `memory/` — Agent memory (user, feedback, project, reference)
- `articles/` — 🔄 Missing (to be implemented)
- `books/` — 🔄 Missing (to be implemented)
- `seo_tool/` — 🔄 Missing (to be implemented)
- `projects/` — 🔄 Missing (to be implemented)

**How to Access:**
```bash
cd ~/rank-higher-media/ares/
npm run dev                          # Start Next.js dev server
npm run ares-start                   # Spawn connector daemon
npm run ares-status                  # Check connector PID
npm run brainstorm -- "topic"        # Test brainstorm engine
```

---

### 3. Ad Creator — Canvas-Based Creative Tool
**Location:** `~/ad-creator/`  
**GitHub:** ashish-ad-creator  
**Firebase Project:** ashish-ad-creator  
**Status:** 🟡 In Progress  
**Deploy:** Vercel (NOT Firebase Hosting)

```
~/ad-creator/
├── .git/                             # ashish-ad-creator repo
├── .env.local                        # ✅ ashish-ad-creator Firebase credentials
├── src/
│   ├── app/
│   │   ├── page.js                  # Home/dashboard
│   │   ├── layout.js
│   │   ├── editor/
│   │   │   └── page.js              # Canvas editor
│   │   ├── api/
│   │   └── auth/
│   ├── components/
│   │   ├── Canvas/
│   │   ├── Editor/
│   │   └── UI/
│   ├── lib/
│   ├── hooks/
│   └── styles/
├── public/
├── scripts/
├── package.json
├── tailwind.config.js
├── next.config.js
├── BRIEF.md                         # Ad Creator design doc
└── node_modules/
```

**Key Files:**
- `BRIEF.md` → Design, goals, feature set
- `.env.local` → All 7 Firebase credentials filled

**How to Access:**
```bash
cd ~/ad-creator/
npm install                          # First time only
npm run dev                          # Start dev server (localhost:3000)
npm run build                        # Build for Vercel
```

---

### 4. Skills Library — Custom Claude Code Skills
**Location:** `~/ashish-skills/`  
**GitHub:** ashish-skills (private)  
**Status:** 🟢 Active  

```
~/ashish-skills/
├── .git/                            # ashish-skills repo
├── skills/
│   ├── skill-builder/              # Sub-system 1: Create new skills
│   ├── seo-audit-workflow/         # 4-agent SEO audit
│   ├── seo-content-strategy/       # Phased content plans
│   ├── keyword-research/           # Keyword intent modeling
│   ├── competitive-intel/          # Competitive analysis
│   ├── client-seo-report/          # Client-ready reports
│   ├── youtube-agent/              # Video breakdown + extraction
│   ├── agent-teams/                # Multi-agent teams
│   ├── strategic-analysis/         # SWOT, PESTEL, etc
│   ├── strategic-intake/           # Client onboarding agent
│   └── [more skills]
├── README.md                        # Skills registry
├── package.json
└── [skill configs]
```

**Status:** 11 skills total (Sub-system 1 complete) | Next: Data Scraper / Ingestor (Sub-system 2)

**How to Access:**
All skills are auto-discovered when Claude Code loads. Use `Skill` tool to invoke them.

---

## Environment Files (.env.local)

All `.env.local` files are **NOT checked into Git** (in .gitignore). Each project has its own.

| Project | Location | Status | Credentials |
|---------|----------|--------|-------------|
| RHM (rank-high-media) | `~/rank-higher-media/.env.local` | ✅ Filled | All 7 Firebase |
| ARES (ashish-ares) | `~/rank-higher-media/ares/.env.local` | ✅ Filled | All 7 Firebase + Ollama config |
| Ad Creator (ashish-ad-creator) | `~/ad-creator/.env.local` | ✅ Filled | All 7 Firebase |
| Mind Challenger AI | `~/[mindchallengeai]/.env.local` | TBD | TBD |

**Firebase Credentials (Required for all projects):**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
```

**ARES-Specific:**
```
OLLAMA_BASE_URL=http://localhost:11434
WORKER_MODEL=qwen3:30b-a3b
SUPERVISOR_MODEL=gemma3:12b
```

---

## GitHub Repositories

**Account:** AshishUzelman (personal)

| Repo | Location | Firebase | Status |
|------|----------|----------|--------|
| [Rank-Higher-Media---Json](https://github.com/AshishUzelman/Rank-Higher-Media---Json) | `~/rank-higher-media/` | rank-high-media | 🟢 Active |
| [ashish-ares](https://github.com/AshishUzelman/ashish-ares) | `~/rank-higher-media/ares/` | ashish-ares | 🟡 Active Dev |
| [ashish-ad-creator](https://github.com/AshishUzelman/ashish-ad-creator) | `~/ad-creator/` | ashish-ad-creator | 🟡 In Progress |
| [ashish-skills](https://github.com/AshishUzelman/ashish-skills) | `~/ashish-skills/` | N/A (skills) | 🟢 Active |

**Note:** ARES has separate .git inside RHM — careful with `git` commands at RHM root.

---

## Firebase Projects

**Account:** ashish.uzelman@gmail.com (primary) + ash.revolution@gmail.com (migrating out)

| Firebase Project | GitHub Repo | Local Path | Status |
|---|---|---|---|
| rank-high-media | Rank-Higher-Media---Json | `~/rank-higher-media/` | ✅ Active |
| ashish-ares | ashish-ares | `~/rank-higher-media/ares/` | ✅ Active Dev |
| ashish-ad-creator | ashish-ad-creator | `~/ad-creator/` | ✅ Filled |
| ashish-hub | (legacy) | — | 🔴 Parked |
| mindchallengeai | (separate) | ~ | 🟡 Concept |

**Firestore Backups:**
- Active backup: `scripts/save_to_drive.js` (from RHM root)
- Destination: Drive folder `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`
- Status: Firestore backup working, Drive OAuth pending

---

## Google Drive Backup Structure

**Main Backup Folder:** `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`  
**Account:** ash.revolution@gmail.com (migrating to ashish.uzelman@gmail.com)

```
My Drive / AI/ (Folder ID: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1)
├── Firestore Backups/              # Automated backups from save_to_drive.js
│   ├── rank-high-media/
│   ├── ashish-ares/
│   └── ashish-ad-creator/
├── Session Summaries/              # Rolled up at end of each session
│   ├── rolling_summary_2026-04.md
│   ├── rolling_summary_2026-03.md
│   └── [archive]
├── Project Briefs/                 # Design docs
│   ├── ARES_BRIEF.md
│   ├── Ad_Creator_BRIEF.md
│   └── [other projects]
├── Memory Files/                   # Exported memory index
│   ├── MEMORY.md
│   └── [topic files]
└── Knowledge Base/                 # Future: Obsidian integration
    └── [articles, books, research]
```

**How to Backup:** (end of session)
```bash
cd ~/rank-higher-media/
npm run save-backup                 # Firestore → Drive (requires OAuth)
# Also manually upload rolling_summary.md and MEMORY.md
```

---

## Quick Navigation Commands

```bash
# Go to RHM hub
cd ~/rank-higher-media/

# Go to ARES platform
cd ~/rank-higher-media/ares/

# Go to Ad Creator
cd ~/ad-creator/

# Go to Skills library
cd ~/ashish-skills/

# List all .env.local files (verify credentials)
find ~ -name ".env.local" -type f 2>/dev/null

# Check Git repos
cd ~/rank-higher-media/ && git remote -v
cd ~/rank-higher-media/ares/ && git remote -v
cd ~/ad-creator/ && git remote -v

# View memory files (all at RHM root)
ls -la ~/rank-higher-media/*.md | grep -E "(SOUL|MEMORY|PROJECT|CONTEXT|rolling)"

# Access Drive backup folder
open "https://drive.google.com/drive/folders/15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1"
```

---

## Session-Start Checklist

**Load memory in this order:**

1. `~/rank-higher-media/SOUL_BASE.md` — Core principles
2. `~/rank-higher-media/SOUL_ARES.md` — ARES architecture
3. `~/rank-higher-media/SOUL.md` — Working style
4. `~/rank-higher-media/permanent.json` — Agency facts
5. `~/rank-higher-media/client_override.json` — Client-specific overrides
6. `~/rank-higher-media/rolling_summary.md` — Last 3 sessions
7. `~/rank-higher-media/CONTEXT.md` — **ALWAYS CURRENT** live state
8. `~/rank-higher-media/PROJECT_STATUS.md` — Milestone tracking
9. `~/rank-higher-media/MEMORY.md` — Memory index (linked files auto-load)

**Verify before starting:**

- [ ] `CONTEXT.md` reflects current project state
- [ ] `.env.local` files are populated in active projects
- [ ] Ollama is running (if ARES work): `curl http://localhost:11434/api/tags`
- [ ] Git repos are clean (no uncommitted changes)
- [ ] Firebase Console shows expected collections + data

**End-of-session Checklist:**

- [ ] Update `CONTEXT.md` with current state
- [ ] Update `PROJECT_STATUS.md` daily section
- [ ] Add session summary to `rolling_summary.md`
- [ ] Run `npm run save-backup` (from RHM root)
- [ ] Commit all memory/status files to Git
- [ ] Upload `rolling_summary.md` to Drive backup folder

---

## Common File Locations (Quick Reference)

| What | Where |
|------|-------|
| Master router | `~/rank-higher-media/CLAUDE.md` |
| Live project state | `~/rank-higher-media/CONTEXT.md` |
| Memory index | `~/rank-higher-media/MEMORY.md` |
| Session status | `~/rank-higher-media/PROJECT_STATUS.md` |
| LLM routing rules | `~/rank-higher-media/SOUL_BASE.md` |
| ARES architecture | `~/rank-higher-media/SOUL_ARES.md` |
| Working preferences | `~/rank-higher-media/SOUL.md` |
| ARES briefing | `~/rank-higher-media/ARES_HANDOFF.md` |
| This file | `~/rank-higher-media/PROJECT_FOLDER_MAP.md` |
| RHM env | `~/rank-higher-media/.env.local` |
| ARES env | `~/rank-higher-media/ares/.env.local` |
| Ad Creator env | `~/ad-creator/.env.local` |
| ARES connector | `~/rank-higher-media/ares/src/app/api/agent/connector.js` |
| ARES dashboard | `~/rank-higher-media/ares/src/app/page.js` |
| ARES Firestore schema | Firebase Console → ashish-ares project |
| Skills | `~/ashish-skills/skills/` |
| Drive backups | Folder ID: `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1` |

---

## Account Migration Status

**From:** ash.revolution@gmail.com (legacy)  
**To:** ashish.uzelman@gmail.com (primary)  
**Status:** 🟡 In Progress (2026-04-07)

**What's migrated:**
- ✅ Firebase: ashish.uzelman@ added as Owner to all 4 projects
- ✅ GitHub: repos under AshishUzelman account
- 🔄 Google Drive: OAuth pending for save_to_drive.js
- 🔄 Transactional emails: Updating senders

**What's not migrated:**
- ❌ ash.revolution Drive folder still owns backup folder (15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1)
- ❌ Some legacy Firebase configs may still reference old account

**Action:** When OAuth is ready, run `scripts/save_to_drive.js` with ashish.uzelman@ credentials to fully migrate backups.

---

**Version:** 1.0 | **Last Updated:** 2026-04-16 | **Author:** Ashish Uzelman | **For:** Quick navigation + Opus handoff
