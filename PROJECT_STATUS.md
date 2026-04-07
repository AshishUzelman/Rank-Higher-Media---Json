# PROJECT_STATUS.md — Recessive Memory
> Tiered project status: Daily → Weekly → Monthly → All-time milestones
> Load this file alongside CONTEXT.md at the start of every session.
> Update the Daily section at session end. Promote to Weekly on Sunday. Monthly on the 1st.
> This file is the answer to "where are we?" at any time granularity.

---

## TODAY — 2026-04-07

### Completed
- [x] Memory compiler (compile_memory.js): 4 parallel LLM calls, Stop hook registered, 14 tests passing
- [x] Default LLM: qwen2.5-coder:14b via Ollama at localhost:11434 (free, local)
- [x] ARES Firestore seeded: 3 agents, 3 tasks, 2 token records, 2 memory records
- [x] agent_connector.js fixed: Ollama at port 11434 directly (ash-proxy at 4000 bypassed)
- [x] ares/.env.local confirmed fully filled + ad-creator/.env.local filled
- [x] Ad Creator: Google SSO auth COMPLETE ✅
- [x] Hermes analysis: 3 architecture gaps → project_ash_code_strategic.md
- [x] ARES System Map tab (Option B — live React + Firestore) COMPLETE ✅
  - WorkflowNode, WorkflowEdge, NodeDetail, WorkflowMap, useWorkflowState, subscribeToLatestTaskPerAgent
  - /system-map page + Sidebar nav item — clean build, pushed to ashish-ares
- [x] qwen3:30b-a3b pulled (18GB, MoE, 128K ctx) ✅ — live in Ollama
- [x] memory_config.js created: WORKER_MODEL=qwen3:30b-a3b, SUPERVISOR_MODEL=gemma3:12b
- [x] SOUL_BASE.md LLM routing table updated
- [x] Supervisor Pattern COMPLETE ✅
  - schema.js: supervisor_review + supervisor_rejected + retryCount + supervisorFeedback
  - agent_connector.js: runSupervisor() + APPROVED/REJECTED loop (max 3 → escalated)
  - Clean build, pushed to ashish-ares

### In Progress
- [ ] Ad Creator: Dashboard page (project list) — START NEXT SESSION

### Blocked
- DNS issue: Rank Higher Media site not resolving (root cause unknown)
- Drive OAuth: `save_to_drive.js` Drive upload disabled until credentials.json added
- ash-proxy port 4000: returns `{"error":"not found"}` — investigate what's running there

---

## TODAY — 2026-03-30

### Completed
- [x] Skill-builder (Sub-system 1): all 8 tasks done, smoke tests passing, live at ~/.claude/skills/skill-builder/
- [x] ashish-skills GitHub repo made private (was public — security fix)
- [x] SEO skill: seo-audit-workflow (4-agent pipeline from SEO Audit Tool Master Spec)
- [x] SEO skill: seo-content-strategy (4-phase content strategy from Imajery guides)
- [x] SEO skill: homepage-ux-audit (5-step audit with scoring system + Centre Willow reference)
- [x] SEO skill: keyword-research (6-step research with tiered output)
- [x] SEO skill: client-seo-report (6-step client report, Centre Willow style example)
- [x] youtube-agent skill built (transcript → classify → break down → ARES mapping)
- [x] agent-teams skill built from official Claude Code docs
- [x] docs/agent-teams-reference.md committed to worktree dazzling-bartik
- [x] 8 skills live in ~/.claude/skills/ + ashish-skills repo pushed
- [x] Memory files updated (this update)
- [x] Strategic analysis skills built and installed: strategic-intake + competitive-intel + strategic-analysis
- [x] 11 skills total in ~/.claude/skills/ (was 8, now 11)
- [x] ashish-skills: strategic/ folder committed and pushed to main

### In Progress
- [ ] ares/.env.local: only PROJECT_ID filled — need API_KEY, APP_ID, etc.
- [ ] ad-creator/.env.local: credentials not filled

### Blocked
- DNS issue: Rank Higher Media site not resolving (root cause unknown)
- Drive OAuth: `save_to_drive.js` Drive upload disabled until credentials.json added

---

## TODAY — 2026-03-04

### Completed
- [x] ARES dashboard: full Firestore integration (all 4 widgets live)
- [x] Fixed React hook purity errors (3-attempt lesson learned)
- [x] Fixed Firebase config crash (hasConfig guard)
- [x] First Gemini → Claude agent handoff via task_001.md ✅ (ARES orchestration system working)
- [x] Built enhanced agent connector: Firestore task tracking + memory context packets
- [x] load_context.js: agents now load soul files + Firestore memory at task start
- [x] save_to_drive.js: Firestore backup active; Drive scaffold ready for OAuth
- [x] PROJECT_STATUS.md created (this file — recessive memory system)

### In Progress
- [ ] ares/.env.local: only PROJECT_ID filled — need API_KEY, APP_ID, etc.
- [ ] ad-creator/.env.local: credentials not filled

### Blocked
- DNS issue: Rank Higher Media site not resolving (root cause unknown)
- Drive OAuth: `save_to_drive.js` Drive upload disabled until credentials.json added

---

## THIS WEEK — Week of 2026-03-02

### ARES Platform
- [x] Gemini scaffolded Phase 1 UI (AgentStatus, TaskQueue, TokenUsage, MemoryState, Sidebar)
- [x] Claude implemented Phase 4: real Firestore connections for all components
- [x] Firebase config hardened: crash-proof with empty credentials
- [x] agent_connector.js built by Gemini → enhanced by Claude with full orchestration
- [x] First real Director→Manager→Worker handoff tested (task_001)
- [x] Agent Context Packets designed + built (soul files + memory + working state)
- [x] ARES GitHub repo created: ashish-ares

### Ad Creator
- [x] Spec read from `~/Downloads/` + `projects/ad-creator/BRIEF.md` populated
- [x] Repo scaffolded: github.com/AshishUzelman/ashish-ad-creator
- [x] Clean build confirmed
- [ ] Auth (Google SSO + Firestore user) — NOT STARTED

### Infrastructure
- [x] Memory files moved from worktree → project root (7 files)
- [x] .gitignore fixed (.next added)
- [x] main branch on GitHub set up with upstream
- [x] Claude memory directory initialized with MEMORY.md

---

## THIS MONTH — March 2026

### Milestones Hit
| Date | Milestone |
|------|-----------|
| 2026-03-04 | Firebase projects created (ad-creator, ares, hub) |
| 2026-03-04 | Memory architecture recovered + integrated (7-file system) |
| 2026-03-04 | Ad Creator repo scaffolded |
| 2026-03-04 | ARES dashboard Phase 4: live Firestore data |
| 2026-03-04 | First working agent handoff: Gemini → agent_inbox → Claude → agent_outbox |
| 2026-03-04 | Agent Context Packet system built (recessive memory for agents) |
| 2026-03-30 | Skill Factory Sub-system 1 complete: skill-builder live at ~/.claude/skills/skill-builder/ |
| 2026-03-30 | 7 skills built + deployed (5 SEO + youtube-agent + agent-teams) |
| 2026-03-30 | ashish-skills private repo live: github.com/AshishUzelman/ashish-skills |
| 2026-03-30 | Progressive disclosure token strategy established across all skills |

### March Goals
- [ ] Ad Creator: Google SSO auth + Firestore user doc
- [ ] Ad Creator: Dashboard page (project list)
- [ ] Ad Creator: Canvas editor MVP
- [ ] ARES: Fill Firebase credentials → test live dashboard on real data
- [ ] ARES: Drive OAuth setup → automated session saves
- [ ] Infrastructure: Fix Rank Higher Media DNS
- [ ] Infrastructure: Antigravity setup (clone repos + Claude Code in terminal)
- [ ] Optional: Ollama on GCP VM setup

---

## ALL-TIME MILESTONES

| Date | Event |
|------|-------|
| Pre-2026 | Memory stack created (SOUL_BASE.md, SOUL_ARES.md, permanent.json) |
| 2026-02 | ARES concept defined: Director→Manager→Worker orchestration platform |
| 2026-02 | Rolling summary archive 2026-02 (needs Drive upload) |
| 2026-03-04 | Memory system fully recovered + integrated into Claude Code workflow |
| 2026-03-04 | 4 Firebase projects provisioned on ash.revolution@gmail.com |
| 2026-03-04 | Ad Creator: spec → BRIEF.md → scaffolded repo |
| 2026-03-04 | ARES: Gemini built Phase 1 UI → Claude built Phase 4 Firestore integration |
| 2026-03-04 | ARES: First working Gemini→Claude agent handoff (Director→Manager→Worker pattern live) |
| 2026-03-04 | Agent Context Packets: agents now have persistent memory at task start |
| 2026-03-30 | Skill Factory Sub-system 1 complete: skill-builder (validate + scaffold + package) |
| 2026-03-30 | Skills library live: 8 skills in ~/.claude/skills/ + ashish-skills private repo |
| 2026-03-30 | Agent Teams docs captured as skill + local reference (dazzling-bartik worktree) |
| 2026-03-30 | Strategic Analysis Skills: 3-skill pipeline (strategic-intake + competitive-intel + strategic-analysis) with 8 frameworks, DataForSEO-first data layer, client folder output system |

---

## PROJECT SNAPSHOT

### Ad Creator Web App
| Field | Value |
|-------|-------|
| Status | 🟡 Scaffolded — auth next |
| Repo | github.com/AshishUzelman/ashish-ad-creator |
| Local path | ~/ad-creator/ |
| Firebase | ashish-ad-creator (credentials needed in .env.local) |
| Stack | Next.js 15, Tailwind, Firebase (Auth/Firestore/Storage), JS |
| Next step | Google SSO auth → Firestore user doc on first login |
| Blockers | .env.local credentials not filled |

### ARES Platform
| Field | Value |
|-------|-------|
| Status | 🟡 Active dev — dashboard live, agent system running |
| Repo | github.com/AshishUzelman/ashish-ares |
| Local path | ~/rank-higher-media/ares/ |
| Firebase | ashish-ares (only PROJECT_ID in .env.local) |
| Stack | Next.js 16, Tailwind 4, Firebase Web SDK v12 |
| Agent system | agent_connector.js watching agent_inbox/ ✅ |
| Memory system | load_context.js — soul files + Firestore memory ✅ |
| Backup system | save_to_drive.js — Firestore ✅, Drive OAuth pending |
| Next step | Fill .env.local → test live dashboard |
| Blockers | API_KEY + APP_ID missing from .env.local |

### Rank Higher Media (Agency Site)
| Field | Value |
|-------|-------|
| Status | 🔴 Blocked |
| Repo | Rank-Higher-Media---Json |
| Firebase | rank-high-media |
| Blocker | DNS config issue — site not resolving |
| Next step | Investigate DNS — compare Vercel DNS config vs registrar |

### Project Visualizer (ashish-hub)
| Field | Value |
|-------|-------|
| Status | 🔵 Parked — builds last |
| Firebase | ashish-hub (created, not started) |
| Concept | 16/32-bit visual dashboard of all projects + pixel art agent workers |
| Start when | Ad Creator + ARES are running with real data |

### Mind Challenger AI
| Field | Value |
|-------|-------|
| Status | 🟡 In progress (separate Firebase account) |
| Firebase account | mindchallengerai@gmail.com |
| Next step | TBD — not the current focus |

### Skill Factory Pipeline
| Field | Value |
|-------|-------|
| Status | 🟢 Sub-system 1 active |
| Repo | github.com/AshishUzelman/ashish-skills (private) |
| Local path | ~/ashish-skills/ |
| Sub-system 1 | skill-builder ✅ — live at ~/.claude/skills/skill-builder/ |
| Sub-system 2 | Data Scraper / Ingestor — next |
| Sub-system 3 | Plugin Packager (distributable like superpowers) — last |
| Skills deployed | 8 total: skill-builder + seo (×5) + youtube-agent + agent-teams |

---

## OPEN ITEMS MASTER LIST

### 🔴 Critical (blocking active projects)
- [x] Fill `ares/.env.local` — fully filled ✅ (was falsely marked blocked)
- [x] Fill `ad-creator/.env.local` — all 6 credentials + measurementId ✅ (2026-04-07)
- [ ] Fix Rank Higher Media DNS

### 🟡 Next Up
- [x] Ad Creator: Google SSO auth ✅ (2026-04-07)
- [ ] Ad Creator: Dashboard page (project list component)
- [ ] ARES: Workflow Map tab — pick A/B/C → build (task queued in agent_inbox/)
- [ ] Drive OAuth: add `drive_credentials.json` → run `drive_auth.js` → Drive uploads go live
- [ ] Antigravity: clone repos + verify Claude Code in terminal
- [ ] Skill Factory Sub-system 2: Data Scraper / Ingestor

### 🔵 Queued / Parked
- [ ] Ollama on GCP Compute Engine VM
- [ ] Ad Creator canvas editor
- [ ] Skill Factory Sub-system 3: Plugin Packager
- [ ] Project Visualizer (builds last)
- [ ] Check ashish.uzelman@gmail.com Firebase — Maze project
- [ ] Archive rolling_summary_archive_2026-02.md to Drive
- [ ] SEED Initiative (concept stage)
- [ ] Pricing SaaS (concept stage)
- [ ] Children with Anxiety project (concept stage)

---

## HOW TO USE THIS FILE

**At session start:** Read Today + Open Items. Update In Progress.
**During session:** Check off completed items in Today as you go.
**At session end:**
1. Move completed Today items to This Week
2. Update Today with new completed + in-progress items
3. On Sunday: summarize week into This Month
4. On the 1st: move month summary to All-Time Milestones, reset This Month
5. Commit + push
