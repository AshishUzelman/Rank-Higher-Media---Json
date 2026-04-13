# Ashish Uzelman — Master Router

**Digital entrepreneur, SEM/PPC expert, 15+ years. Building AI-assisted products across multiple projects.**

---

## Identity & Accounts
- **Primary:** `ashish.uzelman@gmail.com` (active, Firebase updated 2026-04-07)
- **Legacy:** `ash.revolution@gmail.com` (migrating out, owns Drive AI folder during transition)
- **Separate:** `mindchallengeai@gmail.com` (Mind Challenger AI project)

**Drive Backup:** Folder ID `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1` (ash.revolution → My Drive → AI)

---

## Project Registry

| Project | Status | Stack | Firebase | Notes |
|---|---|---|---|---|
| Rank Higher Media | 🟢 Active | Next.js 15, React 19, Tailwind, JS | rank-high-media | Marketing site — current repo |
| Ad Creator | 🟡 In Progress | Next.js 15, Tailwind, Firebase, JS | ashish-ad-creator | Creative tool with canvas editor |
| ARES Platform | 🟡 Active Dev | Next.js 16, Tailwind 4, Firebase, Ollama | ashish-ares | Agent orchestration + dashboard |
| Mind Challenger AI | 🟡 In Progress | TBD | mindchallengeai | Separate account |
| Pricing SaaS | 🔵 Concept | TBD | ashish-pricing-saas | TBD |
| SEED Initiative | 🔵 Concept | TBD | TBD | SEO services proposal |
| Vanguard: Galactic Rescue | 🔴 Parked | Phaser.js, Firebase | TBD | Game — P3 |
| Maze Generator | 🔴 Parked | TBD | TBD | TikTok automation — P3 |

**Status:** 🟢 Active · 🟡 In Progress · 🔵 Concept · 🔴 Parked

---

## Shared Tech Conventions

**All projects:**
- Auth: Firebase Auth (Google SSO preferred)
- Database: Firestore
- UI: React + Tailwind CSS (never TS)
- Hosting: Vercel (Next.js) or Firebase Hosting
- Naming: `ashish-<slug>` for Firebase/GitHub, `~/<slug>/` or `~/ashish-<slug>/` local

**Key patterns:**
- App Router only (no pages/)
- JavaScript (.js) — no TypeScript files
- Path alias: `@/` → `src/`
- Every project gets own GitHub repo + Firebase project
- All deployments managed through respective platforms (Vercel/Firebase)

**Project-specific stacks:** See MEMORY.md for active project details

---

## Session Memory — Load in Order at Start

| File | Purpose |
|---|---|
| `SOUL_BASE.md` | Core principles, behavioral protocols, LLM routing rules |
| `SOUL_ARES.md` | ARES architecture, agent tiers, Firebase rules |
| `SOUL.md` | Working style, preferences, build philosophy |
| `permanent.json` | Agency facts + client data (Centre Willow, Goldwater Law) |
| `CONTEXT.md` | Live session state — current tasks, Firebase state, build order |
| `PROJECT_STATUS.md` | Tiered milestones: daily/weekly/monthly + open items |
| `rolling_summary.md` | Last 3 session summaries — what done, next steps |
| `MEMORY.md` | Cross-project memory index — organized by topic |

**Cold-start rule:** End of every session → upload all memory to Drive folder `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`

---

## Organization Rules

1. **New idea** → Drive doc first, then Firebase project when ready
2. **Every project** → own GitHub repo + Firebase project (clean isolation)
3. **This file** → router only (details live in memory files + project docs)
4. **Status updates** → keep Project Registry current
5. **Shared patterns** → document in MEMORY.md by topic, not CLAUDE.md
6. **Drive references** → specific docs stay in Drive, this file links via folder ID only
