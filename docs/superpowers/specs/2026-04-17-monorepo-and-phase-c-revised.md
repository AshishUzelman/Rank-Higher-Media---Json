# Monorepo Migration + Phase C Revised — Design Spec

**Date:** 2026-04-17 (Session 16)
**Status:** Approved — ready to execute
**Supersedes:** `docs/superpowers/plans/2026-04-17-ares-phase-c.md` (greenfield assumptions, retired)

---

## Decision 1: Monorepo Migration (Option A)

**Goal:** One workspace. Claude Code + Qwen see everything in a single session.

**Layout:**
```
rank-higher-media/          ← one .git (the shell)
├── ares/                   ← git subtree (ashish-ares, full history preserved)
├── site/                   ← RHM Next.js marketing site (moved from root)
├── CLAUDE.md               ← updated paths
├── MEMORY.md               ← updated paths
├── soul files (SOUL_*.md, CONTEXT.md, rolling_summary.md, PROJECT_STATUS.md)
└── scripts/                ← shared utilities (compile_memory, etc.)
```

**Why Option A over alternatives:**
- Keeps `ashish-ares` GitHub intact (can still push back via `git subtree push`)
- No submodule footguns
- No `apps/` nesting (YAGNI — no shared packages needed yet)
- Solves worktree problem (ares/ was invisible in Claude Code worktrees as nested repo)

**Migration steps (surgical, 5 steps):**
1. Safety: `git push origin main` in `ares/` (mirror current state to GitHub)
2. Move site files: `git mv` RHM Next.js root files → `site/`
3. Archive nested repo: move `ares/.git` to `/tmp/ares-git-backup`, then `rm -rf ares/`
4. Pull in as subtree: `git subtree add --prefix=ares https://github.com/AshishUzelman/ashish-ares.git main --squash`
5. Update path refs in `CLAUDE.md` and `MEMORY.md` (`~/rank-higher-media/ares/` refs remain valid ✅)
6. Smoke test: `cd ares && npm run ares-start` works

**What won't break:**
- `agent_connector.js` relative paths (`../agent_inbox`) — survive the move ✅
- Firebase config (project ID based, not path-based) ✅
- `.env.local` (local file, not hardcoded) ✅

**What needs updating:**
- `CLAUDE.md` project registry — RHM local path note
- `MEMORY.md` active repos table
- Vercel: if RHM site was deployed, update root directory to `site/` in Vercel dashboard

---

## Decision 2: Phase C Revised Scope

**Finding:** The 5-phase loop is largely already built.
- RESEARCH: wired in `load_context.js` section 5, runs unconditionally ✅
- DRAFT: `runOllamaWorker()` in `agent_connector.js` ✅
- CRITIC + REFINE: `runActorCriticLoop()` ✅
- SUPERVISOR: gemma3 review + requeue loop (max 3 retries → escalate) ✅

**The old Phase C plan assumed greenfield — wrong. Phase C is verification, not construction.**

**Revised Phase C — 3 tasks:**

### Task 1: Audit
- Read `agent_connector.js` in full
- Confirm all 5 phases fire in the correct sequence
- Map the actual execution flow with line references
- Note any gaps, dead code paths, or uncalled branches

### Task 2: Run
- Drop a non-trivial test task into `agent_inbox/`
- Watch all 5 phases execute (Ollama must be running)
- Capture logs proving each phase fired: RESEARCH context loaded, DRAFT produced, CRITIC scored, REFINE applied, SUPERVISOR approved/rejected
- If SUPERVISOR rejects: confirm requeue fires correctly

### Task 3: Fix + Document
- Patch only what broke during Task 2
- Write `ares/docs/verified-flow.md`: one page, confirmed execution path, what each phase actually does
- Update `PROJECT_STATUS.md` Phase C as complete

**Success criteria:**
- One non-trivial task flows end-to-end without manual intervention
- Logs show all 5 phases fired
- `verified-flow.md` exists and is accurate

---

## Hosting Context (for reference)

- `rankhighermedia.com` → WHC (traditional hosting + email) — Next.js site not actively deployed here
- `raisedigitalmetrics.com` → Vercel (new marketing site, Next.js)
- ARES dashboard → Firebase Hosting (`ashish-ares`) / localhost
- ARES domain question: TBD, not blocking

---

## Out of Scope

- `apps/` monorepo tooling, workspaces, yarn PnP — not needed yet
- Phase B (dreaming loop) — after Phase C is verified
- Phase A (dashboard) — after Phase B
- RHM domain migration — separate task
