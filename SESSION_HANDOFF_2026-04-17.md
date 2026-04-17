# Session Handoff — 2026-04-17 (Session 16 checkpoint)

> Read this FIRST when resuming. Captures architecture decision + resume protocol.

---

## What Happened This Session

1. **Read Phase C design spec** (`ares/docs/superpowers/specs/2026-04-17-ares-pipeline-completion-design.md`)
2. **Invoked `superpowers:writing-plans`** → drafted Phase C plan at `docs/superpowers/plans/2026-04-17-ares-phase-c.md` (41KB, 9 tasks, TDD-style)
3. **Discovered major structural mismatch:** Phase C plan assumed greenfield build in RHM's `scripts/`, but:
   - `~/rank-higher-media/ares/` is a **separate nested git repo** (remote: `ashish-ares`) with 27 scripts, `agent_inbox/`, `agent_outbox/`, `corrections/`, existing `agent_connector.js`, Firebase wiring
   - Worktree had empty `ares/` because nested repo isn't tracked by parent RHM
   - My plan would have duplicated existing infrastructure

4. **Strategic pivot from user:** RHM becomes the **shell/monorepo home** for all projects. ARES moves in. `raisedigitalmetrics.com` (owned, Firebase-hosted) takes over the marketing-site role from `rankhighermedia.com`.

5. **Saved state** (this doc + Phase C plan committed) to resume cleanly.

---

## Architecture Decision (pending final sign-off)

**Recommendation:** Git subtree monorepo, `apps/` layout.

```
rank-higher-media/                single .git — the shell
├── apps/
│   ├── site/                     current RHM marketing site (moved from root)
│   ├── ares/                     pulled in via git subtree, full history preserved
│   └── (raise-digital-metrics/   future — your Firebase URL)
├── packages/                     future shared code
├── docs/                         project-wide
├── memory files (SOUL_*, CONTEXT.md, MEMORY.md, rolling_summary.md)
├── scripts/                      shared utilities (compile_memory, etc.)
```

**Why subtree over alternatives:**
- Preserves ARES git history (66+ commits including Gemini integration, Phase C spec)
- One `.git`, one worktree tree, one hook set — operationally simple
- Can still push ARES changes back to `ashish-ares` remote via `git subtree push` (optional mirror)
- No submodule footguns

**Open question:** What does `rankhighermedia.com` display post-migration?
- User note: "I guess that's going to be raise digital metrics now, so it won't matter"
- **Decision deferred:** RHM domain purpose TBD (could be portfolio/shell view, redirect, or private dashboard). Not blocking.

---

## Resume Protocol (RUN THESE IN ORDER)

When resuming, before executing any migration or Phase C work:

### Step 1: Invoke `superpowers:brainstorming` on the monorepo design

Pressure-test the subtree decision:
- Are there simpler approaches? (flat copy, keep separate with better cross-refs?)
- What breaks when ARES moves? (Vercel deploys, Firebase config paths, `.env.local` references, agent_connector paths, hooks)
- Is `apps/` prefix worth the depth cost vs. top-level `ares/` and `site/`?

**Command:** invoke the skill and brainstorm with the user.

### Step 2: Apply Karpathy principles to BOTH the migration plan AND Phase C plan

- **Think Before:** Walk every breakage scenario before moving files
- **Simplicity:** Don't build monorepo tooling (workspaces, yarn PnP) unless needed
- **Surgical:** Minimal diff; extend existing ARES code instead of rewriting
- **Goal-Driven:** Goal is "verify 5-phase loop end-to-end" — everything else is support

### Step 3: Revise Phase C plan against real ARES codebase

Current plan (`docs/superpowers/plans/2026-04-17-ares-phase-c.md`) is **greenfield-assumption**. Before executing:
- Read actual `~/rank-higher-media/ares/scripts/agent_connector.js`
- Read existing phase implementations (spec claims 4/5 exist: DRAFT, CRITIC, REFINE, SUPERVISOR)
- Read `memory_config.js`, `gemini_provider.js`, `log_correction.js`
- Re-scope Phase C tasks to: audit → activate RESEARCH only → wire end-to-end → verify → document
- Drop tasks that rebuild existing files

### Step 4: Execute migration (only after steps 1-3 sign-off)

Subtree migration sequence:
1. Safety snapshot: `cd ~/rank-higher-media/ares && git push origin main` (mirror current ARES state to GitHub)
2. `cd ~/rank-higher-media && mkdir -p apps && git mv <site files> apps/site/`
3. Retire nested `ares/`: archive its `.git`, then remove the folder
4. `git subtree add --prefix=apps/ares https://github.com/AshishUzelman/ashish-ares.git main`
5. Update Vercel config → deploy from `apps/site/`
6. Update `CLAUDE.md`, `MEMORY.md`, path references
7. Smoke test: ARES starts, site builds

### Step 5: Execute revised Phase C plan

---

## Files Saved This Session

- `docs/superpowers/plans/2026-04-17-ares-phase-c.md` — Phase C implementation plan (greenfield draft, needs Step 3 revision)
- `SESSION_HANDOFF_2026-04-17.md` — this file

## Untouched (user's pending work)

- `CLAUDE.md` — modified (your edit)
- `ares` submodule — modified
- `ARES_HANDOFF.md`, `PROJECT_FOLDER_MAP.md` — untracked, predate this session

---

## Context for Next Session

**Domain / URL ownership:**
- `rankhighermedia.com` — was marketing site; now becomes shell/hub (display purpose TBD, low priority)
- `raisedigitalmetrics.com` — new marketing site, Firebase-hosted, takes over lead-gen role
- ARES runs locally on laptop (Firebase: `ashish-ares` for dashboard)

**Projects on laptop:**
- `~/rank-higher-media/` — this shell (will absorb ARES)
- `~/rank-higher-media/ares/` — ARES (will be moved in via subtree)
- `~/ad-creator/` — sibling, stays separate for now
- `~/ashish-skills/`, `~/ashish-karpathy-skills/` — siblings, stay separate

**User preference:** Local-first development on laptop.
