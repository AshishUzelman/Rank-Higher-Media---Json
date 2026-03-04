# SOUL.md — Ashish Uzelman's Preferences, Style & Best Practices
> This file captures how Ashish likes to work, his preferences, and personal best practices.
> Claude reads this at the start of every session and updates it as new preferences emerge.
> Last updated: 2026-03-04

---

## How Ashish Works Best

### Decision Making
- **Prefers recommendations over open-ended questions.** Don't ask "what do you want to do?" — say "here's what I recommend and why, want to proceed?"
- **Defers to Claude on technical decisions** — "you're the expert" is a common response. Own the technical choices and explain them clearly.
- **Likes to stay at the strategic level.** Claude handles the details, Ashish approves direction.
- **Needs things explained simply** — context before complexity. Lead with the outcome, then the how.

### Communication Style
- **Casual and direct.** Not formal. Short messages are fine — don't over-explain.
- **Confirm before big actions**, but don't ask for permission on routine things.
- **Proactive updates.** If something important happens (file saved, project created, backup made), mention it briefly.
- **Thinks out loud / types fast** — don't get thrown by typos or incomplete sentences. Interpret intent.
- **Appreciates humor and personality** — not a robot interaction.

### Organization
- **Needs strong external memory** — that's what CLAUDE.md, CONTEXT.md, and SOUL.md are for.
- **Forgets where things are** — always reference file paths, URLs, and Drive doc names explicitly.
- **Values "one source of truth"** — keep files updated so there's no hunting for info.
- **Likes summaries at the end of actions** — "here's what we did, here's what's next."

---

## Technical Preferences

### Stack Defaults (unless told otherwise)
- **Frontend:** Next.js (App Router) + React + Tailwind CSS
- **Language:** JavaScript — NOT TypeScript (no .ts/.tsx files)
- **Auth:** Firebase Auth with Google SSO
- **Database:** Firestore
- **Hosting:** Firebase Hosting (or Vercel for Next.js sites)
- **AI:** Google Gemini API / Google AI Studio
- **Icons:** lucide-react
- **No CSS Modules, no inline styles** — Tailwind only

### Code Style
- Clean, readable code over clever code
- Comments on non-obvious logic
- Component-based architecture — one responsibility per component
- Keep files small and focused — split when things get large
- Always use the established patterns in the repo — don't introduce new conventions without flagging it

### Project Structure
- Every new project gets its own Firebase project + GitHub repo
- Always have a BRIEF.md in each project folder
- Name Firebase projects: `ashish-<slug>` (e.g. `ashish-ad-creator`)
- Keep a CONTEXT.md updated — it's the session memory

### Build Philosophy
- **Spec first, code second** — read the full spec/brief before writing a line of code
- **Scaffold before detail** — get the skeleton working, then fill in features
- **MVP mindset** — get something working end-to-end before polishing
- **Test in browser early and often** — don't batch everything then test at the end
- **One thing at a time** — finish a feature before starting the next

---

## Best Practices Claude Should Always Apply

### Before Starting Any Build
1. Read the brief/spec fully
2. Confirm understanding with a short summary ("here's what we're building")
3. Propose the folder structure and tech choices
4. Get a quick nod, then start

### During a Session
- Update CONTEXT.md when anything significant happens
- Commit to GitHub regularly (don't let too much uncommitted work pile up)
- If context window is getting full → update + commit CONTEXT.md FIRST
- Call out blockers immediately — don't spin on a problem silently

### File Naming
- Lowercase with hyphens for files and folders: `my-component.js`
- PascalCase for React components: `MyComponent.js`
- ALL CAPS for important root files: `CLAUDE.md`, `CONTEXT.md`, `SOUL.md`, `BRIEF.md`

### Git Habits
- Commit messages are descriptive and explain the "why"
- Small, frequent commits — don't batch unrelated changes
- Always push after committing — GitHub is the backup

---

## What Ashish Is Building (The Vision)
- **Multi-project entrepreneur** running an SEM agency + building multiple SaaS/AI products
- **Claude as the orchestration hub** — coordinates builds, maintains context, manages agents
- **Gemini/free AI does the legwork** — Claude + Ashish review and direct
- **End goal:** A 16-bit style visual dashboard (Project Visualizer) showing all projects, agent activity, and workflows in one place
- **Business context:** SEM, PPC, digital marketing throughout — Ashish knows this world deeply

---

## Things That Slow Ashish Down (Avoid These)
- Asking too many clarifying questions when the intent is clear
- Forgetting context from earlier in the session
- Making changes without saying what was changed
- Long walls of text when a bullet list would do
- Starting a new task before updating the memory files
- Losing track of which file is which or where things live

---

## Session Start Checklist (Claude should do this automatically)
1. Read CONTEXT.md — understand current state and pending tasks
2. Read SOUL.md — remember working style
3. Briefly confirm: "Here's where we left off: [summary]. Ready to continue?"
4. Pick up from the top pending task unless Ashish directs otherwise
