# Claude Session Context — Ashish Uzelman
> ⚠️ READ THIS FIRST at the start of every session. Update it before ending.
> Last updated: 2026-03-04 (Session 3 — Memory stack integrated ✅ | Next: Ad Creator)

---

## Who I Am
- **Name:** Ashish Uzelman
- **Focus:** Digital entrepreneur, SEM/PPC expert, multi-project product builder
- **Accounts:** `ash.revolution@gmail.com` (primary), `mindchallengerai@gmail.com` (Mind Challenger AI), `ashish.uzelman@gmail.com` (Drive/storage)
- **GitHub:** https://github.com/AshishUzelman/Rank-Higher-Media---Json
- **Drive:** Accessible via `ash.revolution@gmail.com` in Chrome (u/0)

---

## The Big Picture
Claude is the **central hub** that orchestrates building, skills, and deployment across all projects. A shared skills/agents library feeds into each project. Free AI (Gemini etc.) does legwork; Claude + Ashish handle planning and review.

End goal includes a **16-bit style visual dashboard** (Project Visualizer) showing all projects, workflows, and agent activity in one place.

---

## Firebase Projects (5 max per account)

### ash.revolution@gmail.com — 4/5 used ✅ ALL CREATED 2026-03-04
| Slot | Project ID | Status | Notes |
|---|---|---|---|
| 1 | rank-high-media | ✅ Exists | SEM agency site (Next.js 15, deployed on Vercel) |
| 2 | ashish-ad-creator | ✅ CREATED | Ad Creator Web App — created 2026-03-04 |
| 3 | ashish-ares | ✅ CREATED | ARES — Agentic Resource & Execution System — created 2026-03-04 |
| 4 | ashish-hub | ✅ CREATED | Project Visualizer / Dashboard — created 2026-03-04 |
| 5 | (reserved) | — | Keep free for now |

**Settings used for all new projects:**
- Gemini in Firebase: ✅ Enabled (Recommended)
- Google Analytics: ✅ Enabled → Default Account for Firebase

### Other accounts
| Account | Known Projects | Notes |
|---|---|---|
| `mindchallengerai@gmail.com` | Mind Challenger AI | Separate Firebase account |
| `ashish.uzelman@gmail.com` | Maze? | Need to check — Maze may live here |

---

## Active Projects
| Project | Status | Repo | Firebase ID | Priority |
|---|---|---|---|---|
| Rank Higher Media | 🟢 Active | Rank-Higher-Media---Json | rank-high-media | 2 |
| Ad Creator Web App | 🟡 Ready to build | TBD | ashish-ad-creator ✅ | 1 — BUILD NEXT |
| ARES Platform | 🟡 Active Dev | React + Firebase + Hybrid LLM | ashish-ares ✅ | 2 |
| Project Visualizer | 🔵 Build last | TBD | ashish-hub ✅ | 3 |
| Mind Challenger AI | 🟡 In Progress | TBD | mindchallengerai account | — |
| Pricing SaaS | 🔵 Concept | TBD | TBD | — |
| SEED Initiative | 🔵 Concept | TBD | TBD | — |
| Children with Anxiety | 🔵 Concept | TBD | TBD | — |

---

## Build Order
1. ✅ **Firebase setup** — All 4 projects exist on ash.revolution@gmail.com
2. 🔲 **Ad Creator** — Read full spec from Drive → scaffold repo → build
3. 🔲 **ARES** — Read spec from Drive (Opal folder) → scaffold → build
4. 🔲 **Visualizer** — Build last, once real projects exist to display

---

## Repo Structure (Rank Higher Media = Hub)
```
/                   ← Next.js 15 marketing site (Rank Higher Media)
/CLAUDE.md          ← Master project context
/CONTEXT.md         ← THIS FILE — session memory, updated every session
/skills/            ← Reusable Claude skills & agent prompts
/projects/
  /ad-creator/      ← BRIEF.md — BUILD NEXT
  /ares/            ← BRIEF.md (SEO Auditor, formerly "Opal")
  /visualizer/      ← BRIEF.md (build last)
  /mind-challenger-ai/
  /rank-higher-media/
```

---

## Key Drive Documents
| Doc | How to Find | Notes |
|---|---|---|
| Ad Creator Spec | Search Drive: "Breakdown on how to create ad creative site" | 11-section full technical spec |
| Ad Creator Spec (direct URL) | https://docs.google.com/document/d/1-CzqwgqY5YTLz0iYnHunrw8kZUt7drd4krZ6LQ4w6Lw/edit | Tab already open in browser |
| ARES Spec | Drive → Opal folder → "SEO Auditor" file (58KB) | + 2 mockup images |
| SEED Initiative Proposal | Drive → Seed Initiative folder | SEO services business |

---

## Session Log

### 2026-03-04 — Session 1
- Created CLAUDE.md (master context file)
- Fixed .gitignore — removed node_modules + .next from git history
- Set up gh CLI, authenticated with GitHub
- Mapped all Drive folders and projects
- Created /skills and /projects skeleton structure
- Renamed Opal → ARES (SEO Auditor)
- Created CONTEXT.md
- Confirmed Firebase on ash.revolution@gmail.com: 1/5 slots used

### 2026-03-04 — Session 2
- Confirmed all projects are under ash.revolution@gmail.com (Gemini was also working on it — explains why projects appeared on multiple accounts)
- ✅ Created Firebase project: `ashish-ad-creator`
- ✅ Created Firebase project: `ashish-ares`
- ✅ Created Firebase project: `ashish-hub`
- Firebase is now 4/5 slots used — 1 reserved slot remaining
- All projects use: Gemini enabled + Default Analytics account
- Ad Creator spec Google Doc is open in browser tab

### 2026-03-04 — Session 3
- Created SOUL.md (Ashish's personal working preferences + build philosophy)
- Added full ARES agent architecture to SOUL.md + rebuilt projects/ares/BRIEF.md
- Discovered files.zip in Downloads → full pre-existing memory stack from prior Claude Code sessions
- Recovered + integrated 5 memory files into project root:
  - `SOUL_BASE.md` — agent constitution (Scrutinizer, Loop Guard, E-E-A-T, LLM routing)
  - `SOUL_ARES.md` — ARES platform extension (Director→Manager→Worker, Firestore schema, dashboard spec)
  - `permanent.json` — agency + client facts (Centre Willow + Goldwater Law via Imajery)
  - `client_override.json` — per-client rule exceptions
  - `rolling_summary.md` — last 3 sessions + archive protocol
- Updated CLAUDE.md: Session Memory → full 7-file load-order table + cold-start warning
- Corrected ARES everywhere: "Agentic Resource & Execution System" (SEO Auditor is one sub-project)
- Added Vanguard: Galactic Rescue + Maze Generator to Project Registry (parked P3)
- Committed all to GitHub ✅
- **Next session:** Read Ad Creator spec → BRIEF.md → scaffold repo

---

## Next Session Checklist — Start Here

### 🔁 Session Start (always)
- [ ] Load memory files in order: SOUL_BASE.md → SOUL_ARES.md → SOUL.md → permanent.json → client_override.json → rolling_summary.md → CONTEXT.md
- [ ] Review rolling_summary.md Session 3 open items

### 🏗️ Ad Creator — Priority 1 (kick off next session)
- [ ] Read Ad Creator spec: `~/Downloads/Breakdown on how to create ad creative site.txt`
  - OR open Google Doc: https://docs.google.com/document/d/1-CzqwgqY5YTLz0iYnHunrw8kZUt7drd4krZ6LQ4w6Lw/edit
- [ ] Populate `projects/ad-creator/BRIEF.md` with architecture + feature set
- [ ] Scaffold Ad Creator repo (new GitHub repo, Firebase: `ashish-ad-creator`)
- [ ] Define tech stack for Ad Creator

### ☁️ Google Antigravity Migration
- [ ] Set up Google Antigravity environment
- [ ] Install Claude Code in Antigravity terminal
- [ ] Migrate relevant workflow from local → Antigravity
- [ ] Confirm memory file stack accessible from Antigravity workspace

### 🔧 Infrastructure
- [ ] Build Drive save script: `scripts/save_to_drive.js` (end-of-session automation)
- [ ] Set up `main` branch on GitHub as base branch
- [ ] Check `ashish.uzelman@gmail.com` Firebase — confirm if Maze project lives there

### 🌐 Rank Higher Media Site
- [ ] Investigate DNS config issue blocking site (noted as high priority in SOUL_ARES.md)

### 📋 Backlog
- [ ] Read ARES spec from Drive (Opal folder → SEO Auditor file 58KB) → merge into ARES BRIEF
- [ ] Archive rolling_summary_archive_2026-02.md to Drive (folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1)

---

## ⚠️ Session Continuity Protocol
- Update CONTEXT.md frequently during long sessions — not just at end
- Git commit CONTEXT.md regularly so it's backed up to GitHub
- If context window getting full: update + commit CONTEXT.md FIRST, then continue
- Ad Creator spec is at: https://docs.google.com/document/d/1-CzqwgqY5YTLz0iYnHunrw8kZUt7drd4krZ6LQ4w6Lw/edit
- Branch: `claude/intelligent-torvalds` (default branch — no `main` yet)
