# Claude Session Context — Ashish Uzelman
> ⚠️ READ THIS FIRST at the start of every session. Update it before ending.
> Last updated: 2026-04-09 (Session 12 — Actor-Critic loop, system prompts, YouTube/RSS/KB pipeline, data-scraper skill, ARES daemon)

## ⚠️ TERMINAL STATE ON CLOSE
The ARES connector (`npm run connector`) was running in a terminal at session end.
qwen3 may still be processing a task or the connector may still be watching.
**At next session start:** check if connector is still running before dropping new tasks.
```bash
cd ~/rank-higher-media/ares && npm run ares-status
```
If not running, use `npm run ares-start` to restart as background daemon.

---

## Who I Am
- **Name:** Ashish Uzelman
- **Focus:** Digital entrepreneur, SEM/PPC expert, multi-project product builder
- **Accounts:** `ashish.uzelman@gmail.com` (**NEW primary** — Firebase migrated, GitHub+Drive pending), `ash.revolution@gmail.com` (previous primary, migrating out), `mindchallengerai@gmail.com` (Mind Challenger AI)
- **GitHub:** https://github.com/AshishUzelman
- **Drive:** Accessible via `ash.revolution@gmail.com` in Chrome (u/0)

---

## The Big Picture
Claude is the **central hub** that orchestrates building, skills, and deployment across all projects. A shared skills/agents library feeds into each project. Local LLMs (Ollama/Gemma 3) do bulk legwork; Claude handles quality-critical decisions.

End goal: **16/32-bit visual dashboard** (Project Visualizer / ashish-hub) showing all projects, agent activity, and workflows — pixel art characters as the agent workers.

Dev environment: **Google Antigravity** (cloud VS Code) with Claude Code in terminal. Ollama will run on a separate GCP Compute Engine VM (not in Antigravity).

---

## Firebase Projects (5 max per account)

### ash.revolution@gmail.com — 4/5 used ✅
| Slot | Project ID | Status | Notes |
|---|---|---|---|
| 1 | rank-high-media | ✅ Live | SEM agency site (Next.js 15, Vercel) |
| 2 | ashish-ad-creator | ✅ Created | Ad Creator — scaffolded, auth next |
| 3 | ashish-ares | ✅ Created | ARES orchestration platform |
| 4 | ashish-hub | ✅ Created | Project Visualizer / 16-bit dashboard |
| 5 | (reserved) | — | Keep free |

### Other accounts
| Account | Known Projects | Notes |
|---|---|---|
| `mindchallengerai@gmail.com` | Mind Challenger AI | Separate Firebase account |
| `ashish.uzelman@gmail.com` | Maze? | Need to check |

---

## Active Projects
| Project | Status | Repo | Firebase ID | Priority |
|---|---|---|---|---|
| Ad Creator Web App | 🟡 Scaffolded | ashish-ad-creator | ashish-ad-creator ✅ | 1 — Auth next |
| ARES Platform | 🟡 Dashboard live | ashish-ares | ashish-ares ✅ | 1 — Fill .env.local |
| Skill Factory Pipeline | 🟢 Sub-system 1 active | ashish-skills (private) | N/A | 1 — Sub-system 2 next |
| Rank Higher Media | 🔴 DNS blocked | Rank-Higher-Media---Json | rank-high-media | 2 |
| Project Visualizer | 🔵 Build last | TBD | ashish-hub ✅ | 3 |
| Mind Challenger AI | 🟡 In progress | TBD | mindchallengerai account | — |
| Pricing SaaS | 🔵 Concept | TBD | TBD | — |
| SEED Initiative | 🔵 Concept | TBD | TBD | — |
| Children with Anxiety | 🔵 Concept | TBD | TBD | — |

---

## Ad Creator — Current State
- **Repo:** https://github.com/AshishUzelman/ashish-ad-creator
- **Local path:** `~/ad-creator/`
- **Stack:** Next.js 15 + React + Tailwind + Firebase (Auth, Firestore, Storage) + JS only
- **Firebase config:** `lib/firebase.js` ready — `.env.local` fully filled ✅ (all 7 credentials, 2026-04-07)
- **BRIEF:** `projects/ad-creator/BRIEF.md` in RHM repo — full spec, build order, Firestore schema
- **Build status:** Clean build ✅ (confirmed 2026-04-07)
- **Deploy:** Vercel only — do NOT use Firebase Hosting / firebase-tools for this project
- **Auth:** ✅ COMPLETE (2026-04-07) — hooks/useAuth.js + AuthContext + login page + protected dashboard shell
  - Google SSO → Firestore users/{uid} created on first login: role:free, tokenBalance:5
- **Next:** Dashboard page (project list component)

---

## Build Order
1. ✅ Firebase setup — all 4 projects created
2. ✅ Ad Creator spec read + BRIEF.md populated
3. ✅ Ad Creator repo scaffolded + pushed to GitHub
4. ✅ ARES dashboard scaffolded by Gemini (Phase 1 UI)
5. ✅ ARES dashboard Phase 4: real Firestore connections for all components
6. ✅ Agent connector system: Firestore task tracking + Agent Context Packets
7. ✅ Skill Factory Pipeline Sub-system 1: skill-builder complete (validate + scaffold + package + SKILL.md)
8. ✅ 7 skills built + live (5 SEO + youtube-agent + agent-teams) in ashish-skills (private repo)
9. ✅ Fill Firebase credentials (.env.local for ares + ad-creator) — done 2026-04-07
10. ✅ Ad Creator auth (Google SSO + Firestore user creation) — done 2026-04-07
11. ✅ ARES Workflow Map tab (Option B — live React + Firestore) — done 2026-04-07
12. ✅ qwen3:30b-a3b pulled + memory_config.js + SOUL_BASE routing updated — done 2026-04-07
13. ✅ ARES Supervisor Pattern (gemma3:12b review loop) — done 2026-04-07
14. 🔲 Ad Creator dashboard page (project list) ← NEXT
15. 🔲 Multi-phase Worker loop (research → draft → critic → refine → supervisor)
16. 🔲 Ad Creator canvas editor
12. 🔲 ARES: Drive OAuth → automated session saves
13. 🔲 Skill Factory Sub-system 2: Data Scraper / Ingestor
14. 🔲 Visualizer — build last

---

## Repo Structure (Rank Higher Media = Hub)
```
/                     ← Next.js 15 marketing site (Rank Higher Media)
/CLAUDE.md            ← Master project context + load order
/CONTEXT.md           ← THIS FILE
/PROJECT_STATUS.md    ← Tiered project status (daily/weekly/monthly) ← NEW
/SOUL.md              ← Ashish's working style + preferences
/SOUL_BASE.md         ← Agent constitution
/SOUL_ARES.md         ← ARES platform extension
/permanent.json       ← Agency + client facts
/client_override.json ← Per-client rule exceptions
/rolling_summary.md   ← Last 3 session summaries
/skills/              ← Reusable Claude skills & agent prompts (in RHM repo)
# ~/ashish-skills/   ← Private skills repo (github.com/AshishUzelman/ashish-skills)
#   skill-builder/, seo/, youtube-agent/, agent-teams/
/scripts/             ← (empty — automation scripts live in ares/scripts/)
/projects/
  /ad-creator/        ← BRIEF.md ✅ (code lives in separate repo)
  /ares/              ← BRIEF.md (code lives in ares/ subdir)
  /visualizer/        ← BRIEF.md

/ares/                ← ARES platform (separate .git, separate Firebase)
  /scripts/
    agent_connector.js  ← orchestrator: inbox watcher + Claude invoker
    firestore-client.js ← Node.js Firebase CRUD helper
    load_context.js     ← Agent Context Packet builder
    save_to_drive.js    ← Firestore backup + Drive scaffold
  /src/
    /app/               ← Next.js App Router
    /components/        ← AgentStatus, TaskQueue, TokenUsage, MemoryState, SystemHeader, Sidebar
    /hooks/             ← useAgentState, useTaskQueue, useTokenUsage, useMemoryState
    /lib/firebase/      ← config.js, firestore.js, schema.js
  /agent_inbox/         ← tasks written here by Manager agents (Gemini)
  /agent_outbox/        ← results written here by Worker agents (Claude)
```

---

## Key Drive Documents
| Doc | Notes |
|---|---|
| Ad Creator Spec | `~/Downloads/Breakdown on how to create ad creative site.txt` — also Google Doc (see below) |
| Ad Creator Spec (Google Doc) | https://docs.google.com/document/d/1-CzqwgqY5YTLz0iYnHunrw8kZUt7drd4krZ6LQ4w6Lw/edit |
| ARES Spec | Drive → Opal folder → "SEO Auditor" file (58KB) + 2 mockup images |
| SEED Initiative Proposal | Drive → Seed Initiative folder |

---

## Session Log

### 2026-04-07 — Session 10
- ARES System Map tab (Option B) BUILT ✅
  - subscribeToLatestTaskPerAgent, useWorkflowState, WorkflowNode/Edge/Detail/Map
  - /system-map page + Sidebar Network icon — clean build, pushed
- qwen3:30b-a3b pulled (18GB MoE) ✅ — memory_config.js + SOUL_BASE routing updated
- Supervisor Pattern BUILT ✅ — gemma3:12b reviews Worker, APPROVED/REJECTED loop, max 3 retries → escalated
- Architectural discussion: multi-phase worker loop (research → draft → critic → refine → supervisor) — deferred
- Next: Ad Creator dashboard page

### 2026-04-07 — Session 9
- Ad Creator Google SSO auth BUILT ✅
  - hooks/useAuth.js: Auth state listener + ensureUserDoc (role:free, tokenBalance:5)
  - app/providers.js: AuthContext provider ('use client')
  - app/page.js: Google Sign In login page with redirect to /dashboard
  - app/dashboard/page.js: Protected shell (bounces to / if not authed)
  - Clean production build confirmed ✅
- Hermes architecture review → 3 gaps added to project_ash_code_strategic.md
  - Memory layer taxonomy (user_profile|agent_memory|skill|session_history)
  - Self-generating skills (compiler → skill-builder scaffold)
  - launchd cron daemon for always-on headless tasks
- ARES n8n workflow map: two-flow diagram built + saved to ares/public/workflow-map.html
- ares/.gitignore updated (.superpowers/ excluded)
- Workflow Map tab options presented (A/B/C) — awaiting Ash's decision
- All memory files updated + queued for next session

### 2026-04-07 — Session 8
- Confirmed ares/.env.local fully filled (was falsely marked blocked)
- Filled ad-creator/.env.local — all 7 Firebase credentials
- Clarified: Ad Creator → Vercel deploy, NOT Firebase Hosting
- Gmail migration: ashish.uzelman added as Owner to all 4 Firebase projects
- Updated CLAUDE.md + all memory files → ashish.uzelman as new primary
- Updated PROJECT_STATUS.md TODAY block + Open Items
- Updated rolling_summary.md (Session 8 added)

### 2026-03-30 — Session 6
- Completed skill-builder: all 8 tasks, smoke tests passing, live at ~/.claude/skills/skill-builder/
- Made ashish-skills GitHub repo private (was accidentally public)
- Built 5 SEO skills from Imajery/Centre Willow docs: seo-audit-workflow, seo-content-strategy, homepage-ux-audit, keyword-research, client-seo-report
- Built youtube-agent skill (from Claude Code Agent Teams YouTube video transcript)
- Built agent-teams skill from official Claude Code docs + docs/agent-teams-reference.md in worktree
- 8 skills total now live in ~/.claude/skills/
- ashish-skills repo: all 8 skills committed + pushed to main (private)
- Progressive disclosure pattern established: frontmatter → SKILL.md → references/ (on demand)
- Committed to worktree branch claude/dazzling-bartik

### 2026-03-04 — Session 5
- Reviewed Gemini's ARES Phase 1 scaffold + implemented Phase 4 (real Firestore)
- Created firestore.js service layer + 4 hooks + 5 components
- Fixed Firebase config crash (hasConfig guard), fixed React hook purity errors
- Executed task_001.md: first real Gemini→Claude agent handoff ✅
- Built enhanced agent connector: firestore-client.js, load_context.js, save_to_drive.js, agent_connector.js
- Agent Context Packets: agents now load soul files + Firestore memory at task start
- Backup system: Firestore session_summary active; Drive OAuth scaffold ready
- Created PROJECT_STATUS.md (tiered daily/weekly/monthly recessive memory) ✅
- Committed + pushed: ashish-ares repo (main)

### 2026-03-04 — Session 4
- Loaded all 7 memory files from worktree into active context
- Moved memory files + projects/ + skills/ from worktree → project root
- Created scripts/ directory
- Fixed .gitignore (added .next), removed .next + node_modules from git index
- Set up main branch on GitHub as upstream ✅
- Deleted junk files (tailwind., package.json.bak, package.json.save)
- Read Ad Creator spec from Downloads txt file
- Populated projects/ad-creator/BRIEF.md (full architecture, Firestore schema, API routes, build order)
- Scaffolded Ad Creator repo: Next.js 15 + Tailwind + Firebase + JS
- Created GitHub repo: github.com/AshishUzelman/ashish-ad-creator ✅
- Confirmed clean build ✅
- Discussed Antigravity (cloud VS Code + Claude Code in terminal) + Ollama on GCP VM strategy
- Discussed Project Visualizer vision: 16/32-bit dashboard, pixel art agent workers
- Updated rolling_summary.md + CONTEXT.md + committed

### 2026-03-04 — Session 3
- Created SOUL.md + recovered memory stack from files.zip
- Integrated SOUL_BASE.md, SOUL_ARES.md, permanent.json, client_override.json, rolling_summary.md
- Updated CLAUDE.md with full 7-file load order
- Committed all to GitHub

### 2026-03-04 — Session 2
- Created Firebase projects: ashish-ad-creator, ashish-ares, ashish-hub

### 2026-03-04 — Session 1
- Created CLAUDE.md, fixed .gitignore, set up gh CLI, mapped Drive + projects

---

## Next Session Checklist — Start Here

### 🔁 Always
- [ ] Load: SOUL_BASE.md → SOUL_ARES.md → SOUL.md → permanent.json → client_override.json → rolling_summary.md → CONTEXT.md → PROJECT_STATUS.md
- [ ] Review PROJECT_STATUS.md Today + Open Items sections

### 🏗️ Ad Creator — Priority 1
- [x] Auth: Firebase Google SSO + Firestore user doc ✅ (2026-04-07)
- [ ] Build dashboard page (project list)
- [ ] Start canvas editor component

### 🤖 ARES
- [ ] Verify live Firestore data on ARES dashboard after filling .env.local
- [ ] Set up Google Drive OAuth: add credentials.json → run drive_auth.js → Drive uploads live

### ☁️ Antigravity + Local LLMs
- [ ] Clone RHM repo + ares repo into Antigravity
- [ ] Confirm Claude Code running in Antigravity terminal
- [ ] GCP VM for Ollama — provision + install

### 🔧 Infrastructure
- [ ] Fix Rank Higher Media DNS issue
- [ ] Check ashish.uzelman@gmail.com Firebase — Maze project location
- [ ] Archive rolling_summary_archive_2026-02.md to Drive

---

## ⚠️ Session Continuity Protocol
- Update CONTEXT.md during long sessions, not just at end
- Commit CONTEXT.md regularly — it's the backup
- If context window filling: update + commit CONTEXT.md FIRST
- End every session: update rolling_summary.md + CONTEXT.md → commit → push
