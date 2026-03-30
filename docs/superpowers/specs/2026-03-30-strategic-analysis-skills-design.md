# Strategic Analysis Skills System — Design Spec
**Date:** 2026-03-30
**Author:** Ash / Claude
**Status:** Approved — ready for implementation planning

---

## 1. Overview

A 3-skill system for competitive and strategic analysis, living in `ashish-skills/strategic/`.
Built as Claude Code skills now. Designed to be ARES agent-compatible when the program is built.

### What We're Replacing / Building Toward
These skills will produce the analysis that Ahrefs/Semrush/Similarweb deliver as platform features —
but structured around Ashish's methodology (E.E.A.T, helpful content, FAQ demand intelligence)
and exportable as client-ready deliverables.

### What's NOT in Scope (this sprint)
- The local Next.js program that runs these as automated pipelines (next project)
- ARES integration (follows after program is built)
- API key management / credential storage

---

## 2. Skill Architecture

```
strategic-intake  (Director)
      ↓ work-order.md
competitive-intel  (Worker 1)
      ↓ intel-brief.md
strategic-analysis  (Worker 2)
      ↓ framework reports + summary + slides-outline.md
```

### Folder location in ashish-skills repo
```
ashish-skills/
  strategic/
    strategic-intake/
      SKILL.md
      references/
        intake-questions.md     ← full question bank + scoring logic
        framework-selector.md   ← which frameworks map to which goals
    competitive-intel/
      SKILL.md
      references/
        datasources.md          ← API sources, what each pulls, fallbacks
        intel-brief-template.md ← output format spec
    strategic-analysis/
      SKILL.md
      references/
        frameworks/
          pestel.md
          swot.md
          tows.md
          soar.md
          vrio.md
          gap-analysis.md
          five-forces.md
          competitor-analysis.md
        report-format.md        ← section templates for each framework
        slides-outline.md       ← PPT structure per report type
```

### Output folder structure (per client)
Base path: `~/rank-higher-media/clients/` (local, gitignored — client data never commits)
```
clients/
  [client-slug]/
    intake.md                   ← strategic-intake output (persists, updated each engagement)
    _index.md                   ← latest summary + run history log
    [YYYY-MM-DD]/
      work-order.md             ← what was requested + what was run
      intel-brief.md            ← competitive-intel output
      [framework].md            ← one file per framework run (e.g. pestel.md, swot.md)
      summary.md                ← synthesized narrative across all frameworks
      slides-outline.md         ← PPT structure suggestion
```

---

## 3. Skill Specs

### 3.1 `strategic-intake` — Director / Onboarding

**Trigger phrases:**
- "new client [company]"
- "onboard [company]"
- "what analysis do I need for [client/goal]"
- "strategic intake for [company]"

**What it does:**
1. Asks 6–8 structured intake questions (one at a time)
2. Scores the answers against a framework selector matrix
3. Recommends which frameworks to run and why — explains the reasoning
4. Outputs a `work-order.md`: ordered list of skills to run, competitors to target, final deliverable goal
5. Saves `intake.md` to `clients/[client-slug]/intake.md`

**Key intake question categories:**
- Business stage (new market entry / growth / defense / restructure)
- Competitive maturity (do they know their competitors? any intel already?)
- Decision being made (pricing, market entry, product launch, positioning, budget allocation)
- Industry / regulatory environment (flags PESTEL complexity)
- Internal resource clarity (flags VRIO need)
- Time horizon (short-term wins vs. long-term positioning)

**Framework selector logic (in references/framework-selector.md):**
| Goal | Recommended Frameworks |
|------|----------------------|
| New market entry | PESTEL + Five Forces + VRIO |
| Competitive positioning | Competitor Analysis + SWOT + TOWS |
| Growth planning | SOAR + Gap Analysis + TOWS |
| Resource/capability audit | VRIO + Gap Analysis |
| Annual strategy review | SWOT + PESTEL + TOWS + Five Forces |
| Quick competitive snapshot | Competitor Analysis + SWOT |

**Output:** `work-order.md` + `intake.md`

---

### 3.2 `competitive-intel` — Worker 1 / Data Collection

**Trigger phrases:**
- "pull intel on [URL/company]"
- "competitive brief for [client]"
- "research [company]'s competitors"
- "run competitive intel"

**What it does:**
Structured data collection across 5 intelligence categories. Guides Ashish on what to pull from each tool (with API patterns for ARES later). Outputs a standardized `intel-brief.md`.

**Intelligence categories + data sources:**

| Category | Primary Source | What to Pull |
|----------|---------------|--------------|
| Traffic & market share | Similarweb API | Total visits, traffic sources, top pages, bounce rate, geography |
| Ad strategy | SpyFu API | PPC keywords, ad copy history, estimated spend, organic vs paid split |
| SEO & keywords | DataForSEO API | Keyword rankings, PAA questions, backlink profile, domain authority |
| Tech stack | Wappalyzer API | CRM, analytics, CMS, payment processor, chat tools |
| Audience & content | BuzzSumo + SparkToro | Top content by engagement, audience hangouts, influencers |
| Search demand | Google Trends + AnswerThePublic | Trend direction, seasonal patterns, FAQ demand |
| Brand sentiment | Brandwatch (if available) | Sentiment score, share of voice, key themes |

**E.E.A.T lens applied to intel:**
For each competitor, note:
- Evidence of Experience (case studies, original data, author credentials)
- Evidence of Expertise (depth of content, certifications shown)
- Evidence of Authority (backlinks from industry sources, press mentions)
- Evidence of Trust (reviews, guarantees, contact info visibility)

**FAQ demand intelligence (Ashish's methodology):**
Pull top PAA questions for the client's core service terms. These reveal what customers actually worry about — not what the client thinks they care about. Example: "how to save on fuel for truck fleet" reveals the real entry point for a connected vehicle client.

**Output:** `intel-brief.md` with all sections completed or flagged as unavailable

---

### 3.3 `strategic-analysis` — Worker 2 / Framework Execution

**Trigger phrases:**
- "run PESTEL for [client]"
- "full strategic analysis for [client]"
- "SWOT on [company]"
- "run the frameworks from the work order"
- "analyze [client] using [framework]"

**What it does:**
Takes `intel-brief.md` (or manual data paste) as input. Runs one or more strategic frameworks. Produces individual framework reports + a synthesized summary + slides outline.

**Frameworks (each in references/frameworks/):**

| Framework | Purpose | When to Use |
|-----------|---------|-------------|
| Competitor Analysis | Side-by-side competitive comparison | Always — baseline |
| SWOT | Internal/external snapshot | Starting point for strategy sessions |
| PESTEL | Macro-environment factors | Market entry, annual planning, regulated industries |
| TOWS | Action strategies from SWOT | When SWOT exists and needs to become a plan |
| SOAR | Strength/growth focus | Growth planning, positive culture initiatives |
| VRIO | Resource competitive advantage | Positioning, capability audits, pricing strategy |
| Gap Analysis | Current vs desired state | Performance improvement, product roadmaps |
| Five Forces | Industry competition structure | Market entry, competitive intensity assessment |

**Per-framework output structure:**
Each framework report contains:
1. Data inputs used (from intel-brief or manual)
2. Framework grid / matrix (completed)
3. Key findings (3–5 bullets)
4. Strategic implications (what this means for the client)
5. Recommended actions (prioritized High/Medium/Low)

**Summary output (summary.md):**
- Executive overview (3–5 sentences, plain language)
- Top 3 strategic priorities across all frameworks
- Risks to watch
- Quick wins (this month)
- Full action list with priority + effort scores

**Slides outline (slides-outline.md):**
Suggested PPT deck structure with:
- Slide title
- What goes on it (bullet points or visual type)
- Data source reference
- Speaker notes suggestion

Standard deck structure:
1. Title / engagement overview
2. Market context (PESTEL summary)
3. Competitive landscape (Competitor Analysis + Five Forces)
4. Client position (SWOT)
5. Strategic options (TOWS)
6. Resource advantages (VRIO)
7. Gap analysis / opportunity map
8. Priority action plan
9. Next steps + timeline

---

## 4. Data Sources Reference

### Philosophy: DataForSEO-first, free APIs to fill gaps

DataForSEO covers ~75% of what's needed. Everything else is either a free API or a manual browser pull. No paid subscriptions beyond DataForSEO required.

---

### Tier 1 — DataForSEO (primary data engine)
DataForSEO has dedicated APIs for all of these — use these first before anything else.

| Intelligence Need | DataForSEO API | Notes |
|-------------------|---------------|-------|
| Keyword research | Google Ads API + DataForSEO Labs API | Volume, CPC, difficulty, trends |
| SERP data | SERP API | Organic, maps, news, images, video |
| People Also Ask (PAA) | SERP API (people_also_ask_element) | FAQ demand intelligence — core to Ashish's methodology |
| Competitor keyword gaps | DataForSEO Labs API | Domain vs domain comparison |
| Backlink analysis | Backlinks API | 2.1T+ live backlinks, history back to 2019 |
| Tech stack detection | Domain Technologies API | CRM, analytics, CMS, payment, chat tools |
| Competitor ads (Google) | Ads Transparency API | Historical + active Google Ads, ad copy, creative |
| Traffic estimates | DataForSEO Labs API | Domain-level traffic estimation |
| On-page analysis | On-Page API | Technical SEO, content analysis |
| Content Analysis | Content Analysis API | Topic coverage, E-E-A-T signals |
| Brand/LLM mentions | AI Optimization Data API | Tracks brand mentions in LLM outputs |

---

### Tier 2 — Free APIs (programmatic, zero cost)
These complement DataForSEO and add data it doesn't cover.

| Tool | What It Provides | API Access | Notes |
|------|-----------------|-----------|-------|
| Google Search Console API | Client's own queries, clicks, impressions, positions | Free, OAuth2 | Mandatory for any client whose GSC you manage |
| BuiltWith Free API | Tech stack verification | Free, 1 req/sec, requires account | Returns category/group counts; detailed breakdown needs paid |
| Reddit API | Audience communities, real customer language, pain points | Free (non-commercial OAuth) | 100 queries/min authenticated — ideal for FAQ demand research |
| trendspyg | Google Trends data | Free open-source Python library | Replacement for archived pytrends; active maintenance |
| Google Ads Transparency | Competitor Google ad creatives | Via DataForSEO Ads Transparency API | Google has no official API; DataForSEO wraps it |

---

### Tier 3 — Free browser-based (manual pulls, paste into skill)
No API. Ashish pulls manually and pastes data into the skill session.

| Tool | What It Provides | Free Limit | Notes |
|------|-----------------|-----------|-------|
| Meta Ad Library | Competitor Facebook/Instagram ads | Unlimited | Browser only; no API for commercial ads |
| SparkToro | Where audiences hang out online | 50 searches/month | No API — automation prohibited |
| AnswerThePublic | FAQ question visualization | 3 searches/day | No API by design; PAA via DataForSEO is better anyway |
| Think With Google | Consumer trend reports, industry data | Unlimited | Browser content only, no API |
| Google Trends (browser) | Trend direction, seasonal patterns | Unlimited | Use trendspyg for programmatic; manual for quick checks |
| Social Searcher | Basic brand sentiment | 100 keyword requests | Browser only; good for spot checks |

---

### What this stack replaces (and why we don't need them)

| Tool You Listed | Why We Don't Need It | What Covers It Instead |
|-----------------|---------------------|------------------------|
| Similarweb | Expensive subscription | DataForSEO Labs API (traffic estimates) |
| SpyFu | Paid subscription | DataForSEO Ads Transparency API |
| Wappalyzer (paid) | Paid | DataForSEO Domain Technologies API + BuiltWith free API |
| GWI | Enterprise subscription | Reddit API (real audience language) + Think With Google |
| Statista | Paywalled stats | Manual: Think With Google, IBISWorld free reports, StatCounter |
| BuzzSumo | Paid subscription | DataForSEO Content Analysis API + trendspyg |
| Brandwatch | Enterprise | DataForSEO AI Optimization API + Social Searcher (manual) |

---

### Skills-phase data collection (before program is built)
During the skills phase, data collection is guided but manual:
- DataForSEO: Ashish runs API calls directly or uses existing patterns from seo-audit-workflow
- GSC: Ashish exports from client's GSC and pastes the data
- BuiltWith: Quick API call or browser lookup
- Reddit: Manual search, paste relevant threads
- Everything else: Manual browser pull → paste into skill session
- Skills prompt Ashish on exactly what to pull from each source

---

## 5. What's Covered (Completeness Check)

### Frameworks requested ✅
- [x] Competitor Analysis
- [x] SWOT
- [x] PESTEL
- [x] TOWS
- [x] SOAR
- [x] VRIO
- [x] Gap Analysis
- [x] Five Forces

### Intelligence categories ✅
- [x] Traffic benchmarking (Similarweb)
- [x] Ad strategy (SpyFu)
- [x] SEO/keywords (DataForSEO)
- [x] Tech stack (Wappalyzer)
- [x] Audience research (SparkToro, GWI)
- [x] Content performance (BuzzSumo)
- [x] Search demand + FAQ (Google Trends, AnswerThePublic, DataForSEO PAA)
- [x] Brand sentiment (Brandwatch)

### Methodology ✅
- [x] E.E.A.T lens applied to competitor evaluation
- [x] Helpful content / FAQ demand intelligence
- [x] Ashish's "what customers actually search" methodology

### Deliverables ✅
- [x] Individual framework reports
- [x] Summary narrative
- [x] PPT slides outline
- [x] Organized client folder structure (dated runs + index)
- [x] Intake doc (persists across engagements)

### What's NOT included (intentionally deferred)
- Win/Loss Analysis (no data source yet — add when CRM is wired)
- Customer Journey Mapping (covered partially by FAQ demand + E.E.A.T; full version = future)
- BCG Matrix / Product Portfolio (relevant for multi-product clients — add on demand)
- Stakeholder Analysis (enterprise clients only — add when needed)

---

## 6. ARES Compatibility Notes

When the program is built (next project), this maps directly:

| Skill | ARES Role | Agent |
|-------|----------|-------|
| strategic-intake | Director | Gemini Manager writes work-order.md to agent_inbox/ |
| competitive-intel | Worker | Claude reads work-order → pulls APIs → writes intel-brief.md |
| strategic-analysis | Worker | Claude reads intel-brief → runs frameworks → writes reports |

The `clients/` folder structure becomes the Firestore schema:
```
clients/{clientId}/runs/{runDate}/{document}
```

---

## 7. Next Project: Strategic Analysis Program

To be specced separately after skills are built.

**Direction:** B+C hybrid
- Local Next.js app (runs at localhost or subdomain)
- Integrates with ARES dashboard
- Automates API calls (DataForSEO, Similarweb, SpyFu, etc.)
- Generates and stores all reports
- Subdomain: `intel.[domain]` or `strategy.[domain]` on Ashish's existing domain

---

## 8. Implementation Notes

- Follow existing skill pattern: frontmatter → SKILL.md (decision flow) → references/ (on demand)
- Skill names follow existing namespace: `strategic/strategic-intake`, `strategic/competitive-intel`, `strategic/strategic-analysis`
- Each framework in references/frameworks/ is a concise reference doc — not a full skill itself
- All outputs are markdown — program phase converts to PDF/PPTX
- Client slugs: lowercase-hyphenated, e.g. `centre-willow`, `goldwater-law`
