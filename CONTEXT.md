# Claude Session Context — Ashish Uzelman
> ⚠️ READ THIS FIRST at the start of every session. Update it before ending.
> Last updated: 2026-03-04 (Session 4 — Ad Creator scaffolded ✅ | Next: Auth + Antigravity)

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
| Rank Higher Media | 🟢 Active | Rank-Higher-Media---Json | rank-high-media | 2 |
| ARES Platform | 🟡 Active Dev | TBD | ashish-ares ✅ | 2 |
| Project Visualizer | 🔵 Build last | TBD | ashish-hub ✅ | 3 |
| Mind Challenger AI | 🟡 In Progress | TBD | mindchallengerai account | — |
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
4. 🔲 Ad Creator auth (Google SSO + Firestore user creation)
5. 🔲 Ad Creator canvas editor
6. 🔲 ARES — read spec → scaffold → build
7. 🔲 Visualizer — build last

---

## Repo Structure (Rank Higher Media = Hub)
```
/                   ← Next.js 15 marketing site (Rank Higher Media)
/CLAUDE.md          ← Master project context + load order
/CONTEXT.md         ← THIS FILE
/SOUL.md            ← Ashish's working style + preferences
/SOUL_BASE.md       ← Agent constitution
/SOUL_ARES.md       ← ARES platform extension
/permanent.json     ← Agency + client facts
/client_override.json ← Per-client rule exceptions
/rolling_summary.md ← Last 3 session summaries
/skills/            ← Reusable Claude skills & agent prompts
/scripts/           ← Automation scripts (save_to_drive.js — TODO)
/projects/
  /ad-creator/      ← BRIEF.md ✅ (code lives in separate repo)
  /ares/            ← BRIEF.md
  /visualizer/      ← BRIEF.md
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
- [ ] Load memory files: SOUL_BASE.md → SOUL_ARES.md → SOUL.md → permanent.json → client_override.json → rolling_summary.md → CONTEXT.md
- [ ] Review open items below

### 🏗️ Ad Creator — Priority 1
- [ ] Get Firebase credentials from console (ashish-ad-creator → Project Settings)
- [ ] Fill in `~/ad-creator/.env.local`
- [ ] Build auth: Firebase Google SSO + Firestore user doc on first login
- [ ] Build dashboard page (project list)
- [ ] Start canvas editor component

### ☁️ Antigravity + Local LLMs
- [ ] Clone RHM repo + ad-creator repo into Antigravity
- [ ] Confirm Claude Code running in Antigravity terminal
- [ ] Decide: Mac (ngrok) vs GCP VM for Ollama — set up chosen option
- [ ] Test Ollama API call from Antigravity

### 🤖 ARES + Skills
- [ ] Read ARES spec from Drive (Opal folder → SEO Auditor 58KB)
- [ ] Scaffold ARES repo
- [ ] Start building skill library using Claude's skill testing feature

### 🔧 Infrastructure
- [ ] Build `scripts/save_to_drive.js` — end-of-session Drive save automation
- [ ] Check ashish.uzelman@gmail.com Firebase — Maze project location
- [ ] Archive rolling_summary_archive_2026-02.md to Drive

### 🌐 Rank Higher Media
- [ ] Investigate + fix DNS config issue blocking the site

---

## ⚠️ Session Continuity Protocol
- Update CONTEXT.md during long sessions, not just at end
- Commit CONTEXT.md regularly — it's the backup
- If context window filling: update + commit CONTEXT.md FIRST
- End every session: update rolling_summary.md + CONTEXT.md → commit → push
