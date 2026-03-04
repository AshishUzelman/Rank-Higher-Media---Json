# Claude Session Context — Ashish Uzelman
> ⚠️ READ THIS FIRST at the start of every session. Update it before ending.
> Last updated: 2026-03-04

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

### ash.revolution@gmail.com — 1/5 used ✅ confirmed 2026-03-04
| Slot | Project ID | Status | Notes |
|---|---|---|---|
| 1 | rank-high-media | ✅ Exists | SEM agency site (actual ID: rank-high-media) |
| 2 | ashish-ad-creator | 🔲 To create | Ad Creator Web App |
| 3 | ashish-ares | 🔲 To create | ARES — SEO Auditor tool |
| 4 | ashish-hub | 🔲 To create | Project Visualizer / Dashboard |
| 5 | (reserved) | — | Keep free for now |

### Other accounts — to verify
| Account | Known Projects | Notes |
|---|---|---|
| `mindchallengerai@gmail.com` | Mind Challenger AI | Separate Firebase account |
| `ashish.uzelman@gmail.com` | Maze? | Need to check — Maze may live here |

---

## Active Projects
| Project | Status | Repo | Firebase | Priority |
|---|---|---|---|---|
| Rank Higher Media | 🟢 Active | Rank-Higher-Media---Json | rank-higher-media | 2 |
| Ad Creator Web App | 🟡 Planned | TBD | ashish-ad-creator | 1 (full spec in Drive) |
| ARES (SEO Auditor) | 🟡 Planned | TBD | ashish-ares | 2 (spec + mockups in Drive/Opal folder) |
| Project Visualizer | 🔵 Build last | TBD | ashish-hub | 3 (build after AD Creator + ARES) |
| Mind Challenger AI | 🟡 In Progress | TBD | mindchallengerai account | — |
| Pricing SaaS | 🔵 Concept | TBD | TBD | — |
| SEED Initiative | 🔵 Concept | TBD | TBD | — |
| Children with Anxiety | 🔵 Concept | TBD | TBD | — |

---

## Build Order
1. **Set up Firebase** — create 3 new projects (ashish-hub, ashish-ad-creator, ashish-ares)
2. **Ad Creator** — full technical spec exists in Drive ("Breakdown on how to create ad creative site")
3. **ARES** — SEO Auditor, spec + mockups in Drive (folder was called "Opal", project renamed to ARES)
4. **Visualizer** — build last, once real projects exist to display

---

## Repo Structure (Rank Higher Media = Hub)
```
/                   ← Next.js 15 marketing site (Rank Higher Media)
/CLAUDE.md          ← Master project context
/CONTEXT.md         ← THIS FILE — session memory, updated every session
/skills/            ← Reusable Claude skills & agent prompts
/projects/
  /ad-creator/      ← BRIEF.md (next to build)
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
| ARES Spec | Drive → Opal folder → "SEO Auditor" file (58KB) | + 2 mockup images |
| Website that builds ads | Search Drive | Related ad tool concept |
| SEED Initiative Proposal | Drive → Seed Initiative folder | SEO services business |

---

## Session Log
### 2026-03-04
- Created CLAUDE.md (master context file)
- Fixed .gitignore — removed node_modules + .next from git history
- Set up gh CLI, authenticated with GitHub
- Mapped all Drive folders and projects
- Created /skills and /projects skeleton structure
- Renamed Opal → ARES (SEO Auditor)
- Created CONTEXT.md (this file)
- Confirmed Firebase on ash.revolution@gmail.com: 1/5 slots used (rank-high-media only)
- Maze project is NOT on primary account — likely on ashish.uzelman@gmail.com
- **Next:** Create 3 Firebase projects on ash.revolution@gmail.com, then scaffold Ad Creator

---

## Ongoing Tasks
- [x] Reconnect Chrome — resolved
- [x] Confirmed Firebase account: ash.revolution@gmail.com has 4 free slots
- [ ] Check ashish.uzelman@gmail.com Firebase for Maze project
- [ ] Search Drive for ARES/ARES files to confirm full project name
- [ ] Create Firebase project: `ashish-hub`
- [ ] Create Firebase project: `ashish-ad-creator`
- [ ] Create Firebase project: `ashish-ares`
- [ ] Read full Ad Creator spec from Drive into projects/ad-creator/BRIEF.md
- [ ] Read ARES spec from Drive into projects/ares/BRIEF.md
- [ ] Set up `main` branch on GitHub as base branch
- [ ] Update CLAUDE.md Firebase column once projects are created
