# Claude Session Context — Ashish Uzelman
> ⚠️ READ THIS FIRST at the start of every session. Update it before ending.
> Last updated: 2026-03-04 (Session 5 — ARES Firestore live + Agent Context Packets built | Next: Fill .env.local + Ad Creator auth)

---

## Who I Am
- **Name:** Ashish Uzelman
- **Focus:** Digital entrepreneur, SEM/PPC expert, multi-project product builder
- **Accounts:** `ash.revolution@gmail.com` (primary), `mindchallengerai@gmail.com` (Mind Challenger AI), `ashish.uzelman@gmail.com` (Drive/storage)
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
- **Firebase config:** `lib/firebase.js` ready — `.env.local` needs credentials filled in
- **BRIEF:** `projects/ad-creator/BRIEF.md` in RHM repo — full spec, build order, Firestore schema
- **Build status:** Scaffolded + builds clean ✅
- **Next:** Fill `.env.local` → build Google SSO auth → Firestore user creation

### Firebase Credentials Needed (from Firebase Console → ashish-ad-creator → Project Settings)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ashish-ad-creator
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Build Order
1. ✅ Firebase setup — all 4 projects created
2. ✅ Ad Creator spec read + BRIEF.md populated
3. ✅ Ad Creator repo scaffolded + pushed to GitHub
4. ✅ ARES dashboard scaffolded by Gemini (Phase 1 UI)
5. ✅ ARES dashboard Phase 4: real Firestore connections for all components
6. ✅ Agent connector system: Firestore task tracking + Agent Context Packets
7. 🔲 Fill Firebase credentials (.env.local for ares + ad-creator)
8. 🔲 Ad Creator auth (Google SSO + Firestore user creation)
9. 🔲 Ad Creator canvas editor
10. 🔲 ARES: Drive OAuth → automated session saves
11. 🔲 Visualizer — build last

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
/skills/              ← Reusable Claude skills & agent prompts
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

### 🔑 Unblock First (5 min each)
- [ ] Fill `ares/.env.local` — get API_KEY, AUTH_DOMAIN, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID from Firebase Console → ashish-ares → Project Settings → Web App
- [ ] Fill `ad-creator/.env.local` — same from ashish-ad-creator project

### 🏗️ Ad Creator — Priority 1
- [ ] Build auth: Firebase Google SSO + Firestore user doc on first login
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
