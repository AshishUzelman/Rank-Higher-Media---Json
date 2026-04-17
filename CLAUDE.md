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

---

# Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

**Applies to:** All code work, all projects. **Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks (typos, one-liners), use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let me loop independently. Weak criteria ("make it work") require constant clarification.
