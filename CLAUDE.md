# Ashish Uzelman — Master CLAUDE.md

## Who I Am
Digital entrepreneur, SEM/PPC expert, and product builder. I run **Rank Higher Media** (SEM agency) and am actively building multiple AI-assisted web products. I work across several Google accounts and Firebase projects. Context continuity across sessions is critical — this file is the source of truth.

**Accounts:**
- `ash.revolution@gmail.com` — Primary / Rank Higher Media
- `mindchallengerai@gmail.com` — Mind Challenger AI project
- `ashish.uzelman@gmail.com` — Drive storage / planning docs

**Google Drive (planning docs):** `ash.revolution@gmail.com` → My Drive

---

## Project Registry

| Project | Status | Stack | Firebase | Notes |
|---|---|---|---|---|
| Rank Higher Media | 🟢 Active | Next.js 15, React 19, Tailwind | TBD | Current repo — SEM agency marketing site |
| Ad Creator Web App | 🟡 Planned | TBD | TBD | Full technical spec in Drive ("Breakdown on how to create ad creative site") |
| Mind Challenger AI | 🟡 In Progress | TBD | `mindchallengerai` account | Separate Gmail + Firebase account |
| Pricing SaaS | 🔵 Concept | TBD | TBD | Drive folder exists |
| SEED Initiative | 🔵 Concept | TBD | TBD | SEO services proposal in Drive |
| ARES (SEO Auditor) | 🟡 Planned | TBD | `ashish-ares` | SEO Auditor — formerly "Opal". Drive folder has spec + mockups |
| Children with Anxiety | 🔵 Concept | TBD | TBD | Drive folder exists |

**Status key:** 🟢 Active · 🟡 In Progress/Planned · 🔵 Concept · 🔴 On Hold

---

## Current Codebase — Rank Higher Media

### Tech Stack
- **Framework**: Next.js 15 (App Router, standalone output)
- **UI**: React 19 + Tailwind CSS 3
- **Icons**: lucide-react
- **Language**: JavaScript (no TypeScript — jsconfig.json with `@/*` → `src/*`)
- **Linting**: ESLint with eslint-config-next
- **Image processing**: sharp

### Project Structure
```
src/
  app/
    layout.js        # Root layout (imports globals.css)
    page.js          # Home page entry
    globals.css      # Global styles
  components/
    RankHigherMedia.js  # Main marketing page component
```

### Dev Commands
```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run start  # Serve production build
```

### Key Conventions
- **App Router only** — no `pages/` directory
- **JavaScript** (`.js`) — do not add `.ts`/`.tsx` files
- Path alias: `@/` maps to `src/`
- `next.config.js`: `output: 'standalone'` and `trailingSlash: true` — keep both
- Tailwind only for styling — no CSS Modules or inline styles
- Components live in `src/components/`
- `node_modules/` and `.next/` are gitignored — never commit them

### Deployment
- Vercel (standalone output configured)
- GitHub: `https://github.com/AshishUzelman/Rank-Higher-Media---Json`
- Default branch: `claude/intelligent-torvalds` (single branch — `main` not yet set up)

---

## Firebase Hosting Workflow

Each new project idea gets its own Firebase project for clean isolation.

### Spin Up a New Project
```bash
# 1. Install Firebase CLI if needed
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Create new project (do this in Firebase Console or CLI)
firebase projects:create <project-id>

# 4. Initialize hosting in the project folder
firebase init hosting

# 5. Deploy
firebase deploy
```

### Naming Convention
- Firebase project ID: `ashish-<project-slug>` (e.g. `ashish-ad-creator`, `ashish-pricing-saas`)
- Local folder: `~/projects/<project-slug>/`
- Each project gets its own GitHub repo

---

## Shared Skills Across Projects
These patterns carry over to every project — Claude should apply them by default:

- **Auth**: Firebase Auth (Google SSO preferred)
- **Database**: Firestore
- **Hosting**: Firebase Hosting (or Vercel for Next.js)
- **UI**: React + Tailwind CSS (consistent design language)
- **AI integration**: Google AI Studio / Gemini API
- **Domain**: SEM, PPC, digital marketing context throughout

---

## Key Drive Documents
| Document | Location | Description |
|---|---|---|
| Ad Creator Web App Spec | My Drive (search "Breakdown on how to create ad creative site") | Full 11-section technical spec |
| Website that builds ads | My Drive | Related ad tool concept |
| Trello Rules for Organization | My Drive | Project org system notes |
| Building SEO Tools and Reports | Resume folder | SEO tooling ideas |
| SEED Initiative Proposal | Seed Initiative folder | SEO services business plan |

---

## Session Memory
> 📋 **See `CONTEXT.md`** for the live session log, ongoing tasks, and current state.
> 🧠 **See `SOUL.md`** for Ashish's preferences, working style, and best practices.
> Claude must read both `CONTEXT.md` and `SOUL.md` at the start of every session.

---

## Organization Rules
1. **Every new idea** → Create a Drive doc first, then a Firebase project when ready to build
2. **Every project** → Gets its own GitHub repo and Firebase project
3. **This CLAUDE.md** → Lives in the Rank Higher Media repo but covers all projects
4. **Status updates** → Update the Project Registry table above when things change
5. **Shared components** → Document reusable patterns here so they carry across sessions
